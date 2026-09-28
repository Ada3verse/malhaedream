import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AiShortcutLinks from '../components/AiShortcutLinks'
import DarkModeToggle from '../components/DarkModeToggle'
import FileUploadGuideBox from '../components/FileUploadGuideBox'
import Modal from '../components/Modal'
import OptionCards from '../components/OptionCards'
import PromptExplanationPanel from '../components/PromptExplanationPanel'
import PromptFollowUpBox from '../components/PromptFollowUpBox'
import PromptRefineBox from '../components/PromptRefineBox'
import PromptRefineGuideBox from '../components/PromptRefineGuideBox'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useToast } from '../components/Toast'
import { SUBJECT_TAGS } from '../constants/tags'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { generateImagePrompt, getTemplates, refinePrompt } from '../utils/templateEngine'
import { autoSavePrompt, markPromptSaved } from '../utils/prompts'
import { stripMarkers } from '../utils/promptMarkers'
import { savePreset, getPresets, deletePreset } from '../utils/presets'

const DEFAULT_IMAGE_TEMPLATE_NAME = '이미지 생성 프롬프트'

const TOOL_OPTIONS = [
  { value: 'chatgpt', label: 'ChatGPT (GPT Image 1.5 · Duct-tape)' },
  { value: 'gemini', label: 'Gemini (Imagen 4 · nano banana)' },
]

const TOOL_INFO_MAP = {
  'ChatGPT (GPT Image 1.5 · Duct-tape)':
    '💡 GPT Image 1.5는 사실적인 이미지와 복잡한 장면 표현에 강해요. 영문 프롬프트를 사용하면 더 좋은 결과를 얻을 수 있어요. (유료 플랜에서 더 많이 사용 가능)',
  'Gemini (Imagen 4 · nano banana)':
    '💡 Imagen 4는 일러스트와 예술적 스타일에 강해요. 영문 프롬프트를 사용하면 더 좋은 결과를 얻을 수 있어요. (유료 플랜에서 더 많이 사용 가능)',
}

const PURPOSE_OPTIONS = [
  { value: 'lesson', label: '📚 수업 자료 삽화' },
  { value: 'presentation', label: '📊 발표 배경 이미지' },
  { value: 'worksheet', label: '📄 학습지 삽화' },
  { value: 'activity', label: '🎨 창의 활동 예시' },
  { value: 'announcement', label: '📢 게시물·안내판' },
  { value: 'etc', label: '🖼️ 기타' },
]

const PURPOSE_PLACEHOLDER_MAP = {
  '📚 수업 자료 삽화': '예: 광합성 과정을 설명하는 식물 세포 단면도, 밝고 교육적인 스타일',
  '📊 발표 배경 이미지': '예: 미래 기술 도시 풍경, 파란색 계열, 미니멀하고 세련된 느낌',
  '📄 학습지 삽화': '예: 수학 문제 옆에 들어갈 귀여운 캐릭터, 흑백 선화 스타일',
  '🎨 창의 활동 예시': '예: 환경 보호 포스터에 어울리는 지구와 나무 일러스트',
  '📢 게시물·안내판': '예: 독서의 달 행사 안내 배경, 책과 별이 있는 따뜻한 느낌',
  '🖼️ 기타': '어떤 이미지를 만들고 싶으신가요? 구체적으로 설명할수록 좋아요',
}

const DEFAULT_TOPIC_PLACEHOLDER = '예: 봄 소풍을 떠나는 초등학생들의 모습'

const STYLE_OPTIONS = [
  '사실적인',
  '일러스트',
  '수채화',
  '픽셀아트',
  '미니멀',
  '교과서 삽화풍',
  '선화(흑백)',
  '귀여운 캐릭터',
]
const MOOD_OPTIONS = [
  '밝고 따뜻한',
  '차갑고 세련된',
  '몽환적인',
  '역동적인',
  '차분한',
  '교육적인',
  '집중하게 하는',
  '호기심 자극하는',
]
export default function ImagePromptPage() {
  const user = useAuthGuard()
  const showToast = useToast()
  const location = useLocation()
  const [purpose, setPurpose] = useState('')
  const [tool, setTool] = useState(TOOL_OPTIONS[0].label)
  const [topic, setTopic] = useState('')
  const [styles, setStyles] = useState([])
  const [moods, setMoods] = useState([])
  const [result, setResult] = useState(null)
  const [historyId, setHistoryId] = useState(null)
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [imageTemplateName, setImageTemplateName] = useState(
    location.state?.templateName ?? DEFAULT_IMAGE_TEMPLATE_NAME,
  )
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [presets, setPresets] = useState([])
  const [showPresets, setShowPresets] = useState(false)
  const [showPresetNameModal, setShowPresetNameModal] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    getTemplates('image').then((templates) => {
      if (templates[0]?.name) setImageTemplateName(templates[0].name)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    getPresets({ nickname: user.nickname, deviceId: user.deviceId, type: 'image' })
      .then(setPresets)
      .catch(() => {})
  }, [user])

  if (!user) return null

  const topicPlaceholder = PURPOSE_PLACEHOLDER_MAP[purpose] ?? DEFAULT_TOPIC_PLACEHOLDER
  const toolInfo = TOOL_INFO_MAP[tool]
  const selectedToolValue = TOOL_OPTIONS.find((option) => option.label === tool)?.value

  const handleGenerate = () => {
    if (generating) return

    setGenerateError('')

    if (!tool) {
      setResult(null)
      setIsRefined(false)
      setGenerateError('사용할 도구를 먼저 선택해주세요.')
      return
    }

    if (!styles.length && !moods.length) {
      showToast('스타일 또는 분위기 키워드를 하나 이상 선택해주세요.', 'warning')
      return
    }

    setGenerating(true)
    try {
      const generated = generateImagePrompt(tool, topic, styles, moods)

      if (!generated) {
        setResult(null)
        setIsRefined(false)
        setGenerateError('선택한 도구에 대한 템플릿을 찾을 수 없습니다.')
        return
      }

      setResult(generated)
      setIsRefined(false)
      setIsCopied(false)
      setHistoryId(null)
      autoSavePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'image',
        content: stripMarkers(generated.ko),
        templateName: imageTemplateName,
      }).then(setHistoryId).catch(() => {})
    } finally {
      setGenerating(false)
    }
  }

  const handleLoadPreset = (preset) => {
    const { inputs } = preset
    if (inputs.purpose !== undefined) setPurpose(inputs.purpose)
    if (inputs.tool) setTool(inputs.tool)
    if (inputs.topic !== undefined) setTopic(inputs.topic)
    if (inputs.styles) setStyles(inputs.styles)
    if (inputs.moods) setMoods(inputs.moods)
    setShowPresets(false)
    showToast(`'${preset.name}' 설정을 불러왔어요.`, 'success')
  }

  const handleSavePresetClick = () => {
    setPresetName('')
    setShowPresetNameModal(true)
  }

  const handleSavePreset = async () => {
    const trimmed = presetName.trim()
    if (!trimmed) return
    try {
      await savePreset({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'image',
        name: trimmed,
        inputs: { purpose, tool, topic, styles, moods },
      })
      const updated = await getPresets({ nickname: user.nickname, deviceId: user.deviceId, type: 'image' })
      setPresets(updated)
      showToast('즐겨찾기에 저장되었습니다!', 'success')
    } catch {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setShowPresetNameModal(false)
    }
  }

  const handleDeletePreset = async (id) => {
    try {
      await deletePreset(id)
      setPresets((prev) => prev.filter((p) => p.id !== id))
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const refinedText = refinePrompt(result.ko, quickFixes, customRequest)

    setResult({ en: null, ko: refinedText })
    setIsRefined(true)
    setIsCopied(false)
  }

  const handleSaveClick = () => {
    if (!result) {
      showToast('먼저 프롬프트를 생성해주세요.', 'warning')
      return
    }

    setSelectedTags([])
    setShowTagModal(true)
  }

  const performSave = async (tags) => {
    const content = stripMarkers(result.ko)

    try {
      if (historyId) {
        await markPromptSaved(historyId, { tags, isShared: true })
      } else {
        const { savePrompt } = await import('../utils/prompts')
        await savePrompt({
          nickname: user.nickname,
          deviceId: user.deviceId,
          type: 'image',
          content,
          templateName: imageTemplateName,
          tags,
        })
      }
      showToast('저장되었습니다!', 'success')
    } catch {
      showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error')
    } finally {
      setShowTagModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-mint-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <Link
          to="/home"
          className="text-sm text-mint-700 transition hover:text-slate-700 dark:text-white/90 dark:hover:text-white"
        >
          ← 돌아가기
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          🖼️ 이미지 생성 프롬프트
        </h1>

        {presets.length > 0 && (
          <div className="mt-4 rounded-xl border border-mint-100 bg-mint-50/60 p-3 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <span>⭐ 즐겨찾기 설정 불러오기</span>
              <span className="text-slate-400">{showPresets ? '▲' : '▼'}</span>
            </button>
            {showPresets && (
              <div className="mt-2 flex flex-col gap-1.5">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left text-sm text-slate-700 hover:text-mint-700 dark:text-slate-200 dark:hover:text-mint-400"
                    >
                      {preset.name}
                      {preset.inputs.purpose && (
                        <span className="ml-1.5 text-xs text-slate-400">({preset.inputs.purpose.replace(/^.*?\s/, '')})</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-xs text-slate-300 hover:text-red-400 dark:text-slate-500 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              어떤 용도로 사용하실 건가요?
            </h2>
            <OptionCards options={PURPOSE_OPTIONS} onChange={setPurpose} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">사용할 도구</h2>
            <OptionCards options={TOOL_OPTIONS} value={selectedToolValue} onChange={setTool} />
            {toolInfo && (
              <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {toolInfo}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              어떤 이미지를 만들고 싶으신가요?
            </h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder={topicPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-700/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {!topic.trim() && (
              <p className="mt-1 text-xs text-slate-400">주제를 입력해주세요.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">스타일 키워드</h2>
            <TagToggleGroup options={STYLE_OPTIONS} allowCustom onChange={setStyles} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">분위기 키워드</h2>
            <TagToggleGroup options={MOOD_OPTIONS} allowCustom onChange={setMoods} />
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!topic.trim() || generating}
              className="flex-1 rounded-lg bg-gradient-to-br from-mint-700 to-mint-600 py-2.5 text-sm font-medium text-white shadow-md shadow-mint-700/20 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
            >
              {generating ? '생성 중...' : '프롬프트 생성'}
            </button>
            <button
              type="button"
              onClick={handleSavePresetClick}
              title="현재 설정을 즐겨찾기로 저장"
              className="rounded-lg border border-mint-300 px-3 py-2.5 text-sm text-mint-700 transition hover:bg-mint-50 dark:border-mint-500/40 dark:text-mint-400 dark:hover:bg-mint-500/10"
            >
              ⭐
            </button>
          </div>

          {generateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {generateError}
            </p>
          )}

          <PromptResultBox
            result={result}
            onSave={handleSaveClick}
            refined={isRefined}
            onEdit={setResult}
            onCopy={() => setIsCopied(true)}
            title="생성된 프롬프트 (ChatGPT / Gemini에 붙여넣기)"
            hint="💡 한국어 주제와 영문 키워드를 조합한 프롬프트예요. 대부분의 AI 이미지 생성 도구에서 잘 작동합니다."
          />

          {result && <PromptExplanationPanel type="image" />}

          {result && <PromptRefineGuideBox />}

          {result && (
            <PromptRefineBox type="image" onRefine={handleRefine} />
          )}

          {result && <PromptFollowUpBox type="image" toolLabel="ChatGPT/Gemini" />}

          {result && <AiShortcutLinks isCopied={isCopied} links={['ChatGPT', 'Gemini']} prompt={stripMarkers(result.ko)} />}

          {result && <FileUploadGuideBox type="image" />}
        </div>
      </main>

      {showPresetNameModal && (
        <Modal
          title="즐겨찾기 저장"
          onClose={() => setShowPresetNameModal(false)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPresetNameModal(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1 rounded-lg bg-gradient-to-br from-mint-700 to-mint-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          }
        >
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            현재 설정(용도, 도구, 스타일, 분위기)을 저장합니다.
          </p>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
            placeholder="예: 수업자료 사실적 스타일"
            maxLength={30}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-700/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </Modal>
      )}

      {showTagModal && (
        <Modal
          title="과목 태그 선택"
          onClose={() => setShowTagModal(false)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => performSave([])}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                건너뛰기
              </button>
              <button
                type="button"
                onClick={() => performSave(selectedTags)}
                className="flex-1 rounded-lg bg-gradient-to-br from-mint-700 to-mint-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          }
        >
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            이 프롬프트에 해당하는 과목을 선택해주세요 (복수 선택 가능)
          </p>
          <TagToggleGroup options={SUBJECT_TAGS} onChange={setSelectedTags} />
        </Modal>
      )}
    </div>
  )
}

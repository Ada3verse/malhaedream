import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AiShortcutLinks from '../components/AiShortcutLinks'
import DarkModeToggle from '../components/DarkModeToggle'
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
import { getCompletenessLevel, getImageCompletenessScore } from '../utils/completeness'
import { generateImagePrompt, getTemplates, refinePrompt } from '../utils/templateEngine'
import { savePrompt } from '../utils/prompts'
import { stripMarkers } from '../utils/promptMarkers'

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
const REFINE_OPTIONS = [
  '더 밝게',
  '더 어둡게',
  '인물 추가',
  '배경 강조',
  '색감 더 풍부하게',
  '단순하게',
  '더 사실적으로',
  '더 추상적으로',
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
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [imageTemplateName, setImageTemplateName] = useState(
    location.state?.templateName ?? DEFAULT_IMAGE_TEMPLATE_NAME,
  )
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    getTemplates('image').then((templates) => {
      if (templates[0]?.name) setImageTemplateName(templates[0].name)
    })
  }, [])

  if (!user) return null

  const topicPlaceholder = PURPOSE_PLACEHOLDER_MAP[purpose] ?? DEFAULT_TOPIC_PLACEHOLDER
  const toolInfo = TOOL_INFO_MAP[tool]
  const selectedToolValue = TOOL_OPTIONS.find((option) => option.label === tool)?.value
  const completenessScore = getImageCompletenessScore(purpose, topic, styles, moods)
  const completenessLevel = getCompletenessLevel(completenessScore)

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
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const originalPromptText = result.en
      ? `${result.en}\n\n[한국어 해석]\n${result.ko}`
      : result.ko
    const refinedText = refinePrompt(originalPromptText, quickFixes, customRequest)

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
    const content = result.en
      ? `${stripMarkers(result.en)}\n\n[한국어 해석]\n${stripMarkers(result.ko)}`
      : stripMarkers(result.ko)

    try {
      await savePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'image',
        content,
        templateName: imageTemplateName,
        tags,
      })
      showToast('저장되었습니다!', 'success')
    } catch {
      showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error')
    } finally {
      setShowTagModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-violet-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <Link
          to="/home"
          className="text-sm text-navy-600 transition hover:text-navy-700 dark:text-white/90 dark:hover:text-white"
        >
          ← 돌아가기
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
          🖼️ 이미지 생성 프롬프트
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">
              어떤 용도로 사용하실 건가요?
            </h2>
            <OptionCards options={PURPOSE_OPTIONS} onChange={setPurpose} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">사용할 도구</h2>
            <OptionCards options={TOOL_OPTIONS} value={selectedToolValue} onChange={setTool} />
            {toolInfo && (
              <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {toolInfo}
              </p>
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <h2 className="text-sm font-medium text-navy-700 dark:text-slate-300">
                어떤 이미지를 만들고 싶으신가요?
              </h2>
              <div className={`flex items-center gap-1.5 text-sm ${completenessLevel.colorClass}`}>
                <span className="tracking-widest" aria-hidden="true">
                  {'●'.repeat(completenessScore)}
                  {'○'.repeat(5 - completenessScore)}
                </span>
                <span className="text-xs">{completenessLevel.message}</span>
              </div>
            </div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder={topicPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {!topic.trim() && (
              <p className="mt-1 text-xs text-slate-400">주제를 입력해주세요.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">스타일 키워드</h2>
            <TagToggleGroup options={STYLE_OPTIONS} allowCustom onChange={setStyles} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">분위기 키워드</h2>
            <TagToggleGroup options={MOOD_OPTIONS} allowCustom onChange={setMoods} />
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
          >
            {generating ? '생성 중...' : '프롬프트 생성'}
          </button>

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
          />

          {result && <PromptExplanationPanel type="image" />}

          {result && <PromptRefineGuideBox />}

          {result && (
            <PromptRefineBox options={REFINE_OPTIONS} onRefine={handleRefine} />
          )}

          {result && <PromptFollowUpBox type="image" />}

          {result && <AiShortcutLinks isCopied={isCopied} />}

          {result && (
            <p className="text-center text-xs text-sky-700 dark:text-sky-400">
              💡 영문 프롬프트를 복사해서 사용하세요.
            </p>
          )}
        </div>
      </main>

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
                className="flex-1 rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
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

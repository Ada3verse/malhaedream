import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AiShortcutLinks from '../components/AiShortcutLinks'
import DarkModeToggle from '../components/DarkModeToggle'
import Modal from '../components/Modal'
import OptionCards from '../components/OptionCards'
import PromptRefineBox from '../components/PromptRefineBox'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useToast } from '../components/Toast'
import { SUBJECT_TAGS } from '../constants/tags'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { generatePromptFromTemplate, getTemplates, refinePrompt } from '../utils/templateEngine'
import { savePrompt } from '../utils/prompts'

const TONE_OPTIONS = ['공식적인', '친근한', '간결한', '상세한']
const FORMAT_OPTIONS = ['개조식', '줄글', '표 포함']

export default function DocumentPromptPage() {
  const user = useAuthGuard()
  const showToast = useToast()
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [docTypeName, setDocTypeName] = useState('')
  const [content, setContent] = useState('')
  const [tones, setTones] = useState([])
  const [formats, setFormats] = useState([])
  const [result, setResult] = useState(null)
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])

  useEffect(() => {
    getTemplates('document')
      .then(setTemplates)
      .finally(() => setLoadingTemplates(false))
  }, [])

  if (!user) return null

  const docTypeOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }))

  const selectedTemplate = templates.find((template) => template.name === docTypeName)

  const handleGenerate = () => {
    if (generating) return

    setGenerateError('')

    if (!selectedTemplate) {
      setResult(null)
      setIsRefined(false)
      setGenerateError('문서 유형을 먼저 선택해주세요.')
      return
    }

    if (!tones.length && !formats.length) {
      showToast('말투 또는 출력 형식을 하나 이상 선택해주세요.', 'warning')
      return
    }

    setGenerating(true)
    try {
      const generated = generatePromptFromTemplate(selectedTemplate, content, tones, formats)
      setResult(generated)
      setIsRefined(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const refinedText = refinePrompt(result.ko, quickFixes, customRequest)
    setResult({ en: null, ko: refinedText })
    setIsRefined(true)
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
    try {
      await savePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'document',
        content: result.ko,
        templateName: selectedTemplate?.name,
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
        <DarkModeToggle className="!border-navy-600 !text-navy-600 hover:!bg-navy-50 dark:!border-white/30 dark:!text-white dark:hover:!bg-white/10" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
          📝 문서 작성 프롬프트
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">문서 유형</h2>
            {loadingTemplates ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : docTypeOptions.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 문서 템플릿이 없습니다.</p>
            ) : (
              <OptionCards options={docTypeOptions} onChange={setDocTypeName} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">
              어떤 내용의 문서인가요?
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="예: 2학기 학부모 공개수업 안내"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {!content.trim() && (
              <p className="mt-1 text-xs text-slate-400">핵심 내용을 입력해주세요.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">말투/톤</h2>
            <TagToggleGroup options={TONE_OPTIONS} onChange={setTones} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">출력 형식</h2>
            <TagToggleGroup options={FORMAT_OPTIONS} onChange={setFormats} />
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!content.trim() || generating}
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
          />

          {result && (
            <PromptRefineBox
              options={selectedTemplate?.quickFixes ?? []}
              onRefine={handleRefine}
            />
          )}

          {result && <AiShortcutLinks />}
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

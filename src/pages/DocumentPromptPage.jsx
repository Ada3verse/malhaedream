import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptRefineBox from '../components/PromptRefineBox'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { generatePromptFromTemplate, getTemplates, refinePrompt } from '../utils/templateEngine'
import { savePrompt } from '../utils/prompts'

const TONE_OPTIONS = ['공식적인', '친근한', '간결한', '상세한']
const FORMAT_OPTIONS = ['개조식', '줄글', '표 포함']

export default function DocumentPromptPage() {
  const user = useAuthGuard()
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [docTypeName, setDocTypeName] = useState('')
  const [content, setContent] = useState('')
  const [tones, setTones] = useState([])
  const [formats, setFormats] = useState([])
  const [result, setResult] = useState(null)
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')

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
    setGenerateError('')

    if (!selectedTemplate) {
      setResult(null)
      setIsRefined(false)
      setGenerateError('문서 유형을 먼저 선택해주세요.')
      return
    }

    const generated = generatePromptFromTemplate(selectedTemplate, content, tones, formats)
    setResult(generated)
    setIsRefined(false)
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const refinedText = refinePrompt(result.ko, quickFixes, customRequest)
    setResult({ en: null, ko: refinedText })
    setIsRefined(true)
  }

  const handleSave = async () => {
    if (!result) {
      alert('먼저 프롬프트를 생성해주세요.')
      return
    }

    try {
      await savePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'document',
        content: result.ko,
        templateName: selectedTemplate?.name,
      })
      alert('저장되었습니다!')
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <Link
          to="/home"
          className="text-sm text-white/90 transition hover:text-white"
        >
          ← 돌아가기
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800">
          📝 문서 작성 프롬프트
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">문서 유형</h2>
            {loadingTemplates ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : docTypeOptions.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 문서 템플릿이 없습니다.</p>
            ) : (
              <OptionCards options={docTypeOptions} onChange={setDocTypeName} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">
              어떤 내용의 문서인가요?
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="예: 2학기 학부모 공개수업 안내"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">말투/톤</h2>
            <TagToggleGroup options={TONE_OPTIONS} onChange={setTones} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">출력 형식</h2>
            <TagToggleGroup options={FORMAT_OPTIONS} onChange={setFormats} />
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-lg bg-navy-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg"
          >
            프롬프트 생성
          </button>

          {generateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {generateError}
            </p>
          )}

          <PromptResultBox result={result} onSave={handleSave} refined={isRefined} />

          {result && (
            <PromptRefineBox
              options={selectedTemplate?.quickFixes ?? []}
              onRefine={handleRefine}
            />
          )}
        </div>
      </main>
    </div>
  )
}

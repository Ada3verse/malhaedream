import { useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { callGeneratePrompt } from '../utils/api'
import { savePrompt } from '../utils/prompts'

const SYSTEM_PROMPT =
  '당신은 학교 현장에서 사용할 문서 작성을 돕는 프롬프트 작성 전문가입니다. 사용자가 제공한 문서 유형, 핵심 내용, 톤, 형식을 반영해 ChatGPT나 Claude에 바로 입력할 수 있는 프롬프트를 한국어로 작성하세요. 프롬프트 본문만 출력하고 다른 설명은 덧붙이지 마세요.'

const DOC_TYPE_OPTIONS = [
  { value: 'business-plan', label: '사업계획서' },
  { value: 'event-report', label: '행사보고서' },
  { value: 'notice', label: '가정통신문' },
  { value: 'custom', label: '기타(직접입력)', custom: true },
]

const TONE_OPTIONS = ['공식적인', '친근한', '간결한', '상세한']
const FORMAT_OPTIONS = ['개조식', '줄글', '표 포함']

export default function DocumentPromptPage() {
  const user = useAuthGuard()
  const [docType, setDocType] = useState('')
  const [content, setContent] = useState('')
  const [tones, setTones] = useState([])
  const [formats, setFormats] = useState([])
  const [result, setResult] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  if (!user) return null

  const handleGenerate = async () => {
    setGenerateError('')
    setGenerating(true)

    const userPrompt = `문서유형: ${docType || '미선택'}\n핵심내용: ${content || '미입력'}\n톤: ${
      tones.length ? tones.join(', ') : '미선택'
    }\n형식: ${
      formats.length ? formats.join(', ') : '미선택'
    }\n\n위 내용을 바탕으로 문서 작성 프롬프트를 작성해주세요.`

    try {
      const text = await callGeneratePrompt(SYSTEM_PROMPT, userPrompt)
      setResult(text)
    } catch (err) {
      setGenerateError(err.message || 'AI 프롬프트 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
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
        content: result,
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
            <OptionCards options={DOC_TYPE_OPTIONS} onChange={setDocType} />
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
            disabled={generating}
            className="rounded-lg bg-navy-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'AI가 프롬프트를 생성하고 있습니다...' : '프롬프트 생성'}
          </button>

          {generateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {generateError}
            </p>
          )}

          <PromptResultBox result={result} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}

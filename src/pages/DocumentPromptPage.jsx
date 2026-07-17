import { useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { savePrompt } from '../utils/prompts'

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

  if (!user) return null

  const handleGenerate = () => {
    setResult(
      `[Mock] 문서유형: ${docType || '미선택'} / 핵심내용: ${content || '미입력'} / 톤: ${
        tones.length ? tones.join(', ') : '미선택'
      } / 형식: ${
        formats.length ? formats.join(', ') : '미선택'
      } 에 맞는 프롬프트가 여기에 생성됩니다.`,
    )
  }

  const handleSave = async () => {
    if (!result) {
      alert('먼저 프롬프트를 생성해주세요.')
      return
    }

    try {
      await savePrompt({ nickname: user.nickname, type: 'document', content: result })
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
            className="rounded-lg bg-navy-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg"
          >
            프롬프트 생성
          </button>

          <PromptResultBox result={result} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}

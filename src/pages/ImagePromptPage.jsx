import { useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { generateImagePrompt } from '../utils/templateEngine'
import { savePrompt } from '../utils/prompts'

const TOOL_OPTIONS = [
  { value: 'chatgpt', label: 'ChatGPT (GPT Image 1.5 · Duct-tape)' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini (Imagen 4 · nano banana)' },
]

const CLAUDE_LABEL = TOOL_OPTIONS.find((option) => option.value === 'claude')?.label

const STYLE_OPTIONS = ['사실적인', '일러스트', '수채화', '픽셀아트', '미니멀']
const MOOD_OPTIONS = ['밝고 따뜻한', '차갑고 세련된', '몽환적인', '역동적인', '차분한']

export default function ImagePromptPage() {
  const user = useAuthGuard()
  const [tool, setTool] = useState('')
  const [topic, setTopic] = useState('')
  const [styles, setStyles] = useState([])
  const [moods, setMoods] = useState([])
  const [result, setResult] = useState(null)
  const [generateError, setGenerateError] = useState('')

  if (!user) return null

  const isEnglishTool = Boolean(tool) && tool !== CLAUDE_LABEL

  const handleGenerate = () => {
    setGenerateError('')

    if (!tool) {
      setResult(null)
      setGenerateError('사용할 도구를 먼저 선택해주세요.')
      return
    }

    const generated = generateImagePrompt(tool, topic, styles, moods)

    if (!generated) {
      setResult(null)
      setGenerateError('선택한 도구에 대한 템플릿을 찾을 수 없습니다.')
      return
    }

    setResult(generated)
  }

  const handleSave = async () => {
    if (!result) {
      alert('먼저 프롬프트를 생성해주세요.')
      return
    }

    const content = result.en ? `${result.en}\n\n[한국어 해석]\n${result.ko}` : result.ko

    try {
      await savePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'image',
        content,
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
          🖼️ 이미지 생성 프롬프트
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">사용할 도구</h2>
            <OptionCards options={TOOL_OPTIONS} onChange={setTool} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">
              어떤 이미지를 만들고 싶으신가요?
            </h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="예: 봄 소풍을 떠나는 초등학생들의 모습"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">스타일 키워드</h2>
            <TagToggleGroup options={STYLE_OPTIONS} allowCustom onChange={setStyles} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700">분위기 키워드</h2>
            <TagToggleGroup options={MOOD_OPTIONS} allowCustom onChange={setMoods} />
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

          <PromptResultBox result={result} onSave={handleSave} />

          {isEnglishTool && (
            <p className="text-center text-xs text-sky-700">
              💡 영문 프롬프트를 복사해서 사용하세요.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

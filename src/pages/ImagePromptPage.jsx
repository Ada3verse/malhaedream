import { useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { savePrompt } from '../utils/prompts'

const TOOL_OPTIONS = [
  { value: 'chatgpt', label: 'ChatGPT (DALL·E)' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
]

const STYLE_OPTIONS = ['사실적인', '일러스트', '수채화', '픽셀아트', '미니멀']
const MOOD_OPTIONS = ['밝고 따뜻한', '차갑고 세련된', '몽환적인', '역동적인', '차분한']

export default function ImagePromptPage() {
  const user = useAuthGuard()
  const [tool, setTool] = useState('')
  const [topic, setTopic] = useState('')
  const [styles, setStyles] = useState([])
  const [moods, setMoods] = useState([])
  const [result, setResult] = useState('')

  if (!user) return null

  const handleGenerate = () => {
    setResult(
      `[Mock] 선택한 툴: ${tool || '미선택'} / 주제: ${topic || '미입력'} / 스타일: ${
        styles.length ? styles.join(', ') : '미선택'
      } / 분위기: ${
        moods.length ? moods.join(', ') : '미선택'
      } 에 맞는 프롬프트가 여기에 생성됩니다.`,
    )
  }

  const handleSave = async () => {
    if (!result) {
      alert('먼저 프롬프트를 생성해주세요.')
      return
    }

    try {
      await savePrompt({ nickname: user.nickname, type: 'image', content: result })
      alert('저장되었습니다!')
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <Link to="/home" className="text-sm text-gray-600 hover:text-gray-900">
          ← 돌아가기
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-gray-900">🖼️ 이미지 생성 프롬프트</h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">사용할 도구</h2>
            <OptionCards options={TOOL_OPTIONS} onChange={setTool} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              어떤 이미지를 만들고 싶으신가요?
            </h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="예: 봄 소풍을 떠나는 초등학생들의 모습"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">스타일 키워드</h2>
            <TagToggleGroup options={STYLE_OPTIONS} allowCustom onChange={setStyles} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">분위기 키워드</h2>
            <TagToggleGroup options={MOOD_OPTIONS} allowCustom onChange={setMoods} />
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            프롬프트 생성
          </button>

          <PromptResultBox result={result} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCards from '../components/OptionCards'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { callGeneratePrompt } from '../utils/api'
import { savePrompt } from '../utils/prompts'

const TOOL_OPTIONS = [
  { value: 'chatgpt', label: 'ChatGPT (Duct-tape)' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini (nano banana2)' },
]

const CLAUDE_LABEL = TOOL_OPTIONS.find((option) => option.value === 'claude')?.label

function buildSystemPrompt(isEnglishTool) {
  if (!isEnglishTool) {
    return '당신은 이미지 생성 AI(Claude)에 바로 입력할 수 있는 고품질 프롬프트를 작성하는 전문가입니다. 사용자가 제공한 주제, 스타일, 분위기를 반영해 한국어로만 프롬프트를 작성하세요. 프롬프트 본문만 출력하고 다른 설명은 덧붙이지 마세요.'
  }

  return `당신은 이미지 생성 AI(DALL·E, Gemini 등)에 바로 입력할 수 있는 고품질 프롬프트를 작성하는 전문가입니다. 사용자가 제공한 주제, 스타일, 분위기를 반영해 프롬프트를 작성하세요.

반드시 아래 형식을 지켜서 작성하세요:
1. 영문 프롬프트를 먼저 작성합니다.
2. 한 줄을 띄웁니다.
3. "[한국어 해석]" 레이블을 작성합니다.
4. 그 아래에 영문 프롬프트의 한국어 번역을 작성합니다.

형식 예시:
A dreamy and emotional illustration of middle school students...

[한국어 해석]
몽환적이고 감성적인 일러스트 스타일로...

프롬프트 본문만 출력하고 다른 설명은 덧붙이지 마세요.`
}

const STYLE_OPTIONS = ['사실적인', '일러스트', '수채화', '픽셀아트', '미니멀']
const MOOD_OPTIONS = ['밝고 따뜻한', '차갑고 세련된', '몽환적인', '역동적인', '차분한']

export default function ImagePromptPage() {
  const user = useAuthGuard()
  const [tool, setTool] = useState('')
  const [topic, setTopic] = useState('')
  const [styles, setStyles] = useState([])
  const [moods, setMoods] = useState([])
  const [result, setResult] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  if (!user) return null

  const isEnglishTool = Boolean(tool) && tool !== CLAUDE_LABEL

  const handleGenerate = async () => {
    setGenerateError('')
    setGenerating(true)

    const userPrompt = `툴: ${tool || '미선택'}\n주제: ${topic || '미입력'}\n스타일: ${
      styles.length ? styles.join(', ') : '미선택'
    }\n분위기: ${
      moods.length ? moods.join(', ') : '미선택'
    }\n\n위 내용을 바탕으로 이미지 생성 프롬프트를 작성해주세요.`

    try {
      const text = await callGeneratePrompt(buildSystemPrompt(isEnglishTool), userPrompt)
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
        type: 'image',
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

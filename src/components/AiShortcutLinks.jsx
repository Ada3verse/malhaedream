const AI_CONFIGS = [
  {
    name: 'ChatGPT',
    baseUrl: 'https://chatgpt.com/',
    queryParam: 'q',
    emoji: '🤖',
    description: '텍스트·이미지 생성',
    className: 'bg-[#10a37f] hover:bg-[#0e8e6d]',
  },
  {
    name: 'Claude',
    baseUrl: 'https://claude.ai/new',
    queryParam: 'q',
    emoji: '🟠',
    description: '글쓰기·분석',
    className: 'bg-slate-700 hover:bg-slate-600',
  },
  {
    name: 'Gemini',
    baseUrl: 'https://gemini.google.com/app',
    queryParam: 'q',
    emoji: '✨',
    description: '검색·이미지 생성',
    className: 'bg-[#4285f4] hover:bg-[#3367d6]',
  },
]

function buildUrl(config, prompt) {
  if (!prompt) return config.baseUrl
  const url = new URL(config.baseUrl)
  url.searchParams.set(config.queryParam, prompt)
  return url.toString()
}

export default function AiShortcutLinks({ isCopied = false, links, prompt = '' }) {
  const visibleConfigs = links
    ? AI_CONFIGS.filter((ai) => links.includes(ai.name))
    : AI_CONFIGS
  const gridClass = visibleConfigs.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'

  const hasPrompt = Boolean(prompt.trim())

  return (
    <div className="rounded-2xl border border-mint-200 bg-mint-50 p-5 dark:border-mint-800 dark:bg-slate-800/60">
      <p className="text-center text-base font-bold text-slate-800 dark:text-white">
        ✨ 클릭 한 번으로 바로 사용해보세요!
      </p>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        {hasPrompt
          ? '프롬프트가 자동으로 입력된 상태로 열려요'
          : '먼저 프롬프트를 생성해주세요'}
      </p>

      <div className={`mt-4 grid grid-cols-1 gap-3 ${gridClass}`}>
        {visibleConfigs.map((ai) => {
          const href = buildUrl(ai, prompt)
          return (
            <a
              key={ai.name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!hasPrompt) e.preventDefault()
              }}
              className={`flex transform flex-col items-center gap-0.5 rounded-lg px-6 py-3 text-white shadow-md transition hover:-translate-y-0.5 ${ai.className} ${!hasPrompt ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="text-sm font-semibold">
                {ai.emoji} {ai.name}에서 열기
              </span>
              <span className="text-xs font-normal text-white/80">{ai.description}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

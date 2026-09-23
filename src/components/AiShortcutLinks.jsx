const AI_LINKS = [
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    emoji: '🤖',
    description: '텍스트·이미지 생성',
    className: 'bg-[#10a37f] hover:bg-[#0e8e6d]',
  },
  {
    name: 'Claude',
    url: 'https://claude.ai',
    emoji: '🟠',
    description: '글쓰기·분석',
    className: 'bg-navy-600 hover:bg-navy-700',
  },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    emoji: '✨',
    description: '검색·이미지 생성',
    className: 'bg-[#4285f4] hover:bg-[#3367d6]',
  },
]

export default function AiShortcutLinks({ isCopied = false }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950">
      <p className="text-center text-base font-bold text-navy-800 dark:text-white">
        ✨ 생성된 프롬프트를 바로 사용해보세요!
      </p>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        복사 버튼을 먼저 누른 후 아래 AI 서비스로 이동하세요
      </p>

      {!isCopied && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          📋 아직 복사하지 않으셨나요? 위의 복사 버튼을 먼저 눌러주세요!
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {AI_LINKS.map((ai) => (
          <a
            key={ai.name}
            href={ai.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex transform flex-col items-center gap-0.5 rounded-lg px-6 py-3 text-white shadow-md transition hover:-translate-y-0.5 ${ai.className}`}
          >
            <span className="text-sm font-semibold">
              {ai.emoji} {ai.name}
            </span>
            <span className="text-xs font-normal text-white/80">{ai.description}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

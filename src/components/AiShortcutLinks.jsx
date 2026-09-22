const AI_LINKS = [
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    emoji: '🤖',
    className: 'bg-[#10a37f] hover:bg-[#0e8e6d]',
  },
  {
    name: 'Claude',
    url: 'https://claude.ai',
    emoji: '🟠',
    className: 'bg-navy-600 hover:bg-navy-700',
  },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    emoji: '✨',
    className: 'bg-[#4285f4] hover:bg-[#3367d6]',
  },
]

export default function AiShortcutLinks() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-center text-sm font-semibold text-navy-700">
        이 프롬프트를 붙여넣어 보세요
      </p>
      <p className="mt-1 text-center text-xs text-slate-500">
        💡 복사 버튼을 먼저 누른 후 아래 버튼으로 이동하세요!
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {AI_LINKS.map((ai) => (
          <a
            key={ai.name}
            href={ai.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition ${ai.className}`}
          >
            {ai.emoji} {ai.name} 바로가기
          </a>
        ))}
      </div>
    </div>
  )
}

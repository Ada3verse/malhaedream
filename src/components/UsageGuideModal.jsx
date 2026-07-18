import { CIRCLED_NUMBERS } from '../constants/guide'
import Modal from './Modal'

const STEPS = [
  {
    title: '작업 유형 선택',
    body: (
      <>
        <p>홈 화면에서 원하는 작업을 선택하세요.</p>
        <ul className="mt-1 flex flex-col gap-1">
          <li>· 🖼️ 이미지 생성 프롬프트 → AI 이미지 생성 툴용 프롬프트</li>
          <li>· 📝 문서 작성 프롬프트 → 가정통신문, 계획서, 보고서 등</li>
        </ul>
      </>
    ),
  },
  {
    title: '조건 입력',
    body: (
      <ul className="flex flex-col gap-1">
        <li>· 사용할 AI 툴 선택 (ChatGPT / Claude / Gemini)</li>
        <li>· 핵심 내용을 짧게 입력하세요. (단어나 짧은 문장도 OK)</li>
        <li>· 원하는 스타일/톤 키워드를 클릭해서 선택하세요.</li>
      </ul>
    ),
  },
  {
    title: '프롬프트 생성',
    body: (
      <ul className="flex flex-col gap-1">
        <li>· [프롬프트 생성] 버튼을 클릭하면 AI가 자동으로 만들어줍니다.</li>
        <li>· 이미지 생성의 경우 영문 프롬프트 + 한국어 번역이 함께 제공돼요.</li>
      </ul>
    ),
  },
  {
    title: '복사 후 사용',
    body: (
      <ul className="flex flex-col gap-1">
        <li>· [복사] 버튼을 눌러 프롬프트를 복사하세요.</li>
        <li>
          · ChatGPT(chat.openai.com), Claude(claude.ai), Gemini(gemini.google.com)에
          붙여넣기!
        </li>
        <li>· 결과가 마음에 든다면 [저장] 버튼으로 보관함에 저장하세요.</li>
      </ul>
    ),
  },
]

function Section({ title, tone, children }) {
  return (
    <div className={`px-6 py-5 ${tone === 'alt' ? 'bg-slate-50' : 'bg-white'}`}>
      <h3 className="text-base font-bold text-navy-800">{title}</h3>
      <div className="mt-2 flex flex-col gap-2 text-sm text-slate-700">{children}</div>
    </div>
  )
}

export default function UsageGuideModal({ onClose }) {
  return (
    <Modal
      title="말해드림 사용 가이드"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      bodyClassName=""
    >
      <div className="flex flex-col divide-y divide-slate-100">
        <Section title="🤔 말해드림이 뭔가요?">
          <p className="whitespace-pre-line">
            {`AI에게 원하는 걸 잘 전달하려면 '프롬프트'를 잘 써야 해요.
하지만 어떻게 써야 할지 막막하셨죠?
말해드림은 키워드만 선택하거나 단어 또는 짧은 문장으로도 AI에게 전달할 최적의 프롬프트를 자동으로 만들어드립니다.
만들어진 프롬프트를 복사해서 ChatGPT, Claude, Gemini에 붙여넣기만 하면 돼요!`}
          </p>
        </Section>

        <Section title="📋 이렇게 사용하세요" tone="alt">
          <div className="flex flex-col gap-4">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <p className="font-bold text-navy-800">
                  {CIRCLED_NUMBERS[index]} STEP {index + 1}. {step.title}
                </p>
                <div className="mt-1 pl-1">{step.body}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="💡 이미지 생성 팁">
          <ul className="flex flex-col gap-1">
            <li>
              · ChatGPT(Duct-tape), Gemini(nano banana2) 사용 시 → 영문 프롬프트를
              복사해서 사용하세요
            </li>
            <li>· Claude 사용 시 → claude는 이미지 생성이 어려워요.</li>
            <li>· 스타일/분위기 키워드를 여러 개 선택할수록 더 구체적인 프롬프트가 만들어져요.</li>
          </ul>
        </Section>

        <Section title="📁 내 보관함" tone="alt">
          <ul className="flex flex-col gap-1">
            <li>· 마음에 드는 프롬프트는 [저장] 버튼으로 보관함에 저장하세요.</li>
            <li>· 헤더의 [내 보관함] 버튼에서 저장한 프롬프트를 다시 확인하고 복사할 수 있어요.</li>
            <li>· 저장된 프롬프트는 본인 계정에서만 볼 수 있어요.</li>
          </ul>
        </Section>

        <Section title="🔐 계정 관련">
          <ul className="flex flex-col gap-1">
            <li>· 처음 사용 시 닉네임과 PIN 4자리를 입력하면 자동으로 가입됩니다.</li>
            <li>· PIN을 5회 이상 틀리면 계정이 잠겨요. → 관리자(정경원 선생님)에게 문의하세요</li>
            <li>· PIN을 변경하고 싶으면 관리자에게 문의하세요.</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}

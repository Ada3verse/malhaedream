import Modal from './Modal'

const SECTIONS = [
  { heading: '1. 수집하는 개인정보 항목', body: '닉네임, PIN(비밀번호)' },
  { heading: '2. 개인정보 수집 및 이용 목적', body: '서비스 이용 및 본인 확인' },
  {
    heading: '3. 개인정보 보유 및 이용 기간',
    body: '보유기간: 해당 학년도 종료 시(매년 12월 31일)까지 보관 후 일괄 삭제',
  },
  { heading: '4. 개인정보의 파기', body: '보유기간 종료 후 지체 없이 파기합니다.' },
  {
    heading: '5. 이용자의 권리',
    body: '이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.',
  },
  { heading: '6. 문의', body: '동신중학교 정보교육 담당: 정경원' },
]

export default function PrivacyPolicyModal({ onClose }) {
  return (
    <Modal title="개인정보처리방침" onClose={onClose}>
      <p>
        동신중학교 말해드림 서비스(이하 &ldquo;서비스&rdquo;)는 이용자의
        개인정보를 소중히 여기며, 다음과 같이 개인정보처리방침을 안내합니다.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <h3 className="font-semibold text-navy-800">{section.heading}</h3>
            <p className="mt-1 text-slate-600">{section.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">시행일: 2026년 6월 30일</p>
    </Modal>
  )
}

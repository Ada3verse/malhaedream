import { CIRCLED_NUMBERS, GUIDE_STEPS } from '../constants/guide'
import Modal from './Modal'

export default function UsageGuideModal({ onClose }) {
  return (
    <Modal title="💡 말해드림 사용법" onClose={onClose}>
      <ol className="flex flex-col gap-3">
        {GUIDE_STEPS.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="font-semibold text-navy-700">
              {CIRCLED_NUMBERS[index]}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </Modal>
  )
}

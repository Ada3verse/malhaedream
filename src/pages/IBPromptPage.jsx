import { useState } from 'react'
import { Link } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import Modal from '../components/Modal'
import PromptResultBox from '../components/PromptResultBox'
import TagSelector from '../components/TagSelector'
import TagToggleGroup from '../components/TagToggleGroup'
import { useToast } from '../components/Toast'
import { SUBJECT_TAGS } from '../constants/tags'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { ibData } from '../utils/ibData'
import { savePrompt } from '../utils/prompts'
import { stripMarkers } from '../utils/promptMarkers'
import {
  generateIBATLPrompt,
  generateIBAssessmentPrompt,
  generateIBFormativePrompt,
  generateIBInquiryQuestionsPrompt,
  generateIBStatementPrompt,
  generateIBUnitPlanPrompt,
} from '../utils/templateEngine'

const IB_TEMPLATE_NAME = 'IB MYP 유닛 플랜 프롬프트'

const MODE_TABS = [
  { id: 'full', label: '전체 유닛 플랜' },
  { id: 'section', label: '섹션별 작성' },
]

const SECTION_TABS = [
  { id: 'inquiry', label: '탐구 질문' },
  { id: 'statement', label: '탐구 진술문' },
  { id: 'assessment', label: '총괄 평가' },
  { id: 'atl', label: 'ATL 기능' },
  { id: 'formative', label: '형성평가' },
]

const AI_TOOLS = ['ChatGPT', 'Claude', 'Gemini']

const RELATED_CONCEPTS_HINT =
  "핵심 개념이 큰 그림이라면, 관련 개념은 이 단원에서 그 큰 그림을 바라보는 창문이에요. 예를 들어 핵심 개념 '변화'를 과학 수업에서 다룬다면, '적응', '에너지', '균형' 같은 관련 개념으로 구체화할 수 있어요. 교과군 선택 후 목록에서 고르거나 직접 입력하세요."

const UNIT_KEYWORD_HINT =
  '이번 단원에서 학생들이 탐구할 내용을 핵심 단어나 짧은 문장으로 표현해주세요. 탐구 진술문의 씨앗이 될 내용이에요. 예: 플라스틱과 해양 생태계 / 독립운동과 정체성 / 함수와 실생활 패턴'

const DEFAULT_UNIT_KEYWORD_PLACEHOLDER = '예: 생태계의 균형과 인간의 책임'

function getUnitKeywordPlaceholder(subject) {
  return ibData.unitKeywordExamples[subject] ?? DEFAULT_UNIT_KEYWORD_PLACEHOLDER
}

const STATEMENT_KEYWORD_HINT = `탐구 진술문은 핵심 개념 + 관련 개념 + 세계적 맥락을 하나의 문장으로 연결한 거예요.
잘 만든 탐구 진술문 예시:
• 균형과 에너지의 관계는 생태계의 지속 가능성을 이해하는 데 어떻게 기여하는가?
• 변화와 적응의 개념은 역사 속 혁명을 어떻게 설명하는가?
여기에는 완성된 문장 대신, 핵심이 될 키워드나 탐구하고 싶은 내용을 자유롭게 적어주세요. AI가 탐구 진술문으로 완성해줄 거예요.`

function buildConceptSummary({ keyConcept, relatedConceptsText, globalContext }) {
  const leftParts = [keyConcept, relatedConceptsText].filter((value) => value && value.trim())
  const leftSide = leftParts.join(' + ')

  if (!leftSide && !globalContext) return ''
  if (!leftSide) return globalContext
  return globalContext ? `${leftSide} → ${globalContext}` : leftSide
}

const EMPTY_GRASPS = { goal: '', role: '', audience: '', situation: '', product: '', standards: '' }

const GRASPS_FIELDS = [
  {
    key: 'goal',
    label: '목표 (Goal)',
    hint: '학생이 해결해야 할 문제나 도전은 무엇인가요?',
    placeholder: '예: 지역 하천 오염 문제의 해결책 제안',
    detail:
      "단순히 '보고서 쓰기'가 아니라 실제로 해결해야 할 문제나 도전을 써주세요. 예: 우리 학교 쓰레기 분리수거 실태를 조사하고 개선안을 제안한다 / 지역 소상공인의 마케팅을 도와줄 방법을 찾는다",
  },
  {
    key: 'role',
    label: '역할 (Role)',
    hint: '학생이 맡는 역할은 무엇인가요?',
    placeholder: '예: 환경 연구원, 디자이너, 기자',
    detail:
      '학생이 전문가처럼 역할을 맡아요. 교과와 연결되는 역할이면 더 좋아요. 예: 환경 연구원 / 역사학자 / 도시 설계사 / 사회운동가 / 앱 개발자',
  },
  {
    key: 'audience',
    label: '청중 (Audience)',
    hint: '결과물을 보여줄 대상은 누구인가요?',
    placeholder: '예: 지역 주민, 학교 운영위원회',
    detail: '선생님이 아닌 실제 대상을 설정해요. 예: 학교 운영위원회 / 지역 주민 / 또래 학생 / 지방자치단체 / 소비자',
  },
  {
    key: 'situation',
    label: '상황 (Situation)',
    hint: '어떤 맥락에서 이 과제가 주어지나요?',
    placeholder: '예: 환경부로부터 보고서 제출 요청을 받은 상황',
    detail:
      '왜 이 과제가 필요한지 배경을 만들어줘요. 예: 환경부에서 청소년 의견을 요청했다 / 학교가 새 규정을 만들려고 학생 의견을 모은다',
  },
  {
    key: 'product',
    label: '결과물 (Product)',
    hint: '학생이 만들어야 할 최종 결과물은 무엇인가요?',
    placeholder: '예: 캠페인 포스터, 보고서, 발표 자료',
    detail:
      '구체적인 형태로 써주세요. 위에서 고른 평가 유형과 연결되면 더 좋아요. 예: A4 2장 보고서 / 3분 발표 + PPT / 포스터 1장 / 영상 2분 이내',
  },
  {
    key: 'standards',
    label: '성공 기준 (Standards)',
    hint: '어떤 기준으로 평가하나요?',
    placeholder: '예: IB 평가기준 A·B 반영, 근거 제시, 청중 고려',
    detail:
      '잘 만든 결과물은 어떤 모습인가요? IB 평가기준 A·B·C·D 중 어떤 걸 보는지 연결해주면 더 좋아요. 예: 기준 A - 개념 이해 반영 / 기준 C - 청중에 맞는 소통 방식 사용',
  },
]

function emptyFormativeStage() {
  return { purposes: [], types: [], description: '' }
}

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
const INPUT_CLASS = SELECT_CLASS

function Field({ label, hint, children }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">{label}</h2>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </section>
  )
}

function ConceptSummaryBanner({ summary }) {
  if (!summary) return null

  return (
    <p className="mb-2 flex items-start gap-1.5 rounded bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
      <span>📌</span>
      <span>선택하신 개념: {summary}</span>
    </p>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
      <option value="">{placeholder ?? '선택하세요'}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function MypYearButtons({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ibData.mypYears.map((year) => {
        const active = value === year
        return (
          <button
            key={year}
            type="button"
            onClick={() => onChange(year)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              active
                ? 'border-navy-600 bg-navy-600 text-white shadow-md shadow-navy-600/20 dark:border-blue-500 dark:bg-blue-500'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {year}
          </button>
        )
      })}
    </div>
  )
}

function AiToolButtons({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {AI_TOOLS.map((tool) => {
        const active = value === tool
        return (
          <button
            key={tool}
            type="button"
            onClick={() => onChange(tool)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              active
                ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20 dark:border-violet-500 dark:bg-violet-500'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {tool}
          </button>
        )
      })}
    </div>
  )
}

function combineRelatedConcepts(selected, customText) {
  const customItems = customText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return [...selected, ...customItems].join(', ')
}

function RelatedConceptsField({ subject, selected, onToggle, customText, onCustomChange }) {
  const concepts = ibData.relatedConceptsBySubject[subject]

  if (!subject || !concepts) {
    return (
      <input
        type="text"
        value={customText}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="예: 상호작용, 균형"
        className={INPUT_CLASS}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {concepts.map((concept) => {
          const checked = selected.includes(concept)
          return (
            <label
              key={concept}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                checked
                  ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(concept)}
                className="sr-only"
              />
              {concept}
            </label>
          )
        })}
      </div>
      <input
        type="text"
        value={customText}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="목록에 없는 개념은 여기에 직접 입력하세요 (쉼표로 구분)"
        className={INPUT_CLASS}
      />
    </div>
  )
}

function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-600">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-navy-700 dark:text-slate-300"
      >
        <span>{title}</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-600">{children}</div>
      )}
    </div>
  )
}

function GraspsFields({ value, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      {GRASPS_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
            {field.label}
          </label>
          <p className="mb-1.5 text-xs text-slate-400">{field.hint}</p>
          <input
            type="text"
            value={value[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={INPUT_CLASS}
          />
          {field.detail && <p className="mt-1.5 text-xs text-gray-400">{field.detail}</p>}
        </div>
      ))}
    </div>
  )
}

function FormativeAssessmentEditor({ stages, onChange }) {
  const addStage = () => {
    if (stages.length >= 3) return
    onChange([...stages, emptyFormativeStage()])
  }

  const removeStage = (index) => {
    onChange(stages.filter((_, i) => i !== index))
  }

  const updateStage = (index, patch) => {
    onChange(stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)))
  }

  const togglePurpose = (index, stage, label) => {
    const nextPurposes = stage.purposes.includes(label)
      ? stage.purposes.filter((item) => item !== label)
      : [...stage.purposes, label]
    updateStage(index, { purposes: nextPurposes })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-400">
        단원 진행 중 학생의 이해도를 확인하는 중간 평가예요. 총괄 평가로 가기 위한 디딤돌 역할을 해요.
        계획을 세워보세요.
      </p>

      {stages.map((stage, index) => {
        const selectedPurposeOptions = ibData.formativePurposeOptions.filter((option) =>
          stage.purposes.includes(option.label),
        )
        const recommendedTypes = [
          ...new Set(selectedPurposeOptions.flatMap((option) => option.recommendedTypes)),
        ]

        return (
          <div key={index} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-700 dark:text-slate-300">
                형성평가 계획 {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeStage(index)}
                aria-label="형성평가 계획 삭제"
                className="text-slate-400 transition hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">목적</p>
              <div className="flex flex-wrap gap-2">
                {ibData.formativePurposeOptions.map((option) => {
                  const active = stage.purposes.includes(option.label)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => togglePurpose(index, stage, option.label)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {selectedPurposeOptions.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {selectedPurposeOptions.map((option) => (
                    <p key={option.id} className="text-xs text-gray-400">
                      {option.hint}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">유형</p>
              {recommendedTypes.length > 0 && (
                <p className="mb-1.5 text-xs text-slate-400">✨ 선택한 목적에 어울리는 유형</p>
              )}
              <TagSelector
                categories={ibData.formativeTypeCategories}
                selected={stage.types}
                onChange={(types) => updateStage(index, { types })}
                highlightedTags={recommendedTypes}
              />
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                보충 설명 (선택)
              </p>
              <textarea
                value={stage.description}
                onChange={(e) => updateStage(index, { description: e.target.value })}
                rows={2}
                placeholder="자유롭게 입력하세요"
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>
          </div>
        )
      })}

      {stages.length < 3 && (
        <button
          type="button"
          onClick={addStage}
          className="self-start rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 transition hover:border-navy-400 hover:text-navy-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-500/50 dark:hover:text-blue-400"
        >
          + 형성평가 계획 추가
        </button>
      )}
    </div>
  )
}

function ExplorationRadioGroup({ globalContext, value, onChange }) {
  const context = ibData.globalContexts.find((item) => item.name === globalContext)
  if (!context) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      {context.explorations.map((exploration) => (
        <label
          key={exploration}
          className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${
            value === exploration
              ? 'border-navy-600 bg-navy-50 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-slate-200 hover:border-navy-300 dark:border-slate-600 dark:hover:border-blue-500/50'
          }`}
        >
          <input
            type="radio"
            name="exploration"
            checked={value === exploration}
            onChange={() => onChange(exploration)}
            className="mt-0.5 shrink-0"
          />
          <span className="text-slate-700 dark:text-slate-300">{exploration}</span>
        </label>
      ))}
    </div>
  )
}

export default function IBPromptPage() {
  const user = useAuthGuard()
  const showToast = useToast()

  const [mode, setMode] = useState('full')

  // 전체 유닛 플랜
  const [aiTool, setAiTool] = useState('ChatGPT')
  const [subject, setSubject] = useState('')
  const [mypYear, setMypYear] = useState('')
  const [keyConcept, setKeyConcept] = useState('')
  const [relatedConceptsSelected, setRelatedConceptsSelected] = useState([])
  const [relatedConceptsCustom, setRelatedConceptsCustom] = useState('')
  const [globalContext, setGlobalContext] = useState('')
  const [explorationSelected, setExplorationSelected] = useState('')
  const [statementKeyword, setStatementKeyword] = useState('')
  const [fullLessonActivitySelected, setFullLessonActivitySelected] = useState([])
  const [fullLessonActivityDescriptionText, setFullLessonActivityDescriptionText] = useState('')
  const [fullSummativeSelected, setFullSummativeSelected] = useState([])
  const [fullSummativeDescriptionText, setFullSummativeDescriptionText] = useState('')
  const [fullGrasps, setFullGrasps] = useState(EMPTY_GRASPS)
  const [fullFormativeStages, setFullFormativeStages] = useState([])

  // 섹션별 작성
  const [sectionSubject, setSectionSubject] = useState('')
  const [activeSection, setActiveSection] = useState('inquiry')
  const [sectionKeyConcept, setSectionKeyConcept] = useState('')
  const [sectionRelatedConceptsSelected, setSectionRelatedConceptsSelected] = useState([])
  const [sectionRelatedConceptsCustom, setSectionRelatedConceptsCustom] = useState('')
  const [sectionGlobalContext, setSectionGlobalContext] = useState('')
  const [sectionExploration, setSectionExploration] = useState('')
  const [sectionUnitKeyword, setSectionUnitKeyword] = useState('')
  const [sectionStatementKeyword, setSectionStatementKeyword] = useState('')
  const [sectionSummativeSelected, setSectionSummativeSelected] = useState([])
  const [sectionSummativeDescriptionText, setSectionSummativeDescriptionText] = useState('')
  const [sectionGrasps, setSectionGrasps] = useState(EMPTY_GRASPS)
  const [atlSelected, setAtlSelected] = useState('')
  const [sectionLessonActivitySelected, setSectionLessonActivitySelected] = useState([])
  const [sectionLessonActivityDescriptionText, setSectionLessonActivityDescriptionText] = useState('')
  const [sectionFormativeStages, setSectionFormativeStages] = useState([])

  const [result, setResult] = useState(null)
  const [generateError, setGenerateError] = useState('')
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])

  if (!user) return null

  const handleSubjectChange = (value) => {
    setSubject(value)
    setRelatedConceptsSelected([])
    setRelatedConceptsCustom('')
  }

  const handleSectionSubjectChange = (value) => {
    setSectionSubject(value)
    setSectionRelatedConceptsSelected([])
    setSectionRelatedConceptsCustom('')
    setSectionUnitKeyword('')
    setSectionStatementKeyword('')
  }

  const handleToggleRelatedConcept = (concept) => {
    setRelatedConceptsSelected((prev) =>
      prev.includes(concept) ? prev.filter((item) => item !== concept) : [...prev, concept],
    )
  }

  const handleToggleSectionRelatedConcept = (concept) => {
    setSectionRelatedConceptsSelected((prev) =>
      prev.includes(concept) ? prev.filter((item) => item !== concept) : [...prev, concept],
    )
  }

  const handleGlobalContextChange = (value) => {
    setGlobalContext(value)
    setExplorationSelected('')
  }

  const handleSectionGlobalContextChange = (value) => {
    setSectionGlobalContext(value)
    setSectionExploration('')
  }

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId)
    setGenerateError('')
  }

  const handleFullGraspsChange = (key, value) => {
    setFullGrasps((prev) => ({ ...prev, [key]: value }))
  }

  const handleSectionGraspsChange = (key, value) => {
    setSectionGrasps((prev) => ({ ...prev, [key]: value }))
  }

  const buildFormativeNotes = (stages) =>
    stages.map(
      (stage, index) =>
        `형성평가 계획 ${index + 1}(${stage.purposes.length ? stage.purposes.join(', ') : '목적 미정'}): ${
          stage.types.length ? stage.types.join(', ') : '유형 미정'
        }`,
    )

  const handleGenerateFull = () => {
    setGenerateError('')

    if (!subject || !mypYear || !keyConcept || !globalContext || !explorationSelected) {
      setGenerateError('교과군, MYP 학년, 핵심 개념, 세계적 맥락, 탐구(세부)를 모두 선택해주세요.')
      return
    }

    const generated = generateIBUnitPlanPrompt({
      subject,
      keyConceptsSelected: [keyConcept],
      relatedConceptsInput:
        combineRelatedConcepts(relatedConceptsSelected, relatedConceptsCustom) || '(입력 없음)',
      globalContext,
      explorationSelected,
      statementKeyword: statementKeyword.trim() || '(입력 없음)',
      mypYear,
      lessonActivity: fullLessonActivitySelected,
      lessonActivityDescription: fullLessonActivityDescriptionText.trim(),
      summativeDescription: fullSummativeSelected,
      grasps: fullGrasps,
      formativeAssessments: fullFormativeStages,
      aiTool,
    })

    setResult(generated)
  }

  const handleGenerateSection = () => {
    setGenerateError('')

    if (!sectionSubject) {
      setGenerateError('교과군을 먼저 선택해주세요.')
      return
    }

    if (!mypYear) {
      setGenerateError('MYP 학년을 먼저 선택해주세요.')
      return
    }

    if (activeSection === 'inquiry') {
      if (!sectionKeyConcept || !sectionGlobalContext || !sectionExploration) {
        setGenerateError('핵심 개념, 세계적 맥락, 탐구(세부)를 모두 선택해주세요.')
        return
      }
      setResult(
        generateIBInquiryQuestionsPrompt({
          subject: sectionSubject,
          mypYear,
          keyConceptsSelected: [sectionKeyConcept],
          globalContext: sectionGlobalContext,
          explorationSelected: sectionExploration,
          statementKeyword: sectionUnitKeyword.trim() || '(입력 없음)',
          aiTool,
        }),
      )
    } else if (activeSection === 'statement') {
      if (!sectionKeyConcept || !sectionGlobalContext || !sectionExploration) {
        setGenerateError('핵심 개념, 세계적 맥락, 탐구(세부)를 모두 선택해주세요.')
        return
      }
      setResult(
        generateIBStatementPrompt({
          subject: sectionSubject,
          mypYear,
          keyConceptsSelected: [sectionKeyConcept],
          relatedConceptsInput:
            combineRelatedConcepts(sectionRelatedConceptsSelected, sectionRelatedConceptsCustom) ||
            '(입력 없음)',
          globalContext: sectionGlobalContext,
          explorationSelected: sectionExploration,
          statementKeyword: sectionStatementKeyword.trim(),
          aiTool,
        }),
      )
    } else if (activeSection === 'assessment') {
      if (sectionSummativeSelected.length === 0) {
        setGenerateError('총괄 평가 유형을 하나 이상 선택해주세요.')
        return
      }
      setResult(
        generateIBAssessmentPrompt({
          subject: sectionSubject,
          mypYear,
          summativeDescription: [...sectionSummativeSelected, sectionSummativeDescriptionText.trim()].filter(
            Boolean,
          ),
          grasps: sectionGrasps,
          formativeNotes:
            sectionFormativeStages.length > 0 ? buildFormativeNotes(sectionFormativeStages) : undefined,
          aiTool,
        }),
      )
    } else if (activeSection === 'atl') {
      if (!atlSelected || sectionLessonActivitySelected.length === 0) {
        setGenerateError('ATL 카테고리를 선택하고 수업 활동 유형을 하나 이상 선택해주세요.')
        return
      }
      setResult(
        generateIBATLPrompt({
          subject: sectionSubject,
          mypYear,
          atlSelected,
          lessonActivity: sectionLessonActivitySelected,
          lessonActivityDescription: sectionLessonActivityDescriptionText.trim(),
          aiTool,
        }),
      )
    } else if (activeSection === 'formative') {
      if (sectionFormativeStages.length === 0) {
        setGenerateError('형성평가 계획을 최소 1개 추가해주세요.')
        return
      }
      setResult(
        generateIBFormativePrompt({
          subject: sectionSubject,
          mypYear,
          formativeAssessments: sectionFormativeStages,
          aiTool,
        }),
      )
    }
  }

  const handleSaveClick = () => {
    if (!result) {
      showToast('먼저 프롬프트를 생성해주세요.', 'warning')
      return
    }
    setSelectedTags([])
    setShowTagModal(true)
  }

  const performSave = async (tags) => {
    try {
      await savePrompt({
        nickname: user.nickname,
        deviceId: user.deviceId,
        type: 'ib',
        content: stripMarkers(result.ko),
        templateName: IB_TEMPLATE_NAME,
        tags,
      })
      showToast('저장되었습니다!', 'success')
    } catch {
      showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error')
    } finally {
      setShowTagModal(false)
    }
  }

  const fullConceptSummary = buildConceptSummary({
    keyConcept,
    relatedConceptsText: combineRelatedConcepts(relatedConceptsSelected, relatedConceptsCustom),
    globalContext,
  })

  const sectionConceptSummary = buildConceptSummary({
    keyConcept: sectionKeyConcept,
    relatedConceptsText: combineRelatedConcepts(sectionRelatedConceptsSelected, sectionRelatedConceptsCustom),
    globalContext: sectionGlobalContext,
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-violet-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <Link
          to="/home"
          className="text-sm text-navy-600 transition hover:text-navy-700 dark:text-white/90 dark:hover:text-white"
        >
          ← 돌아가기
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
          📋 IB MYP 유닛 플랜 프롬프트
        </h1>

        <div className="mt-5 flex gap-2">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id)
                setResult(null)
                setGenerateError('')
              }}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                mode === tab.id
                  ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20 dark:border-violet-500 dark:bg-violet-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'full' ? (
          <div className="mt-6 flex flex-col gap-6">
            <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
              교과군·개념·맥락을 입력하면 단원 설계 방향을 브레인스토밍해드려요. 각 섹션을 깊이 있게 작성하려면
              섹션별 작성 탭을 활용하세요.
            </p>

            <Field label="AI 툴 선택" hint="프롬프트를 어떤 AI 툴에 붙여넣을지 선택하세요.">
              <AiToolButtons value={aiTool} onChange={setAiTool} />
            </Field>

            <Field label="교과군">
              <Select value={subject} onChange={handleSubjectChange} options={ibData.subjects} />
            </Field>

            <Field label="MYP 학년">
              <MypYearButtons value={mypYear} onChange={setMypYear} />
            </Field>

            <Field label="핵심 개념 (Key Concept)">
              <Select value={keyConcept} onChange={setKeyConcept} options={ibData.keyConcepts} />
            </Field>

            <Field label="관련 개념 (Related Concepts)" hint={RELATED_CONCEPTS_HINT}>
              <RelatedConceptsField
                subject={subject}
                selected={relatedConceptsSelected}
                onToggle={handleToggleRelatedConcept}
                customText={relatedConceptsCustom}
                onCustomChange={setRelatedConceptsCustom}
              />
            </Field>

            <Field label="세계적 맥락 (Global Context)">
              <Select
                value={globalContext}
                onChange={handleGlobalContextChange}
                options={ibData.globalContexts.map((context) => context.name)}
              />
              <ExplorationRadioGroup
                globalContext={globalContext}
                value={explorationSelected}
                onChange={setExplorationSelected}
              />
            </Field>

            <Field label="탐구 진술문 키워드">
              <ConceptSummaryBanner summary={fullConceptSummary} />
              <input
                type="text"
                value={statementKeyword}
                onChange={(e) => setStatementKeyword(e.target.value)}
                placeholder={getUnitKeywordPlaceholder(subject)}
                className={INPUT_CLASS}
              />
              <p className="mt-1.5 whitespace-pre-line text-sm text-gray-500 dark:text-slate-400">
                {STATEMENT_KEYWORD_HINT}
              </p>
            </Field>

            <Field label="수업 활동 (선택)" hint="원하는 수업 활동 유형을 선택하면 더 구체적인 플랜이 만들어져요.">
              <TagSelector
                categories={ibData.lessonActivityCategories}
                selected={fullLessonActivitySelected}
                onChange={setFullLessonActivitySelected}
              />
              <textarea
                value={fullLessonActivityDescriptionText}
                onChange={(e) => setFullLessonActivityDescriptionText(e.target.value)}
                rows={2}
                placeholder="예: 모둠별로 자료를 조사하고 토의하여 발표 자료를 제작하는 활동"
                className={`${INPUT_CLASS} mt-2 resize-y`}
              />
              <p className="mt-1 text-xs text-slate-400">
                수업 활동 보충 설명 (선택): 위에서 선택한 활동 유형에 대해 추가로 설명하고 싶은 내용을 자유롭게
                적어주세요.
              </p>
            </Field>

            <Field label="총괄 평가 (선택)" hint="원하는 총괄 평가 유형을 선택하면 더 구체적인 플랜이 만들어져요.">
              <TagSelector
                categories={ibData.assessmentCategories}
                selected={fullSummativeSelected}
                onChange={setFullSummativeSelected}
              />

              <div className="mt-3">
                <Accordion title="📋 GRASPS로 더 구체화하기 (선택)">
                  <GraspsFields value={fullGrasps} onChange={handleFullGraspsChange} />
                </Accordion>
              </div>

              <textarea
                value={fullSummativeDescriptionText}
                onChange={(e) => setFullSummativeDescriptionText(e.target.value)}
                rows={2}
                placeholder="예: 모둠별로 역할을 나눠 캠페인 자료를 제작하고 전교생 앞에서 발표"
                className={`${INPUT_CLASS} mt-3 resize-y`}
              />
              <p className="mt-1 text-xs text-slate-400">
                보충 설명 (선택): 위에서 선택한 평가 방식에 대해 추가로 설명하고 싶은 내용을 자유롭게 적어주세요.
              </p>

              <div className="mt-3">
                <Accordion title="📝 형성평가 계획 추가하기 (선택)">
                  <FormativeAssessmentEditor stages={fullFormativeStages} onChange={setFullFormativeStages} />
                </Accordion>
              </div>
            </Field>

            <button
              type="button"
              onClick={handleGenerateFull}
              className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
            >
              프롬프트 생성
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            <Field label="AI 툴 선택" hint="프롬프트를 어떤 AI 툴에 붙여넣을지 선택하세요.">
              <AiToolButtons value={aiTool} onChange={setAiTool} />
            </Field>

            <Field label="교과군 (공통)">
              <Select
                value={sectionSubject}
                onChange={handleSectionSubjectChange}
                options={ibData.subjects}
              />
            </Field>

            <Field label="MYP 학년 (공통)">
              <MypYearButtons value={mypYear} onChange={setMypYear} />
            </Field>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SECTION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectSection(tab.id)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    activeSection === tab.id
                      ? 'border-navy-600 bg-navy-600 text-white shadow-md shadow-navy-600/20 dark:border-blue-500 dark:bg-blue-500'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSection === 'inquiry' && (
              <>
                <Field label="핵심 개념 (Key Concept)">
                  <Select
                    value={sectionKeyConcept}
                    onChange={setSectionKeyConcept}
                    options={ibData.keyConcepts}
                  />
                </Field>
                <Field label="세계적 맥락 (Global Context)">
                  <Select
                    value={sectionGlobalContext}
                    onChange={handleSectionGlobalContextChange}
                    options={ibData.globalContexts.map((context) => context.name)}
                  />
                  <ExplorationRadioGroup
                    globalContext={sectionGlobalContext}
                    value={sectionExploration}
                    onChange={setSectionExploration}
                  />
                </Field>
                <Field label="단원 키워드" hint={UNIT_KEYWORD_HINT}>
                  <input
                    type="text"
                    value={sectionUnitKeyword}
                    onChange={(e) => setSectionUnitKeyword(e.target.value)}
                    placeholder={getUnitKeywordPlaceholder(sectionSubject)}
                    className={INPUT_CLASS}
                  />
                </Field>
              </>
            )}

            {activeSection === 'statement' && (
              <>
                <Field label="핵심 개념 (Key Concept)">
                  <Select
                    value={sectionKeyConcept}
                    onChange={setSectionKeyConcept}
                    options={ibData.keyConcepts}
                  />
                </Field>
                <Field label="관련 개념 (Related Concepts)" hint={RELATED_CONCEPTS_HINT}>
                  <RelatedConceptsField
                    subject={sectionSubject}
                    selected={sectionRelatedConceptsSelected}
                    onToggle={handleToggleSectionRelatedConcept}
                    customText={sectionRelatedConceptsCustom}
                    onCustomChange={setSectionRelatedConceptsCustom}
                  />
                </Field>
                <Field label="세계적 맥락 (Global Context)">
                  <Select
                    value={sectionGlobalContext}
                    onChange={handleSectionGlobalContextChange}
                    options={ibData.globalContexts.map((context) => context.name)}
                  />
                  <ExplorationRadioGroup
                    globalContext={sectionGlobalContext}
                    value={sectionExploration}
                    onChange={setSectionExploration}
                  />
                </Field>
                <Field label="탐구 진술문 키워드">
                  <ConceptSummaryBanner summary={sectionConceptSummary} />
                  <input
                    type="text"
                    value={sectionStatementKeyword}
                    onChange={(e) => setSectionStatementKeyword(e.target.value)}
                    placeholder={getUnitKeywordPlaceholder(sectionSubject)}
                    className={INPUT_CLASS}
                  />
                  <p className="mt-1.5 whitespace-pre-line text-sm text-gray-500 dark:text-slate-400">
                    {STATEMENT_KEYWORD_HINT}
                  </p>
                </Field>
              </>
            )}

            {activeSection === 'assessment' && (
              <>
                <Field label="총괄 평가 간략 설명">
                  <TagSelector
                    categories={ibData.assessmentCategories}
                    selected={sectionSummativeSelected}
                    onChange={setSectionSummativeSelected}
                  />

                  <div className="mt-3">
                    <Accordion title="📋 GRASPS로 더 구체화하기 (선택)">
                      <GraspsFields value={sectionGrasps} onChange={handleSectionGraspsChange} />
                    </Accordion>
                  </div>

                  <textarea
                    value={sectionSummativeDescriptionText}
                    onChange={(e) => setSectionSummativeDescriptionText(e.target.value)}
                    rows={2}
                    placeholder="예: 모둠별로 역할을 나눠 캠페인 자료를 제작하고 전교생 앞에서 발표"
                    className={`${INPUT_CLASS} mt-3 resize-y`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    보충 설명 (선택): 위에서 선택한 평가 방식에 대해 추가로 설명하고 싶은 내용을 자유롭게
                    적어주세요.
                  </p>
                </Field>
              </>
            )}

            {activeSection === 'atl' && (
              <>
                <Field label="ATL 카테고리">
                  <Select value={atlSelected} onChange={setAtlSelected} options={ibData.atlCategories} />
                </Field>
                <Field label="수업 활동 설명">
                  <TagSelector
                    categories={ibData.lessonActivityCategories}
                    selected={sectionLessonActivitySelected}
                    onChange={setSectionLessonActivitySelected}
                  />
                  <textarea
                    value={sectionLessonActivityDescriptionText}
                    onChange={(e) => setSectionLessonActivityDescriptionText(e.target.value)}
                    rows={2}
                    placeholder="예: 모둠별로 자료를 조사하고 토의하여 발표 자료를 제작하는 활동"
                    className={`${INPUT_CLASS} mt-2 resize-y`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    수업 활동 보충 설명 (선택): 위에서 선택한 활동 유형에 대해 추가로 설명하고 싶은 내용을
                    자유롭게 적어주세요.
                  </p>
                </Field>
              </>
            )}

            {activeSection === 'formative' && (
              <Field label="형성평가 계획">
                <FormativeAssessmentEditor
                  stages={sectionFormativeStages}
                  onChange={setSectionFormativeStages}
                />
              </Field>
            )}

            <button
              type="button"
              onClick={handleGenerateSection}
              className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
            >
              프롬프트 생성
            </button>
          </div>
        )}

        {generateError && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {generateError}
          </p>
        )}

        <div className="mt-6">
          {mode === 'full' && result && (
            <p className="mb-3 rounded bg-blue-50 px-3 py-2 text-sm text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              💡 이 결과는 설계 방향 제안이에요. 마음에 드는 아이디어를 골라 섹션별 작성 탭에서 각 부분을
              완성해보세요.
            </p>
          )}
          <PromptResultBox
            result={result}
            onSave={handleSaveClick}
            onEdit={setResult}
            hint={`💡 위 프롬프트를 복사해서 ${aiTool}에 붙여넣으세요.`}
          />
        </div>
      </main>

      {showTagModal && (
        <Modal
          title="과목 태그 선택"
          onClose={() => setShowTagModal(false)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => performSave([])}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                건너뛰기
              </button>
              <button
                type="button"
                onClick={() => performSave(selectedTags)}
                className="flex-1 rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          }
        >
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            이 프롬프트에 해당하는 과목을 선택해주세요 (복수 선택 가능)
          </p>
          <TagToggleGroup options={SUBJECT_TAGS} onChange={setSelectedTags} />
        </Modal>
      )}
    </div>
  )
}

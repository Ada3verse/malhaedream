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
]

const AI_TOOLS = ['ChatGPT', 'Claude', 'Gemini']

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
  const [fullSummativeSelected, setFullSummativeSelected] = useState([])

  // 섹션별 작성
  const [sectionAiTool, setSectionAiTool] = useState('ChatGPT')
  const [sectionSubject, setSectionSubject] = useState('')
  const [activeSection, setActiveSection] = useState('inquiry')
  const [sectionKeyConcept, setSectionKeyConcept] = useState('')
  const [sectionRelatedConceptsSelected, setSectionRelatedConceptsSelected] = useState([])
  const [sectionRelatedConceptsCustom, setSectionRelatedConceptsCustom] = useState('')
  const [sectionGlobalContext, setSectionGlobalContext] = useState('')
  const [sectionExploration, setSectionExploration] = useState('')
  const [sectionUnitKeyword, setSectionUnitKeyword] = useState('')
  const [sectionMypYear, setSectionMypYear] = useState('')
  const [sectionSummativeSelected, setSectionSummativeSelected] = useState([])
  const [atlSelected, setAtlSelected] = useState('')
  const [sectionLessonActivitySelected, setSectionLessonActivitySelected] = useState([])

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
      summativeDescription: fullSummativeSelected,
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

    if (activeSection === 'inquiry') {
      if (!sectionKeyConcept || !sectionGlobalContext || !sectionExploration) {
        setGenerateError('핵심 개념, 세계적 맥락, 탐구(세부)를 모두 선택해주세요.')
        return
      }
      setResult(
        generateIBInquiryQuestionsPrompt({
          subject: sectionSubject,
          keyConceptsSelected: [sectionKeyConcept],
          globalContext: sectionGlobalContext,
          explorationSelected: sectionExploration,
          statementKeyword: sectionUnitKeyword.trim() || '(입력 없음)',
          aiTool: sectionAiTool,
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
          keyConceptsSelected: [sectionKeyConcept],
          relatedConceptsInput:
            combineRelatedConcepts(sectionRelatedConceptsSelected, sectionRelatedConceptsCustom) ||
            '(입력 없음)',
          globalContext: sectionGlobalContext,
          explorationSelected: sectionExploration,
          aiTool: sectionAiTool,
        }),
      )
    } else if (activeSection === 'assessment') {
      if (!sectionMypYear || sectionSummativeSelected.length === 0) {
        setGenerateError('MYP 학년을 선택하고 총괄 평가 유형을 하나 이상 선택해주세요.')
        return
      }
      setResult(
        generateIBAssessmentPrompt({
          subject: sectionSubject,
          mypYear: sectionMypYear,
          summativeDescription: sectionSummativeSelected,
          aiTool: sectionAiTool,
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
          atlSelected,
          lessonActivity: sectionLessonActivitySelected,
          aiTool: sectionAiTool,
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

            <Field
              label="관련 개념 (Related Concepts)"
              hint="1~2개를 선택하는 것을 권장해요. 목록에 없다면 직접 입력할 수 있어요."
            >
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

            <Field label="탐구 진술문 키워드" hint="완성하고 싶은 단원의 핵심 키워드를 자유롭게 입력하세요.">
              <input
                type="text"
                value={statementKeyword}
                onChange={(e) => setStatementKeyword(e.target.value)}
                placeholder="예: 생태계의 균형과 인간의 책임"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="수업 활동 (선택)" hint="원하는 수업 활동 유형을 선택하면 더 구체적인 플랜이 만들어져요.">
              <TagSelector
                categories={ibData.lessonActivityCategories}
                selected={fullLessonActivitySelected}
                onChange={setFullLessonActivitySelected}
              />
            </Field>

            <Field label="총괄 평가 (선택)" hint="원하는 총괄 평가 유형을 선택하면 더 구체적인 플랜이 만들어져요.">
              <TagSelector
                categories={ibData.assessmentCategories}
                selected={fullSummativeSelected}
                onChange={setFullSummativeSelected}
              />
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
              <AiToolButtons value={sectionAiTool} onChange={setSectionAiTool} />
            </Field>

            <Field label="교과군 (공통)">
              <Select
                value={sectionSubject}
                onChange={handleSectionSubjectChange}
                options={ibData.subjects}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                <Field label="단원 키워드">
                  <input
                    type="text"
                    value={sectionUnitKeyword}
                    onChange={(e) => setSectionUnitKeyword(e.target.value)}
                    placeholder="예: 생태계의 균형과 인간의 책임"
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
                <Field
                  label="관련 개념 (Related Concepts)"
                  hint="1~2개를 선택하는 것을 권장해요. 목록에 없다면 직접 입력할 수 있어요."
                >
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
              </>
            )}

            {activeSection === 'assessment' && (
              <>
                <Field label="MYP 학년">
                  <MypYearButtons value={sectionMypYear} onChange={setSectionMypYear} />
                </Field>
                <Field label="총괄 평가 간략 설명">
                  <TagSelector
                    categories={ibData.assessmentCategories}
                    selected={sectionSummativeSelected}
                    onChange={setSectionSummativeSelected}
                  />
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
                </Field>
              </>
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
          <PromptResultBox
            result={result}
            onSave={handleSaveClick}
            onEdit={setResult}
            hint={`💡 위 프롬프트를 복사해서 ${mode === 'full' ? aiTool : sectionAiTool}에 붙여넣으세요.`}
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

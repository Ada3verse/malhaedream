import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AiShortcutLinks from '../components/AiShortcutLinks'
import DarkModeToggle from '../components/DarkModeToggle'
import Modal from '../components/Modal'
import OptionCards from '../components/OptionCards'
import PromptRefineBox from '../components/PromptRefineBox'
import PromptResultBox from '../components/PromptResultBox'
import TagToggleGroup from '../components/TagToggleGroup'
import { useToast } from '../components/Toast'
import { SUBJECT_TAGS } from '../constants/tags'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { generatePromptFromTemplate, getTemplates, refinePrompt } from '../utils/templateEngine'
import { savePrompt } from '../utils/prompts'

const TONE_OPTIONS = ['공식적인', '친근한', '간결한', '상세한']
const FORMAT_OPTIONS = ['개조식', '줄글', '표 포함']

const DEFAULT_CONTENT_PLACEHOLDER =
  '어떤 내용의 문서인가요? 구체적으로 입력할수록 좋은 프롬프트가 생성됩니다.'

const CONTENT_PLACEHOLDER_MAP = {
  '가정통신문': '예: 10월 15일(수) 2학기 학부모 공개수업, 1~2교시, 참관 신청 필요',
  '사업계획서': '예: 2026학년도 독서교육 활성화 사업, 전교생 대상, 1학기 운영',
  '행사보고서': '예: 5월 15일 진로의 날 행사, 전교생 350명 참가, 직업체험 부스 10개 운영',
  '수업 지도안': '예: 중학교 2학년 과학, 광합성 단원, 모둠 실험 활동 포함, 45분 수업',
  '형성평가 문항': '예: 중학교 1학년 수학, 정수와 유리수 단원, 객관식 5문항+서술형 2문항',
  '수행평가 문항': '예: 중학교 3학년 국어, 논설문 쓰기, 5단계 채점 기준표 포함',
  '학습지': '예: 중학교 2학년 영어, 현재완료 시제, 빈칸 채우기+서술형 혼합',
  '지필평가 문제': '예: 중학교 2학년 역사, 조선 전기 단원, 객관식 15문항+서술형 5문항, 중간고사',
  '쪽지 시험': '예: 중학교 1학년 과학, 세포의 구조, 5문항, 수업 마무리용',
  '상담 일지': '예: 학교 부적응 학생 상담, 친구관계 어려움 호소, 담임-학생 면담',
  '공문 초안': '예: 2026학년도 학교스포츠클럽 운영 협조 요청, 교육청 수신',
  '회의록': '예: 2026년 9월 교직원 회의, 2학기 학사 일정 및 수행평가 계획 논의',
  '출장 보고서': '예: AI 활용 수업 역량강화 직무연수, 서울시교육연수원, 1일 6시간',
  '학생 피드백': '예: 중학교 2학년 과학 실험 보고서, 모둠 활동 참여도 우수, 보완점 제시',
  '독서 활동지': '예: 중학교 1학년 국어, 어린왕자(생텍쥐페리), 주제 탐구 및 토론 활동',
  '진로 탐색 활동지': '예: 중학교 2학년 진로, 직업 가치관 탐색, 자기이해 활동 포함',
  '학급 규칙 안내문': '예: 중학교 2학년 3반, 학기 초 학급 규칙, 스마트폰 사용·청소·발언 규칙 포함',
  '기타': '예: 원하는 문서 내용을 자유롭게 입력하세요',
}

const LESSON_ASSESSMENT_TEMPLATE_NAMES = [
  '수업 지도안',
  '학습지',
  '독서 활동지',
  '진로 탐색 활동지',
  '지필평가 문제',
  '형성평가 문항',
  '수행평가 문항',
  '쪽지 시험',
  '학생 피드백',
]

const LESSON_ASSESSMENT_GUIDE = {
  tags: ['학교급 예: 중학교', '학년 예: 2학년', '과목 예: 과학', '단원 예: 광합성', '수업활동 예: 모둠토론'],
  warning: '학년과 과목을 입력하면 훨씬 정확한 프롬프트가 생성됩니다.',
}

const GUIDE_TAGS_MAP = {
  ...Object.fromEntries(
    LESSON_ASSESSMENT_TEMPLATE_NAMES.map((name) => [name, LESSON_ASSESSMENT_GUIDE]),
  ),
  '가정통신문': {
    tags: ['행사명 예: 학부모 공개수업', '날짜 예: 10월 15일', '대상 예: 전교생 학부모', '준비물 예: 없음'],
    warning: '행사명과 날짜를 입력하면 더 구체적인 안내문이 생성됩니다.',
  },
  '사업계획서': {
    tags: ['사업명 예: 독서교육 활성화', '목적 예: 독서 습관 형성', '대상 예: 전교생', '기간 예: 1학기'],
    warning: '사업명과 목적을 입력하면 더 구체적인 계획서가 생성됩니다.',
  },
  '행사보고서': {
    tags: ['행사명 예: 진로의 날', '일시 예: 5월 15일', '참가인원 예: 350명', '주요내용 예: 직업체험'],
    warning: '행사명과 일시를 입력하면 더 구체적인 보고서가 생성됩니다.',
  },
  '공문 초안': {
    tags: ['수신처 예: 교육청', '목적 예: 협조 요청', '주요내용 예: 스포츠클럽 운영'],
    warning: '수신처와 목적을 입력하면 더 정확한 공문이 생성됩니다.',
  },
  '회의록': {
    tags: ['회의명 예: 9월 교직원 회의', '주요안건 예: 2학기 수행평가 계획', '참석자 예: 전교직원'],
    warning: '회의명과 주요 안건을 입력하면 더 구체적인 회의록이 생성됩니다.',
  },
  '출장 보고서': {
    tags: ['연수명 예: AI 활용 수업 연수', '기관 예: 서울시교육연수원', '날짜 예: 9월 20일', '시간 예: 6시간'],
    warning: '연수명과 기관을 입력하면 더 구체적인 보고서가 생성됩니다.',
  },
  '학급 규칙 안내문': {
    tags: ['학년·반 예: 2학년 3반', '주요규칙 예: 스마트폰·청소·발언'],
    warning: '학년·반과 주요 규칙 항목을 입력하면 더 맞춤화된 안내문이 생성됩니다.',
  },
  '상담 일지': {
    tags: ['상담유형 예: 학생상담', '주요내용 예: 친구관계 어려움', '상담장소 예: 상담실'],
    warning: '상담 유형과 주요 내용을 입력하면 더 구체적인 일지가 생성됩니다.',
  },
}

function extractGuideTagLabel(tag) {
  return tag.split(' 예:')[0].trim()
}

const COMPLETENESS_LEVELS = [
  { message: '내용을 입력해주세요', colorClass: 'text-red-500 dark:text-red-400' },
  { message: '조금 더 구체적으로 입력해보세요', colorClass: 'text-orange-500 dark:text-orange-400' },
  { message: '괜찮아요! 더 추가하면 더 좋아져요', colorClass: 'text-yellow-500 dark:text-yellow-400' },
  { message: '좋아요! 거의 완성됐어요', colorClass: 'text-lime-500 dark:text-lime-400' },
  { message: '완벽해요! 최적의 프롬프트가 생성됩니다', colorClass: 'text-green-600 dark:text-green-400' },
]

const ADMIN_TEMPLATE_NAMES = ['가정통신문', '사업계획서', '행사보고서', '공문 초안', '회의록', '출장 보고서']
const CLASS_TEMPLATE_NAMES = ['학급 규칙 안내문', '상담 일지']

const GRADE_KEYWORDS = ['1학년', '2학년', '3학년', '1년', '2년', '3년']
const SUBJECT_KEYWORDS = [
  '국어', '수학', '영어', '과학', '사회', '역사', '도덕', '미술',
  '음악', '체육', '기술가정', '중국어', '진로', '보건',
]
const DATE_KEYWORDS = ['월', '일', '날짜', '기간']
const CLASS_INFO_KEYWORDS = ['1학년', '2학년', '3학년', '반']

function includesAnyKeyword(content, keywords) {
  return keywords.some((keyword) => content.includes(keyword))
}

function getCompletenessScore(docTypeName, content, tones, formats) {
  const trimmed = content.trim()
  const hasTone = tones.length > 0
  const hasFormat = formats.length > 0
  let score = 0

  if (LESSON_ASSESSMENT_TEMPLATE_NAMES.includes(docTypeName)) {
    const hasGrade = includesAnyKeyword(trimmed, GRADE_KEYWORDS)
    const hasSubject = includesAnyKeyword(trimmed, SUBJECT_KEYWORDS)
    if (hasGrade) score += 1
    if (hasSubject) score += 1
    if (trimmed.length >= 20 && (hasGrade || hasSubject)) score += 1
    if (hasTone) score += 1
    if (hasFormat) score += 1
    return score
  }

  if (ADMIN_TEMPLATE_NAMES.includes(docTypeName)) {
    if (trimmed.length >= 10) score += 1
    if (trimmed.length >= 30) score += 1
    if (includesAnyKeyword(trimmed, DATE_KEYWORDS)) score += 1
    if (hasTone) score += 1
    if (hasFormat) score += 1
    return score
  }

  if (CLASS_TEMPLATE_NAMES.includes(docTypeName)) {
    if (trimmed.length >= 10) score += 1
    if (trimmed.length >= 30) score += 1
    if (includesAnyKeyword(trimmed, CLASS_INFO_KEYWORDS)) score += 1
    if (hasTone) score += 1
    if (hasFormat) score += 1
    return score
  }

  if (trimmed.length >= 10) score += 2
  if (trimmed.length >= 50) score += 1
  if (hasTone) score += 1
  if (hasFormat) score += 1
  return score
}

function getCompletenessLevel(score) {
  return COMPLETENESS_LEVELS[Math.max(score - 1, 0)]
}

function hasRequiredGuideInfo(docTypeName, content) {
  const trimmed = content.trim()

  if (LESSON_ASSESSMENT_TEMPLATE_NAMES.includes(docTypeName)) {
    return (
      includesAnyKeyword(trimmed, GRADE_KEYWORDS) &&
      includesAnyKeyword(trimmed, SUBJECT_KEYWORDS)
    )
  }

  if (ADMIN_TEMPLATE_NAMES.includes(docTypeName)) {
    return includesAnyKeyword(trimmed, DATE_KEYWORDS)
  }

  if (CLASS_TEMPLATE_NAMES.includes(docTypeName)) {
    return includesAnyKeyword(trimmed, CLASS_INFO_KEYWORDS)
  }

  return false
}

export default function DocumentPromptPage() {
  const user = useAuthGuard()
  const showToast = useToast()
  const location = useLocation()
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [docTypeName, setDocTypeName] = useState(location.state?.templateName ?? '')
  const [content, setContent] = useState('')
  const [tones, setTones] = useState([])
  const [formats, setFormats] = useState([])
  const [result, setResult] = useState(null)
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    getTemplates('document')
      .then(setTemplates)
      .finally(() => setLoadingTemplates(false))
  }, [])

  if (!user) return null

  const docTypeOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }))

  const selectedTemplate = templates.find((template) => template.name === docTypeName)
  const contentPlaceholder =
    CONTENT_PLACEHOLDER_MAP[docTypeName] ?? DEFAULT_CONTENT_PLACEHOLDER
  const guideConfig = GUIDE_TAGS_MAP[docTypeName]
  const completenessScore = getCompletenessScore(docTypeName, content, tones, formats)
  const completenessLevel = getCompletenessLevel(completenessScore)
  const shouldShowGuideWarning =
    Boolean(guideConfig) &&
    completenessScore < 4 &&
    !hasRequiredGuideInfo(docTypeName, content)

  const handleInsertGuideTag = (tag) => {
    const label = extractGuideTagLabel(tag)
    setContent((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n')
      return `${prev}${needsSpace ? ' ' : ''}${label}: `
    })
  }

  const handleGenerate = () => {
    if (generating) return

    setGenerateError('')

    if (!selectedTemplate) {
      setResult(null)
      setIsRefined(false)
      setGenerateError('문서 유형을 먼저 선택해주세요.')
      return
    }

    if (content.trim().length < 10) {
      showToast(
        '내용이 너무 짧아요. 더 구체적으로 입력할수록 좋은 프롬프트가 생성됩니다.',
        'warning',
      )
    }

    if (!tones.length && !formats.length) {
      showToast('말투 또는 출력 형식을 하나 이상 선택해주세요.', 'warning')
      return
    }

    setGenerating(true)
    try {
      const generated = generatePromptFromTemplate(selectedTemplate, content, tones, formats)
      setResult(generated)
      setIsRefined(false)
      setIsCopied(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const refinedText = refinePrompt(result.ko, quickFixes, customRequest)
    setResult({ en: null, ko: refinedText })
    setIsRefined(true)
    setIsCopied(false)
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
        type: 'document',
        content: result.ko,
        templateName: selectedTemplate?.name,
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
          📝 문서 작성 프롬프트
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">문서 유형</h2>
            {loadingTemplates ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : docTypeOptions.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 문서 템플릿이 없습니다.</p>
            ) : (
              <OptionCards
                options={docTypeOptions}
                value={selectedTemplate?.id}
                onChange={setDocTypeName}
              />
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <h2 className="text-sm font-medium text-navy-700 dark:text-slate-300">
                어떤 내용의 문서인가요?
              </h2>
              <div className={`flex items-center gap-1.5 text-sm ${completenessLevel.colorClass}`}>
                <span className="tracking-widest" aria-hidden="true">
                  {'●'.repeat(completenessScore)}
                  {'○'.repeat(5 - completenessScore)}
                </span>
                <span className="text-xs">{completenessLevel.message}</span>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder={contentPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {!content.trim() && (
              <p className="mt-1 text-xs text-slate-400">핵심 내용을 입력해주세요.</p>
            )}

            {guideConfig && (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {guideConfig.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertGuideTag(tag)}
                      className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      [{tag}]
                    </button>
                  ))}
                </div>
                {shouldShowGuideWarning && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ {guideConfig.warning}
                  </p>
                )}
              </>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">말투/톤</h2>
            <TagToggleGroup options={TONE_OPTIONS} onChange={setTones} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">출력 형식</h2>
            <TagToggleGroup options={FORMAT_OPTIONS} onChange={setFormats} />
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!content.trim() || generating}
            className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
          >
            {generating ? '생성 중...' : '프롬프트 생성'}
          </button>

          {generateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {generateError}
            </p>
          )}

          <PromptResultBox
            result={result}
            onSave={handleSaveClick}
            refined={isRefined}
            onEdit={setResult}
            onCopy={() => setIsCopied(true)}
          />

          {result && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <p className="font-semibold">💬 결과가 마음에 드시나요?</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                <li>원하는 결과가 아니라면 아래 [프롬프트 보완] 기능을 활용해보세요</li>
                <li>더 구체적인 조건을 추가하거나 "더 간결하게", "더 구체적으로" 버튼을 눌러보세요</li>
                <li>보완을 반복할수록 더 정확한 프롬프트가 완성됩니다 ✨</li>
              </ul>
            </div>
          )}

          {result && (
            <PromptRefineBox
              options={selectedTemplate?.quickFixes ?? []}
              onRefine={handleRefine}
            />
          )}

          {result && <AiShortcutLinks isCopied={isCopied} />}
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

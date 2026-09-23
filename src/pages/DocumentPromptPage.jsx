import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function DocumentPromptPage() {
  const user = useAuthGuard()
  const showToast = useToast()
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [docTypeName, setDocTypeName] = useState('')
  const [content, setContent] = useState('')
  const [tones, setTones] = useState([])
  const [formats, setFormats] = useState([])
  const [result, setResult] = useState(null)
  const [isRefined, setIsRefined] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])

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

  const handleGenerate = () => {
    if (generating) return

    setGenerateError('')

    if (!selectedTemplate) {
      setResult(null)
      setIsRefined(false)
      setGenerateError('문서 유형을 먼저 선택해주세요.')
      return
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
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = (quickFixes, customRequest) => {
    if (!result) return

    const refinedText = refinePrompt(result.ko, quickFixes, customRequest)
    setResult({ en: null, ko: refinedText })
    setIsRefined(true)
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
              <OptionCards options={docTypeOptions} onChange={setDocTypeName} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-navy-700 dark:text-slate-300">
              어떤 내용의 문서인가요?
            </h2>
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
            <p className="mt-1 text-xs text-slate-400">
              💡 학교급·학년·과목·단원을 함께 입력하면 더 정확한 프롬프트가 생성됩니다.
            </p>
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
          />

          {result && (
            <PromptRefineBox
              options={selectedTemplate?.quickFixes ?? []}
              onRefine={handleRefine}
            />
          )}

          {result && <AiShortcutLinks />}
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

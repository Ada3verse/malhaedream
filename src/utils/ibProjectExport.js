// IB 프로젝트를 학교 원본 양식(UNIT 3. 시트)에 그대로 채워 xlsx로 내보냅니다.
//
// 주의: xlsx-js-style(SheetJS 계열)로는 원본 파일의 폰트·테두리·배경색이
// 읽기 단계에서 소실되어 서식이 전부 깨지는 것을 확인했습니다(회귀 테스트 완료).
// 대신 ExcelJS를 사용해 원본 스타일을 그대로 보존한 채 지정된 셀의 값만 덮어씁니다.
// 번들 크기 때문에 사용 시점에 동적으로 import합니다.

const TEMPLATE_URL = '/ib_unit_plan_template.xlsx'
const TEMPLATE_SHEET_NAME = 'UNIT 3.'

const MYP_YEAR_TO_GRADE = {
  'MYP 1 (중1)': '1학년',
  'MYP 2 (중2)': '2학년',
  'MYP 3 (중3)': '3학년',
}

export function mypYearToGrade(mypYear) {
  return MYP_YEAR_TO_GRADE[mypYear] || '1학년'
}

function joinIfArray(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

function sanitizeForFilename(value) {
  return (value || '').toString().trim().replace(/[\\/:*?"<>|]/g, '_') || '무제'
}

function formatDateStamp(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function exportIBProjectToXlsx(project) {
  if (!project) throw new Error('내보낼 프로젝트 정보가 없습니다.')

  const ExcelJS = (await import('exceljs')).default

  const response = await fetch(TEMPLATE_URL)
  if (!response.ok) {
    throw new Error('원본 양식 템플릿 파일을 불러오지 못했습니다.')
  }
  const buffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.getWorksheet(TEMPLATE_SHEET_NAME)
  if (!sheet) {
    throw new Error(`'${TEMPLATE_SHEET_NAME}' 시트를 찾을 수 없습니다.`)
  }

  // 병합 셀은 top-left(앵커) 셀에만 값을 씁니다.
  const setCell = (ref, value) => {
    if (value === undefined || value === null || value === '') return
    sheet.getCell(ref).value = value
  }

  const sections = project.sections || {}
  const relatedConcepts = joinIfArray(project.relatedConcepts)

  // 기본 정보
  setCell('B3', project.teacherName || '') // 교사 이름 (B3:C3 병합)
  setCell('E3', project.subject || '') // 교과군(과목) (E3:G3 병합)
  setCell('B4', project.title || '') // 단원명 (B4:C5 병합)
  setCell('E4', mypYearToGrade(project.mypYear)) // 학년 - MYP 학년(E5)은 이 값을 참조하는 수식이므로 건드리지 않음

  // 개념/맥락
  setCell('A9', project.keyConcept || '') // 주요 개념 (A9:B10 병합)
  setCell('C9', relatedConcepts) // 관련 개념 (C9:D9 병합)
  setCell('E9', project.globalContext || '') // 세계적 맥락 (E9:G9 병합)
  setCell('F10', project.exploration || '') // 탐구(Exploration) (F10:G10 병합)

  // 섹션별 AI 생성 프롬프트
  // - 탐구 진술문 전용 프롬프트가 없으면, 전체 유닛 플랜 프롬프트를 대신 넣어줍니다.
  setCell('A12', sections.statement?.prompt || sections.unitPlan?.prompt || '') // 탐구 진술문 (A12:G12 병합)
  setCell('A15', sections.inquiry?.prompt || '') // 탐구 질문 - 사실적/개념적/논쟁적 질문이 프롬프트 하나에 포함되어 있어 A15에 전체 삽입 (A15:G15 병합)
  setCell('D22', sections.assessment?.prompt || '') // GRASPS 총괄평가 - Goal 입력 칸(D22:E22 병합)에 전체 삽입
  setCell('A31', sections.atl?.prompt || '') // ATL - 수업에서 드러나는 방식 입력 칸(A31:G31 병합)

  const outBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const filename = `IB유닛플랜_${sanitizeForFilename(project.subject)}_${sanitizeForFilename(project.title)}_${formatDateStamp()}.xlsx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return filename
}

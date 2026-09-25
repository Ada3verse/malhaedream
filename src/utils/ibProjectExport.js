import XLSX from 'xlsx-js-style'

const COLS = [
  { wch: 40 },
  { wch: 20 },
  { wch: 40 },
  { wch: 20 },
  { wch: 30 },
  { wch: 30 },
]

const TITLE_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
  fill: { patternType: 'solid', fgColor: { rgb: '1E3A5F' } },
  alignment: { vertical: 'center', wrapText: true },
}

const SECTION_STYLE = {
  font: { bold: true },
  fill: { patternType: 'solid', fgColor: { rgb: 'E8EDF5' } },
  alignment: { vertical: 'center', wrapText: true },
}

const LABEL_STYLE = {
  font: { bold: true },
  alignment: { vertical: 'top', wrapText: true },
}

const BASE_STYLE = {
  alignment: { vertical: 'top', wrapText: true },
}

function cell(value, style = BASE_STYLE) {
  return { v: value ?? '', t: 's', s: style }
}

function estimateRowHeight(text) {
  if (!text) return 60
  const charsPerLine = 90
  const wrappedLines = text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
  return Math.max(60, wrappedLines * 15)
}

function getSectionPrompt(project, sectionKey) {
  return project.sections?.[sectionKey]?.prompt || '(미작성)'
}

function getRelatedConceptsText(relatedConcepts) {
  if (Array.isArray(relatedConcepts)) return relatedConcepts.join(', ')
  return relatedConcepts || ''
}

function buildSheetData(project) {
  const relatedConceptsText = getRelatedConceptsText(project.relatedConcepts)

  const statementPrompt = getSectionPrompt(project, 'statement')
  const inquiryPrompt = getSectionPrompt(project, 'inquiry_questions')
  const assessmentPrompt = getSectionPrompt(project, 'assessment')
  const atlPrompt = getSectionPrompt(project, 'atl')
  const formativePrompt = getSectionPrompt(project, 'formative')
  const briefingPrompt = getSectionPrompt(project, 'briefing')

  const rows = [
    // 1
    [
      cell('MYP Unit Plan(단원 계획서)', TITLE_STYLE),
      cell('', TITLE_STYLE),
      cell('[저장방법] 파일명 : 교과군(과목) 성명', TITLE_STYLE),
      cell('', TITLE_STYLE),
      cell('', TITLE_STYLE),
      cell('', TITLE_STYLE),
    ],
    // 2
    [],
    // 3
    [
      cell('교사', LABEL_STYLE),
      cell(''),
      cell(''),
      cell('교과군(과목)', LABEL_STYLE),
      cell(''),
      cell(project.subject),
    ],
    // 4
    [
      cell('단원명', LABEL_STYLE),
      cell(''),
      cell(project.title),
      cell('학년', LABEL_STYLE),
      cell('1학년'),
      cell('차시(45분)'),
    ],
    // 5
    [
      cell(''),
      cell(''),
      cell(''),
      cell('MYP 학년', LABEL_STYLE),
      cell(project.mypYear),
      cell('시간(60분)'),
    ],
    // 6
    [],
    // 7
    [cell('1. 탐구(Inquiry) : 탐구 설계 및 목표 설정', SECTION_STYLE)],
    // 8
    [
      cell('주요 개념(Key Concept)', LABEL_STYLE),
      cell(''),
      cell('관련 개념(Related Concept(s))', LABEL_STYLE),
      cell(''),
      cell('세계적 맥락(Global Contexts)', LABEL_STYLE),
    ],
    // 9
    [
      cell(project.keyConcept),
      cell(''),
      cell(relatedConceptsText),
      cell(''),
      cell(project.globalContext),
    ],
    // 10
    [],
    // 11
    [cell(''), cell(''), cell(''), cell(''), cell('탐구(Exploration)', LABEL_STYLE), cell(project.exploration)],
    // 12
    [cell('탐구 진술문(Statement of inquiry)', SECTION_STYLE)],
    // 13
    [cell(statementPrompt)],
    // 14
    [],
    // 15
    [cell('탐구 질문(Inquiry Questions)', SECTION_STYLE)],
    // 16
    [cell('- 사실적 질문(Factual)', LABEL_STYLE)],
    // 17
    [cell(inquiryPrompt)],
    // 18
    [],
    // 19
    [cell('총괄 평가(Summative Assessment)', SECTION_STYLE)],
    // 20
    [cell(assessmentPrompt)],
    // 21
    [],
    // 22
    [cell('학습법(ATL)', SECTION_STYLE)],
    // 23
    [cell(atlPrompt)],
    // 24
    [],
    // 25
    [cell('2. 실행(Action) : 탐구를 통한 학습 및 교수하기', SECTION_STYLE)],
    // 26
    [cell('형성 평가(Formative Assessment)', SECTION_STYLE)],
    // 27
    [cell(formativePrompt)],
    // 28
    [],
    // 29
    [cell('전체 브리핑 메모', SECTION_STYLE)],
    // 30
    [cell(briefingPrompt)],
  ]

  const contentRowHeights = {
    13: statementPrompt,
    17: inquiryPrompt,
    20: assessmentPrompt,
    23: atlPrompt,
    27: formativePrompt,
    30: briefingPrompt,
  }

  return { rows, contentRowHeights }
}

export function exportIBProjectToXlsx(project) {
  const { rows, contentRowHeights } = buildSheetData(project)

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = COLS

  const sectionTitleRows = [7, 12, 15, 19, 22, 25, 26, 29]
  const contentRows = [13, 16, 17, 20, 23, 27, 30]
  const mergeRows = [...sectionTitleRows, ...contentRows]

  ws['!merges'] = mergeRows.map((rowNumber) => ({
    s: { r: rowNumber - 1, c: 0 },
    e: { r: rowNumber - 1, c: 5 },
  }))
  ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 5 } })

  ws['!rows'] = rows.map((_, index) => {
    const rowNumber = index + 1
    if (contentRowHeights[rowNumber] !== undefined) {
      return { hpt: estimateRowHeight(contentRowHeights[rowNumber]) }
    }
    return undefined
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'UNIT 3')

  const today = new Date().toISOString().slice(0, 10)
  const safeSubject = (project.subject || '교과군').replace(/[\\/:*?"<>|]/g, '_')
  const safeTitle = (project.title || '제목없음').replace(/[\\/:*?"<>|]/g, '_')
  const filename = `IB유닛플랜_${safeSubject}_${safeTitle}_${today}.xlsx`

  XLSX.writeFile(wb, filename)
}

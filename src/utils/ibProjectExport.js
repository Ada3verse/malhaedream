/**
 * IB 프로젝트를 원본 학교 양식 템플릿 기반으로 xlsx 내보내기
 * 서버(Vercel Python API)에서 openpyxl로 템플릿을 채워 반환한 파일을 다운로드한다.
 */
export async function exportIBProjectToXlsx(project) {
  const info = {
    unitTitle: project.title || '',
    subject: project.subject || '',
    mypYear: project.mypYear || '',
    keyConcept: project.keyConcept || '',
    relatedConcepts: project.relatedConcepts || '',
    globalContext: project.globalContext || '',
    contextExploration: project.exploration || '',
  }

  const response = await fetch('/api/export-ib-xlsx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ info, sections: project.sections || {} }),
  })

  if (!response.ok) {
    let msg = 'xlsx 생성 실패'
    try {
      const err = await response.json()
      msg = err.error || msg
    } catch {
      // 응답 본문이 JSON이 아닐 경우 기본 메시지 사용
    }
    throw new Error(msg)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  let filename = 'IB_단원계획서.xlsx'
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/)
  const plainMatch = disposition.match(/filename="([^"]+)"/)
  if (encodedMatch) filename = decodeURIComponent(encodedMatch[1])
  else if (plainMatch) filename = plainMatch[1]

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

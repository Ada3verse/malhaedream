import * as XLSX from 'xlsx-js-style';

/**
 * IB 프로젝트를 원본 학교 양식 템플릿 기반으로 xlsx 내보내기
 * UNIT 4. 시트의 특정 셀에만 내용을 채워서 다운로드
 *
 * 셀 위치 (분석 완료):
 * B3: 교사 이름
 * E3: 교과군(과목) [E3~G3 병합]
 * B4: 단원명 [B4~C5 병합]
 * E4: 학년 드롭다운 (1학년/2학년/3학년)
 * A9: 주요 개념 [A9~B10 병합]
 * C9: 관련 개념 [C9~D9 병합]
 * E9: 세계적 맥락 [E9~G9 병합] (드롭다운)
 * F10: 탐구 Exploration [F10~G10 병합]
 * A12: 탐구 진술문 [A12~G12 병합]
 * A15: 사실적 질문 [A15~G15 병합]
 * A17: 개념적 질문 [A17~G17 병합]
 * A19: 논쟁적 질문 [A19~G19 병합]
 * D22: Goal [D22~E22 병합]
 * D23: Role [D23~E23 병합]
 * D24: Audience [D24~E24 병합]
 * D25: Situation [D25~E25 병합]
 * D26: Performance [D26~E26 병합]
 * D27: Standards [D27~E27 병합]
 * A30: ATL 카테고리1, B30: ATL 군집1, C30: ATL 세부내용1 [C30~G30 병합]
 * A33: ATL 카테고리2, B33: ATL 군집2, C33: ATL 세부내용2 [C33~G33 병합]
 * E42: 형성평가 [E42~F42 병합]
 */

function mypYearToGrade(mypYear) {
  if (!mypYear) return '1학년';
  const map = {
    'MYP 1': '1학년',
    'MYP 2': '2학년',
    'MYP 3': '3학년',
  };
  if (map[mypYear]) return map[mypYear];
  if (String(mypYear).includes('1')) return '1학년';
  if (String(mypYear).includes('2')) return '2학년';
  if (String(mypYear).includes('3')) return '3학년';
  return '1학년';
}

/**
 * 셀에 값 설정 (기존 스타일 유지)
 */
function setCell(ws, ref, value) {
  if (value === null || value === undefined || value === '') return;
  const existing = ws[ref] || {};
  ws[ref] = {
    ...existing,
    v: String(value),
    t: 's',
    // s (style) 는 existing에서 복사됨
  };
}

/**
 * 프롬프트 텍스트에서 특정 키워드 이후 내용 추출
 */
function extractSection(text, ...keywords) {
  if (!text) return '';
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(escaped + '[^\\n]*\\n([\\s\\S]+?)(?=\\n##|\\n---|\n\\*\\*|$)', 'i'));
    if (match) return match[1].trim();
  }
  return text; // 못 찾으면 전체 반환
}

/**
 * GRASPS 텍스트에서 각 항목 추출
 */
function extractGrasps(text) {
  if (!text) return {};
  const result = {};
  const patterns = {
    goal: /Goal\s*[\(（]?목표[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Role|Audience|Situation|Perform|Standard)[^\n]+)*)/i,
    role: /Role\s*[\(（]?역할[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Goal|Audience|Situation|Perform|Standard)[^\n]+)*)/i,
    audience: /Audience\s*[\(（]?청중[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Goal|Role|Situation|Perform|Standard)[^\n]+)*)/i,
    situation: /Situation\s*[\(（]?상황[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Goal|Role|Audience|Perform|Standard)[^\n]+)*)/i,
    performance: /Perform(?:ance|ace)?\s*[\(（]?수행[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Goal|Role|Audience|Situation|Standard)[^\n]+)*)/i,
    standards: /Standard[s]?\s*[\(（]?평가[\)）]?\s*[:：]\s*([^\n]+(?:\n(?!Goal|Role|Audience|Situation|Perform)[^\n]+)*)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) result[key] = match[1].trim();
  }
  return result;
}

/**
 * 탐구 질문 텍스트에서 3종류 질문 추출
 */
function extractInquiryQuestions(text) {
  if (!text) return {};
  
  const factualMatch = text.match(/사실적[^\n]*\n([\s\S]+?)(?=개념적|논쟁적|$)/);
  const conceptualMatch = text.match(/개념적[^\n]*\n([\s\S]+?)(?=사실적|논쟁적|$)/);
  const debatableMatch = text.match(/논쟁적[^\n]*\n([\s\S]+?)(?=사실적|개념적|$)/);

  return {
    factual: factualMatch ? factualMatch[1].trim() : '',
    conceptual: conceptualMatch ? conceptualMatch[1].trim() : '',
    debatable: debatableMatch ? debatableMatch[1].trim() : '',
  };
}

/**
 * ATL 텍스트 파싱
 */
function parseAtlItems(text) {
  if (!text) return [];
  const results = [];

  const categoryKeywords = [
    '의사소통', '대인 관계 기능', '자기 관리 기능', '조사 기능', '사고 기능',
    'Communication', 'Social', 'Self-management', 'Research', 'Thinking',
  ];

  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const isCategory = categoryKeywords.some((k) => trimmed.includes(k)) && trimmed.length < 60;

    if (isCategory) {
      if (current) results.push(current);
      current = { category: trimmed, cluster: '', detail: '' };
    } else if (current) {
      if (!current.cluster && trimmed.length < 80) {
        current.cluster = trimmed;
      } else {
        current.detail += (current.detail ? '\n' : '') + trimmed;
      }
    }
  }
  if (current) results.push(current);

  // 파싱 실패 시 전체 텍스트를 첫 번째 항목의 세부내용으로
  if (results.length === 0 && text.trim()) {
    results.push({ category: '', cluster: '', detail: text.trim() });
  }

  return results;
}

export async function exportIBProjectToXlsx(project) {
  // 1. 원본 템플릿 fetch
  const response = await fetch('/ib_unit_plan_template.xlsx');
  if (!response.ok) {
    throw new Error(
      '템플릿 파일을 불러올 수 없습니다.\npublic/ib_unit_plan_template.xlsx 파일이 있는지 확인하세요.'
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // 2. xlsx 파싱 (스타일 포함)
  const wb = XLSX.read(data, {
    type: 'array',
    cellStyles: true,
    cellDates: true,
    bookVBA: true,
  });

  // UNIT 4. 시트 사용
  const sheetName = 'UNIT 4.';
  if (!wb.SheetNames.includes(sheetName)) {
    throw new Error(`시트 "${sheetName}"를 찾을 수 없습니다.`);
  }
  const ws = wb.Sheets[sheetName];

  // 3. 프로젝트 데이터 추출
  const info = project.info || {};
  const sections = project.sections || {};

  const statementPrompt = sections.statement?.prompt || '';
  const inquiryPrompt = sections.inquiryQuestions?.prompt || '';
  const assessmentPrompt = sections.assessment?.prompt || '';
  const atlPrompt = sections.atl?.prompt || '';
  const formativePrompt = sections.formative?.prompt || '';

  // 4. 기본 정보 입력
  setCell(ws, 'B3', info.teacherName || '');
  setCell(ws, 'E3', info.subject || '');
  setCell(ws, 'B4', info.unitTitle || '');
  setCell(ws, 'E4', mypYearToGrade(info.mypYear));

  // 5. 주요 개념 / 관련 개념 / 세계적 맥락
  if (info.keyConcept) {
    setCell(ws, 'A9', info.keyConcept);
  }
  if (info.relatedConcepts) {
    const rc = Array.isArray(info.relatedConcepts)
      ? info.relatedConcepts.join(', ')
      : info.relatedConcepts;
    setCell(ws, 'C9', rc);
  }
  if (info.globalContext) {
    setCell(ws, 'E9', info.globalContext);
  }
  if (info.contextExploration) {
    setCell(ws, 'F10', info.contextExploration);
  }

  // 6. 탐구 진술문 (A12)
  if (statementPrompt) {
    setCell(ws, 'A12', statementPrompt);
  }

  // 7. 탐구 질문 (A15, A17, A19)
  if (inquiryPrompt) {
    const questions = extractInquiryQuestions(inquiryPrompt);
    if (questions.factual) setCell(ws, 'A15', questions.factual);
    if (questions.conceptual) setCell(ws, 'A17', questions.conceptual);
    if (questions.debatable) setCell(ws, 'A19', questions.debatable);
  }

  // 8. GRASPS (D22~D27)
  if (assessmentPrompt) {
    const grasps = extractGrasps(assessmentPrompt);
    if (grasps.goal) setCell(ws, 'D22', grasps.goal);
    if (grasps.role) setCell(ws, 'D23', grasps.role);
    if (grasps.audience) setCell(ws, 'D24', grasps.audience);
    if (grasps.situation) setCell(ws, 'D25', grasps.situation);
    if (grasps.performance) setCell(ws, 'D26', grasps.performance);
    if (grasps.standards) setCell(ws, 'D27', grasps.standards);
  }

  // 9. ATL (A30~C30, A33~C33)
  if (atlPrompt) {
    const atlItems = parseAtlItems(atlPrompt);
    const atlRows = [30, 33, 36]; // 최대 3개 ATL 항목
    atlItems.slice(0, atlRows.length).forEach((item, idx) => {
      const row = atlRows[idx];
      if (item.category) setCell(ws, `A${row}`, item.category);
      if (item.cluster) setCell(ws, `B${row}`, item.cluster);
      if (item.detail) setCell(ws, `C${row}`, item.detail);
    });
  }

  // 10. 형성평가 (E42)
  if (formativePrompt) {
    setCell(ws, 'E42', formativePrompt);
  }

  // 11. 파일 다운로드
  const subjectName = (info.subject || '교과').replace(/[/\\?%*:|"<>]/g, '_');
  const titleName = (info.unitTitle || '단원').replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `IB_단원계획서_${subjectName}_${titleName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

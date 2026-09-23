export const COMPLETENESS_LEVELS = [
  { message: '내용을 입력해주세요', colorClass: 'text-red-500 dark:text-red-400' },
  { message: '조금 더 구체적으로 입력해보세요', colorClass: 'text-orange-500 dark:text-orange-400' },
  { message: '괜찮아요! 더 추가하면 더 좋아져요', colorClass: 'text-yellow-500 dark:text-yellow-400' },
  { message: '좋아요! 거의 완성됐어요', colorClass: 'text-lime-500 dark:text-lime-400' },
  { message: '완벽해요! 최적의 프롬프트가 생성됩니다', colorClass: 'text-green-600 dark:text-green-400' },
]

export function getCompletenessLevel(score) {
  return COMPLETENESS_LEVELS[Math.max(score - 1, 0)]
}

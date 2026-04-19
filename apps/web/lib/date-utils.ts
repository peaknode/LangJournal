/**
 * 'YYYY-MM-DD' 형식의 날짜 문자열을 사람이 읽기 좋은 형식으로 변환합니다.
 * 예: '2024-05-22' → 'May 22, 2024'
 *
 * @param dateString - 'YYYY-MM-DD' 형식의 날짜 문자열
 * @returns 포매팅된 날짜 문자열
 * @example
 * formatDate('2024-05-22') // 'May 22, 2024'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * 'YYYY-MM-DD' 형식의 날짜 문자열을 상대적인 표현으로 변환합니다.
 * 예: 오늘이면 'Today', 어제면 'Yesterday', 그 외 'May 22'
 *
 * @param dateString - 'YYYY-MM-DD' 형식의 날짜 문자열
 * @returns 상대적 표현의 날짜 문자열
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  }
  if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

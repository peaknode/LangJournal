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

/**
 * 일기 항목 배열을 월별로 그룹핑합니다.
 * 입력은 날짜 역순(최신순) 정렬되어 있다고 가정합니다.
 *
 * @param entries - 날짜 역순 정렬된 일기 항목 배열
 * @returns 월별 그룹 배열 (최신 월부터)
 *
 * @example
 * const groups = groupEntriesByMonth(entries);
 * // [{ key: "2024-05", label: "May 2024", entries: [...] }, ...]
 */
export interface MonthGroup {
  /** 그룹 고유 키 ("YYYY-MM" 형식) */
  key: string;
  /** 표시용 라벨 ("May 2024" 형식) */
  label: string;
  /** 해당 월의 일기 항목들 */
  entries: import('@langjournal/core').DiaryEntry[];
}

export function groupEntriesByMonth(
  entries: import('@langjournal/core').DiaryEntry[]
): MonthGroup[] {
  const groups: MonthGroup[] = [];
  let currentKey = '';

  for (const entry of entries) {
    const yearMonth = entry.date.slice(0, 7); // "YYYY-MM"

    if (yearMonth !== currentKey) {
      const date = new Date(entry.date + 'T00:00:00Z');
      groups.push({
        key: yearMonth,
        label: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        entries: [entry],
      });
      currentKey = yearMonth;
    } else {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup) {
        lastGroup.entries.push(entry);
      }
    }
  }

  return groups;
}

/**
 * 'YYYY-MM-DD' 날짜에서 월 약자와 일자를 분리하여 반환합니다.
 * 타임라인 리스트의 날짜 열에 사용됩니다.
 *
 * @param dateString - 'YYYY-MM-DD' 형식의 날짜 문자열
 * @returns 월 약자(대문자)와 일자
 *
 * @example
 * formatDayParts('2024-05-22') // { monthAbbrev: "MAY", day: "22" }
 */
export function formatDayParts(dateString: string): {
  monthAbbrev: string;
  day: string;
} {
  const date = new Date(dateString + 'T00:00:00Z');
  const monthAbbrev = date
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
  const day = date.getUTCDate().toString().padStart(2, '0');
  return { monthAbbrev, day };
}


/**
 * Date 객체를 'YYYY-MM-DD' 형식 문자열로 변환합니다.
 */
export function formatDateToString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

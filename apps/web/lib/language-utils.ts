/**
 * 언어 코드를 사람이 읽기 좋은 언어명으로 변환합니다.
 *
 * @param languageCode - 언어 코드 ('en' | 'ja' | 'zh' | 'es' | 'fr')
 * @returns 언어명 문자열
 * @example
 * getLanguageLabel('en') // 'English'
 * getLanguageLabel('ja') // '日本語'
 */
export function getLanguageLabel(languageCode: string): string {
  const languageMap: Record<string, string> = {
    en: 'English',
    ja: '日本語',
    zh: '中文',
    es: 'Español',
    fr: 'Français',
  };
  return languageMap[languageCode] || languageCode.toUpperCase();
}

/**
 * 지원하는 모든 언어 코드와 레이블을 반환합니다.
 *
 * @returns { code: string; label: string }[] 형식의 언어 목록
 */
export function getSupportedLanguages() {
  return [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];
}

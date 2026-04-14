/**
 * Next.js 설정
 *
 * WebGPU와 SharedArrayBuffer를 위한 COOP/COEP 헤더를 설정합니다.
 * 이들은 WebLLM이 메인 스레드 블로킹 없이 동작하기 위해 필수입니다.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /**
   * HTTP 헤더 설정
   *
   * COOP (Cross-Origin-Opener-Policy): same-origin
   * - 다른 오리진의 팝업/윈도우와 격리
   *
   * COEP (Cross-Origin-Embedder-Policy): require-corp
   * - 모든 크로스 오리진 리소스는 명시적 허가 필요
   * - WebGPU와 SharedArrayBuffer 사용 시 필수
   */
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
      ],
    },
  ],
};

export default nextConfig;

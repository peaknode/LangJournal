/**
 * Next.js 설정
 *
 * WebGPU와 SharedArrayBuffer를 위한 COOP/COEP 헤더를 설정합니다.
 * HuggingFace CORS 우회를 위한 rewrite 프록시를 포함합니다.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    /**
     * HTTP 헤더 설정
     */
    // headers: async () => [
    //   {
    //     source: '/(.*)',
    //     headers: [
    //       {
    //         key: 'Cross-Origin-Opener-Policy',
    //         value: 'same-origin',
    //       },
    //       {
    //         key: 'Cross-Origin-Embedder-Policy',
    //         value: 'credentialless',
    //       },
    //     ],
    //   },
    // ],
    pageExtensions: ["ts", "tsx"],
    reactStrictMode: true,
    transpilePackages: ['@langjournal/editor', '@langjournal/ui'],
};

export default nextConfig;

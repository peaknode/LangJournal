import { type NextRequest, NextResponse } from 'next/server';

/**
 * HuggingFace 프록시 라우트 핸들러
 *
 * WebLLM 모델 파일을 서버 사이드에서 HuggingFace CDN에서 받아
 * 브라우저에 스트리밍합니다.
 *
 * 필요한 이유:
 * - HuggingFace는 Access-Control-Allow-Origin: https://huggingface.co 만 허용
 * - 307 리다이렉트를 여러 번 반복하므로 서버에서 redirect: 'follow' 처리
 * - 브라우저는 localhost (same-origin) 로만 통신 → CORS 없음
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `https://huggingface.co/${pathStr}${search}`;

  const upstream = await fetch(targetUrl, {
    redirect: 'follow',
    headers: {
      // Range 헤더 전달 (부분 다운로드 지원)
      ...(request.headers.get('range')
        ? { range: request.headers.get('range')! }
        : {}),
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(null, { status: upstream.status });
  }

  const headers = new Headers();
  const forward = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
  for (const key of forward) {
    const val = upstream.headers.get(key);
    if (val) headers.set(key, val);
  }
  // 모델 파일은 장기 캐시
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `https://huggingface.co/${pathStr}${search}`;

  const upstream = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow' });

  return new NextResponse(null, { status: upstream.status });
}

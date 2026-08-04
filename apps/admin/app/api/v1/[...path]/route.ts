import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy same-origin da API (§8/§9). A loja chama /api/v1/* no próprio domínio
 * e esta função repassa para a API (API_PROXY_TARGET), devolvendo inclusive o
 * Set-Cookie. Assim o cookie de sessão é first-party e persiste mesmo com loja
 * e API em domínios diferentes (Vercel + Render) — e sem CORS no browser.
 *
 * Lê o alvo em tempo de execução (não no build): mais robusto que rewrites.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function target(): string {
  return (
    process.env.API_PROXY_TARGET ??
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3333' : '')
  ).replace(/\/+$/, '');
}

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-encoding',
  'content-length',
  'host',
]);

async function proxy(req: NextRequest, params: Promise<{ path: string[] }>): Promise<NextResponse> {
  const base = target();
  if (!base) {
    return NextResponse.json(
      { message: 'Proxy da API não configurado (defina API_PROXY_TARGET).' },
      { status: 502 },
    );
  }

  const { path } = await params;
  const url = `${base}/api/v1/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch {
    return NextResponse.json({ message: 'API indisponível no momento.' }, { status: 502 });
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') {
      outHeaders.set(key, value);
    }
  });

  const body = await upstream.arrayBuffer();
  const res = new NextResponse(body, { status: upstream.status, headers: outHeaders });

  // Repassa os cookies (a API define o refresh como httpOnly)
  for (const cookie of upstream.headers.getSetCookie()) {
    res.headers.append('set-cookie', cookie);
  }
  return res;
}

type Ctx = { params: Promise<{ path: string[] }> };

export const GET = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params);
export const POST = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params);
export const PUT = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params);
export const PATCH = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params);
export const DELETE = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params);

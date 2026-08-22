interface Env {
  POSTHOG_HOST?: string
}

const PROXY_PREFIX = '/r'
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'POST'])
const FORWARDED_HEADER_BLOCKLIST = [
  'authorization',
  'cookie',
  'host',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
]

export const onRequest = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.POSTHOG_HOST) {
    return new Response('PostHog proxy is not configured', { status: 500 })
  }

  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: [...ALLOWED_METHODS].join(', ') },
    })
  }

  const requestUrl = new URL(request.url)
  let upstreamHost: URL

  try {
    upstreamHost = new URL(env.POSTHOG_HOST)
    if (
      upstreamHost.protocol !== 'https:' ||
      upstreamHost.pathname !== '/' ||
      upstreamHost.search ||
      upstreamHost.hash ||
      upstreamHost.username ||
      upstreamHost.password
    ) {
      throw new Error('PostHog host must be an HTTPS URL without credentials')
    }
  } catch {
    return new Response('PostHog proxy has an invalid upstream', { status: 500 })
  }

  const upstreamUrl = new URL(`${upstreamHost.origin}${requestUrl.pathname.slice(PROXY_PREFIX.length) || '/'}`)
  upstreamUrl.search = requestUrl.search

  const headers = new Headers(request.headers)
  headers.delete('content-length')
  FORWARDED_HEADER_BLOCKLIST.forEach((header) => headers.delete(header))

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.set('cache-control', 'no-store')
  responseHeaders.delete('set-cookie')

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

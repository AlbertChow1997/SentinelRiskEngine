import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { apiProxy, apiRoutes, type Upstream } from './api-proxy.ts'

// Vitest runs from frontend/ (CI uses it as the working directory too).
const NGINX_TEMPLATE = resolve(process.cwd(), '..', 'infra', 'nginx', 'default.conf.template')

const NGINX_UPSTREAMS: Record<string, Upstream> = {
  RISK_UPSTREAM: 'risk',
  GATEWAY_UPSTREAM: 'gateway',
  LLM_UPSTREAM: 'llm',
}

/** Reads the staging nginx origin: each /api location and the upstream it proxies to. */
function nginxRoutes(): Map<string, { upstream: Upstream; path: string }> {
  const routes = new Map<string, { upstream: Upstream; path: string }>()
  const blocks = readFileSync(NGINX_TEMPLATE, 'utf8')
    .split(/\n\s*location /)
    .slice(1)
  for (const block of blocks) {
    const location = block.slice(0, block.indexOf('{')).trim()
    const proxy = /proxy_pass http:\/\/\$\{(\w+)\}([^;]*);/.exec(block)
    if (!proxy || !location.includes('/api')) continue
    const key = location.startsWith('= ')
      ? location.slice(2)
      : (/\(([a-z|-]+)\)/.exec(location)?.[1] ?? location)
    routes.set(key, { upstream: NGINX_UPSTREAMS[proxy[1]], path: proxy[2] })
  }
  return routes
}

function routeFor(url: string) {
  return apiRoutes.find((route) => new RegExp(route.pattern).test(url))
}

describe('local API proxy', () => {
  it('routes exactly the same path groups to the same services as the staging nginx origin', () => {
    const nginx = nginxRoutes()
    const local = new Map(
      apiRoutes.map((route) => [
        route.rewrite ? '/api/health' : (/\(([a-z|-]+)\)/.exec(route.pattern)?.[1] ?? ''),
        route.upstream,
      ]),
    )
    expect(nginx.size).toBeGreaterThan(0)
    expect(new Map([...nginx].map(([key, value]) => [key, value.upstream]))).toEqual(local)
  })

  it('rewrites /api/health to the actuator path nginx uses', () => {
    expect(nginxRoutes().get('/api/health')?.path).toBe('/actuator/health')
    const rewrite = apiProxy({})['^/api/health(\\?|$)'].rewrite
    expect(rewrite?.('/api/health')).toBe('/actuator/health')
  })

  it.each([
    ['/api/health', 'risk'],
    ['/api/v1/risk-assessments', 'risk'],
    ['/api/v1/risk-assessments/123/review', 'risk'],
    ['/api/v1/stats/summary?from=2026-11-01', 'risk'],
    ['/api/v1/payments?page=0', 'gateway'],
    ['/api/v1/merchants/me', 'gateway'],
    ['/api/v1/ops/payments', 'gateway'],
    ['/api/v1/insights/abc', 'llm'],
    ['/api/v1/llm/invocations', 'llm'],
  ])('sends %s to the %s service', (url, upstream) => {
    expect(routeFor(url)?.upstream).toBe(upstream)
  })

  it.each(['/api/v1/statsx', '/api/v1/unknown', '/api/healthz', '/actuator/env'])(
    'does not proxy %s (nginx returns 404 for it too)',
    (url) => {
      expect(routeFor(url)).toBeUndefined()
    },
  )

  it('uses the local ports by default and accepts overrides', () => {
    expect(apiProxy({})['^/api/v1/(payments|ops|merchants)(/|\\?|$)'].target).toBe(
      'http://localhost:8080',
    )
    expect(
      apiProxy({ RISK_ENGINE_URL: 'http://127.0.0.1:18081' })['^/api/health(\\?|$)'].target,
    ).toBe('http://127.0.0.1:18081')
  })
})

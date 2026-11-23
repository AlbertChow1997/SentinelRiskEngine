import type { ProxyOptions } from 'vite'

// Local API routing for `npm run dev` and `npm run preview`. It mirrors the nginx origin used
// in staging (infra/nginx/default.conf.template, DESIGN.md §8.8.3) so the browser calls the
// same relative /api paths everywhere. api-proxy.test.ts fails if the two tables drift apart.

export type Upstream = 'risk' | 'gateway' | 'llm'

export interface ApiRoute {
  /** Vite treats keys starting with ^ as regular expressions over the request URL (path + query). */
  readonly pattern: string
  readonly upstream: Upstream
  /** Path the upstream serves, when it differs from the public one. */
  readonly rewrite?: { readonly from: RegExp; readonly to: string }
}

export const apiRoutes: readonly ApiRoute[] = [
  {
    pattern: '^/api/health(\\?|$)',
    upstream: 'risk',
    rewrite: { from: /^\/api\/health/, to: '/actuator/health' },
  },
  { pattern: '^/api/v1/(risk-assessments|stats|blocklist)(/|\\?|$)', upstream: 'risk' },
  { pattern: '^/api/v1/(payments|ops|merchants)(/|\\?|$)', upstream: 'gateway' },
  { pattern: '^/api/v1/(insights|llm)(/|\\?|$)', upstream: 'llm' },
]

// Local ports from CLAUDE.md §11; override when a service runs elsewhere.
export function upstreamUrls(env: Record<string, string | undefined>): Record<Upstream, string> {
  return {
    risk: env.RISK_ENGINE_URL ?? 'http://localhost:8081',
    gateway: env.GATEWAY_URL ?? 'http://localhost:8080',
    llm: env.LLM_INSIGHTS_URL ?? 'http://localhost:8001',
  }
}

export function apiProxy(
  env: Record<string, string | undefined> = process.env,
): Record<string, ProxyOptions> {
  const targets = upstreamUrls(env)
  return Object.fromEntries(
    apiRoutes.map((route) => {
      const options: ProxyOptions = { target: targets[route.upstream], changeOrigin: true }
      const { rewrite } = route
      if (rewrite) {
        options.rewrite = (path) => path.replace(rewrite.from, rewrite.to)
      }
      return [route.pattern, options]
    }),
  )
}

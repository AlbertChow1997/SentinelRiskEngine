import { Reveal } from '@/components/motion/Reveal'

// Mirrors the "normal" example of POST /api/v1/risk-assessments in
// contracts/openapi-risk-engine-v1.yaml. Keep it in sync when the contract changes.
const request = `curl -X POST https://<your-host>/api/v1/risk-assessments \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "tx-001",
    "customerId": "cust-001",
    "merchantId": "merch-001",
    "amount": 49.99,
    "currency": "EUR",
    "countryCode": "IE",
    "transactionTime": "2026-11-18T09:59:00Z"
  }'`

const response = `{
  "decision": "APPROVE",
  "status": "AUTO_DECIDED",
  "riskScore": 12,
  "ruleScore": 0,
  "degraded": false,
  "reasons": [],
  "ruleHits": [],
  "mlFactors": [ … ]
}`

export function DeveloperSnippet() {
  return (
    <section aria-labelledby="dev-heading" className="bg-hero text-hero-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <p className="text-sm font-semibold text-highlight">For developers</p>
          <h2 id="dev-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            One request, a decision you can explain
          </h2>
          <p className="mt-4 opacity-80">
            Typed clients are generated from our OpenAPI contracts, so the docs, the mocks and the
            UI never drift from the API.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex min-w-0 flex-col gap-4">
          <CodeBlock label="Request" code={request} />
          <CodeBlock label="Response (excerpt)" code={response} />
        </Reveal>
      </div>
    </section>
  )
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <figure className="min-w-0 rounded-xl border border-white/15 bg-white/5">
      <figcaption className="border-b border-white/15 px-4 py-2 text-xs opacity-80">
        {label}
      </figcaption>
      <pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

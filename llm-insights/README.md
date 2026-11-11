# LLM Insights (`llm-insights/`)

Writes an **AI-generated, advisory** case summary for analysts. It listens to risk assessment events, asks an LLM for a short
structured summary, validates and stores the result, and serves it to the review flow and the LLM Console.

| | |
|---|---|
| **Owner** | Zheng Liu (proposed — to be confirmed through an issue) |
| **Stack** | Python 3.12, Django + Django REST Framework, boto3 (Amazon Bedrock), Pydantic v2, uv |
| **Port** | 8001 (the Kafka consumer process has no port) |
| **Contract** | `contracts/openapi-llm-insights-v1.yaml` — **not written yet**; event `RiskInsightGenerated` on `risk.insights.v1` |
| **Design** | `docs/DESIGN.md` §4.8, §6.6, §13; framework decision in `docs/adr/0009-django-for-python-services.md` |
| **Status** | Not scaffolded yet — first ticket RISK-141 (milestone M4) |

**The LLM is advisory only.** It never approves, declines or changes a payment or risk decision, and the platform behaves
identically when this service is down.

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).

# ML Scorer (`ml-scorer/`)

Returns a fraud probability and the top contributing factors for one transaction. Also home of the feedback collector that
turns payment outcome events into training labels.

| | |
|---|---|
| **Owner** | Zheng Liu |
| **Stack** | Python 3.12, Django + Django REST Framework, scikit-learn, uv |
| **Port** | 8000 (`ml-feedback` has no port) |
| **Contract** | `contracts/openapi-ml-scorer-v1.yaml` — **not written yet** (open question Q16) |
| **Design** | `docs/DESIGN.md` §9; framework decision in `docs/adr/0009-django-for-python-services.md` |
| **Status** | Not scaffolded yet — first ticket RISK-50 (milestone M1) |

The model is trained on **synthetic data**. The README, `/v1/model-info` and the model card must all say so.

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).

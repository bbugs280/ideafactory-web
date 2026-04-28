---
description: "Use when implementing features, routes, services, or config changes. Automatically sync relevant MD docs in docs/ folder to match code changes."
applyTo: "backend/**/*.py, .env*, docker-compose.yml, wix/**/*.js"
---
# Documentation Update Guidelines

## Core Rule: Doc Changes Match Code Changes

**Whenever you modify code, immediately update the relevant docs in the `docs/` folder.**

Docs are not written after the fact — they evolve with the code in the same commit/PR.

---

## Mapping: Code → Docs

### Backend Routes & Endpoints

| When you modify... | Update this doc |
|---|---|
| `backend/app/routes/*.py` (add/change endpoint) | `docs/api/api-reference.md` |
| Any route's request/response schema | `docs/api/api-reference.md` |
| New error handling in routes | `docs/ops/error-handling.md` |

**Example:** Add new endpoint `POST /api/orders/{id}/cancel`
→ Add it to `docs/api/api-reference.md` with full request/response examples

---

### Backend Services & Integrations

| When you modify... | Update this doc |
|---|---|
| `backend/app/services/*.py` (add/change service) | `docs/architecture/services.md` (NEW) |
| LLM service (GPT-4o prompts, behavior) | `docs/architecture/services.md` |
| Image service (DALL-E 3 changes) | `docs/architecture/services.md` |
| 3D model generation (Hunyuan3D) | `docs/architecture/services.md` |
| WhatsApp integration (Twilio) | `docs/architecture/services.md` |
| AWS S3 / file storage logic | `docs/architecture/services.md` |

**Example:** Optimize GPT-4o prompt engineering
→ Update `docs/architecture/services.md` with new prompt strategy and reasoning

---

### Database & Models

| When you modify... | Update this doc |
|---|---|
| `backend/app/models/*.py` (add/change model) | `docs/architecture/database-schema.md` (NEW) |
| Order model fields | `docs/architecture/database-schema.md` |
| Token model fields | `docs/architecture/database-schema.md` |
| New migration | `docs/ops/deployment-guide.md` (Migration section) |

**Example:** Add `refund_reason` field to Order model
→ Update `docs/architecture/database-schema.md` with field description and type

---

### Configuration & Environment

| When you modify... | Update this doc |
|---|---|
| `.env.example` (add new config var) | `docs/ops/configuration-reference.md` (NEW) |
| `backend/app/config.py` (add new setting) | `docs/ops/configuration-reference.md` |
| `docker-compose.yml` (add service/port) | `docs/ops/deployment-guide.md` |

**Example:** Add `STABILITY_API_KEY` to .env.example
→ Update `docs/ops/configuration-reference.md` with: variable name, type, default, description, where it's used

---

### Wix Integration

| When you modify... | Update this doc |
|---|---|
| `wix/backend/figurine-api.jsw` (add/change API call) | `docs/wix/wix-integration.md` |
| `wix/pages/figurine-order.js` (change flow) | `docs/wix/wix-integration.md` |
| Token validation logic | `docs/wix/wix-integration.md` |
| New Wix CMS fields | `docs/wix/wix-integration.md` |

**Example:** Add new payment verification endpoint
→ Update `docs/wix/wix-integration.md` with endpoint signature, call example, response format

---

### Async Tasks & Background Jobs

| When you modify... | Update this doc |
|---|---|
| `backend/app/tasks/*.py` (add/change task) | `docs/ops/async-tasks.md` (NEW) |
| Celery queue configuration | `docs/ops/async-tasks.md` |
| Task retry logic or error handling | `docs/ops/async-tasks.md` |

**Example:** Add new task `generate_3d_model_async()`
→ Create `docs/ops/async-tasks.md` with: task name, trigger conditions, inputs, outputs, timeout, retry strategy

---

### Error Handling & Recovery

| When you modify... | Update this doc |
|---|---|
| Error handling in any route | `docs/ops/error-handling.md` |
| New HTTPException status codes | `docs/ops/error-handling.md` |
| Fallback/retry logic | `docs/ops/error-handling.md` |

**Example:** Handle S3 upload timeout with retry logic
→ Update `docs/ops/error-handling.md` with: error code, cause, customer-facing message, retry behavior

---

## Documentation Update Checklist

Use this checklist when making code changes:

- [ ] **API changed?** → Update `docs/api/api-reference.md`
- [ ] **Database/model changed?** → Update `docs/architecture/database-schema.md`
- [ ] **Service logic changed?** → Update `docs/architecture/services.md`
- [ ] **Config added?** → Update `docs/ops/configuration-reference.md` + `.env.example`
- [ ] **Task logic changed?** → Update `docs/ops/async-tasks.md`
- [ ] **Error handling changed?** → Update `docs/ops/error-handling.md`
- [ ] **Wix flow changed?** → Update `docs/wix/wix-integration.md`
- [ ] **Updated todo.md?** → Mark items as in-progress/completed in `docs/project-management/todo.md`

---

## Quick Format Reference

### API Endpoint Documentation

```markdown
### POST /api/orders/{id}/cancel
**Purpose:** Cancel a pending order and refund the customer.

**Request:**
```json
{
  "reason": "string (required, 1-500 chars)",
  "notify_customer": "boolean (optional, default true)"
}
```

**Response (200):**
```json
{
  "order_id": "uuid",
  "status": "cancelled",
  "refund_amount": 99.99,
  "refund_initiated_at": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `404` — Order not found
- `409` — Order status is not cancellable
- `500` — Refund service error
```

### Service Documentation

```markdown
## DALL-E 3 Image Generation

**File:** `backend/app/services/image_service.py`

**Purpose:** Generate 3 variant figurine concept images using OpenAI DALL-E 3.

**Prompt strategy:** 
- GPT-4o analyzes customer's uploaded photo and description
- Outputs a structured prompt for DALL-E 3
- Ensures consistency with customer's original image

**Config:**
- `OPENAI_API_KEY` — required
- `OPENAI_MODEL` — default: `gpt-4o`
- `IMAGE_MODEL` — default: `dall-e-3`
```

### Configuration Documentation

```markdown
## HUNYUAN3D_API_KEY
**Type:** String (required)
**Default:** (none)
**Used by:** `backend/app/services/hunyuan3d.py`
**Description:** API key for Tencent Hunyuan3D-2 service. Request from Tencent cloud.
**Example in .env:**
```
HUNYUAN3D_API_KEY=sk-abc123def456
```

---

## Documentation Structure

All docs must go under `docs/` subfolder. Never commit `.md` files to root or `backend/wix/` source dirs (except `README.md` at root).

| Topic | Folder | Files |
|---|---|---|
| API reference | `docs/api/` | `api-reference.md` |
| Architecture & design | `docs/architecture/` | `database-schema.md`, `services.md` |
| Deployment & operations | `docs/ops/` | `deployment-guide.md`, `error-handling.md`, `configuration-reference.md`, `async-tasks.md` |
| Wix integration | `docs/wix/` | `wix-integration.md` |
| Project planning | `docs/project-management/` | `todo.md` |

---

## Commit Message Guidelines

When updating docs, include both code and doc changes in the same commit:

```bash
git add backend/app/routes/orders.py docs/api/api-reference.md
git commit -m "feat: add POST /orders/{id}/cancel endpoint

- Add cancel endpoint with refund handling
- Update API reference documentation"
```

Or, if only docs:
```bash
git commit -m "docs: update error handling guide with S3 retry logic"
```

---

## Generated Docs (Auto-Sync)

Some docs are auto-generated from code (avoid manual editing):

| Doc | Source | Generator |
|---|---|---|
| OpenAPI spec | Route annotations | FastAPI Swagger UI |
| Database ERD | SQLAlchemy models | (TBD: diagram generation) |

These are flagged in the `.md` file with:
```markdown
> **Auto-generated from code.** Do not edit manually.
> Last updated: 2026-04-28
> Generator: `backend/scripts/generate-api-docs.py`
```

---

## Review Checklist for PRs

Before merging, verify:

- [ ] Code changes have corresponding doc updates
- [ ] All new fields/endpoints are documented with examples
- [ ] Configuration changes updated in `.env.example`
- [ ] Error cases documented in `error-handling.md`
- [ ] No orphaned doc links or outdated examples
- [ ] File paths in docs use correct kebab-case
- [ ] Todo.md reflects new tasks or completions

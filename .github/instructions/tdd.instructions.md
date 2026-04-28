---
description: "Use when writing, adding, or modifying any backend Python feature, route, service, or Celery task. Enforces TDD (test-driven development): write a failing test first, then implement, then refactor."
applyTo: "backend/**/*.py"
---
# TDD Guidelines — Beets 3D Figurine Backend

## The Cycle: Red → Green → Refactor

1. **Red**: Write a failing test that describes the desired behaviour. Run it — confirm it fails.
2. **Green**: Write the minimal production code to make it pass. Nothing extra.
3. **Refactor**: Remove duplication and improve naming while keeping all tests green.

Never write implementation code without a corresponding failing test first.

---

## Test File Layout

Mirror the source tree under `backend/tests/`:

| Source file | Test file |
|---|---|
| `app/routes/orders.py` | `tests/routes/test_orders.py` |
| `app/routes/generate.py` | `tests/routes/test_generate.py` |
| `app/routes/webhooks.py` | `tests/routes/test_webhooks.py` |
| `app/routes/tokens.py` | `tests/routes/test_tokens.py` |
| `app/services/llm_service.py` | `tests/services/test_llm_service.py` |
| `app/services/image_service.py` | `tests/services/test_image_service.py` |
| `app/services/hunyuan3d.py` | `tests/services/test_hunyuan3d.py` |
| `app/services/whatsapp.py` | `tests/services/test_whatsapp.py` |
| `app/services/storage.py` | `tests/services/test_storage.py` |
| `app/tasks/generation.py` | `tests/tasks/test_generation.py` |
| `app/models/order.py` | `tests/models/test_order.py` |
| `app/models/token.py` | `tests/models/test_token.py` |

Add `__init__.py` to each test subfolder.

---

## Required Test Dependencies

Add to `backend/requirements-test.txt`:
```
pytest>=8.0
pytest-asyncio>=0.23
pytest-mock>=3.12
factory-boy>=3.3
```

---

## Shared `conftest.py`

Place at `backend/tests/conftest.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)
    engine.dispose()

@pytest.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

Configure `asyncio_mode` in `backend/pyproject.toml` or `backend/pytest.ini`:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

---

## Mocking External Services

**All** calls to DashScope, Hunyuan3D, WAHA, and the local filesystem must be mocked. Never hit real external services in tests.

Mock at the usage site (where the function is imported), not at its definition:

```python
# Route-level: mock the service called inside the route
async def test_generate_images_returns_200(client, db, mocker):
    mocker.patch(
        "app.routes.generate.generate_figurine_images",
        return_value=["http://img1.png", "http://img2.png"]
    )
    resp = await client.post(f"/orders/{order_id}/generate-images")
    assert resp.status_code == 200

# Service-level: mock the httpx call directly
async def test_submit_3d_job_returns_task_id(mocker):
    mock_resp = mocker.AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"task_id": "abc-123"}
    mocker.patch("httpx.AsyncClient.post", return_value=mock_resp)

    from app.services.hunyuan3d import submit_3d_job
    task_id = await submit_3d_job("http://hunyuan3d", b"<image bytes>")
    assert task_id == "abc-123"
```

---

## Celery Task Tests

Force eager execution so tasks run synchronously and exceptions propagate:

```python
@pytest.fixture(autouse=True)
def celery_eager():
    from app.celery_app import celery_app
    celery_app.conf.update(task_always_eager=True, task_eager_propagates=True)
```

Call the underlying function directly, not `.delay()`:

```python
def test_trigger_3d_generation_sets_status(db, mocker, celery_eager):
    mocker.patch("app.tasks.generation.submit_3d_job", return_value="task-xyz")
    mocker.patch("app.tasks.generation.wait_for_completion", return_value="http://model.glb")

    from app.tasks.generation import trigger_3d_generation
    trigger_3d_generation(str(order.id))

    db.refresh(order)
    assert order.model_url == "http://model.glb"
```

---

## Order State Machine

Every status transition requires a dedicated test. Arrange the order in the starting state, act via the route or service, assert the resulting status:

```python
async def test_upload_photo_transitions_to_generating_images(client, db, mocker):
    order = make_order(db, status=OrderStatus.PHOTO_UPLOAD)
    mocker.patch("app.routes.orders.generate_figurine_images", return_value=[...])
    resp = await client.post(f"/orders/{order.id}/upload-photo", files={"photo": ...})
    db.refresh(order)
    assert resp.status_code == 200
    assert order.status == OrderStatus.GENERATING_IMAGES
```

---

## What to Test per Layer

| Layer | Test focus |
|---|---|
| **Routes** | HTTP status codes, response schema shape, status transitions, auth/token checks |
| **Services** | Business logic correctness, correct external API payload, error propagation |
| **Models** | Pydantic validation rules, `.from_orm_model()` round-trips |
| **Tasks** | DB state after task completes, status on failure, retry behaviour |
| **Webhooks** | HMAC-SHA256 signature verification, idempotency on duplicate events |

---

## Running Tests

```bash
cd backend
pytest tests/ -v                   # full suite
pytest tests/routes/ -v            # routes only
pytest tests/ -k "test_order"      # filter by name
pytest tests/ --tb=short           # concise tracebacks
```

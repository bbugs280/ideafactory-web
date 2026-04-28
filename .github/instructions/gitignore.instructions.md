---
description: "Use when creating new files, folders, or integrations that may produce secrets, build artifacts, runtime data, or generated content. Ensures .gitignore stays up to date."
applyTo: "**"
---
# .gitignore Rules

## Files that must NEVER be committed

| Category | Examples | .gitignore pattern |
|---|---|---|
| Secrets & env | `.env`, API keys, tokens | `.env` (keep `.env.example`) |
| SQLite databases | `figurine.db`, `test.db` | `*.db`, `*.sqlite`, `*.sqlite3` |
| Local file storage | Uploaded photos, generated images, 3D models | `backend/storage/` |
| Python bytecode | Compiled files | `__pycache__/`, `*.py[cod]` |
| Virtual environments | Local Python envs | `.venv/`, `venv/` |
| Test artefacts | Coverage reports, caches | `.pytest_cache/`, `.coverage`, `htmlcov/` |
| Logs | Any runtime logs | `*.log`, `logs/` |
| macOS metadata | Finder artefacts | `.DS_Store` |

## When to update .gitignore

Update `.gitignore` whenever you:
- Add a new **secret or credential** (new `.env.*` file, token file, key file)
- Add a new **service with local runtime data** (new storage paths, cache directories)
- Introduce a **new build or test tool** that generates output files
- Add a **database file** or any file auto-generated at runtime

## .env convention

- `.env` — real secrets, never committed
- `.env.example` — template with placeholder values, always committed
- When adding a new config variable to `Settings` in `config.py`, also add it with a safe placeholder value to `.env.example`

## Local storage path

Runtime files written by `app/services/storage.py` go to `backend/storage/` (mapped from the `local_storage_path` config). This directory is gitignored. Never commit generated images, uploaded photos, or `.glb` model files.

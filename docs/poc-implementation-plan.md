# AutoQuote PoC Implementation Plan

## Goal

Validate, with minimal engineering effort, whether a small business owner can create usable quote drafts faster by chatting with an LLM than by writing quotes manually.

## Progress Tracker

### Completed

- [x] Set up the frontend foundation with `React + TypeScript + Vite + Tailwind + shadcn`
- [x] Replaced the stock starter with a cleaner demo app shell
- [x] Chose the initial product shape: internal-only tool for the business owner
- [x] Chose the PoC backend stack: `FastAPI + SQLite`
- [x] Agreed to keep the first version intentionally small and VPS-friendly
- [x] Defined the first implementation plan and scope
- [x] Added quote persistence models and migrations
- [x] Added quote CRUD endpoints in FastAPI
- [x] Added deterministic quote totals in the backend service layer
- [x] Added dashboard and quote workspace routes in the frontend
- [x] Added manual quote editing for customer details, scope, and line items
- [x] Added English/French UI foundations with French as the default locale
- [x] Added quote chat persistence and a first assistant workflow for the workspace

### Current Milestone Checklist

- [x] Add FastAPI backend skeleton
- [x] Add SQLite database and migrations
- [x] Add settings API and settings screen
- [x] Add quote CRUD API
- [x] Add quote workspace UI
- [x] Add deterministic quote total calculation
- [ ] Add LLM chat endpoint with schema validation
- [ ] Add quote review and print flow
- [ ] Deploy PoC to VPS with persistent SQLite storage

## Success Criteria

The PoC is successful if all of the following are true:

- A quote draft can be created from chat in under 5 minutes.
- The assistant asks sensible follow-up questions when details are missing.
- The owner can manually edit line items, prices, and terms before saving.
- Quotes can be saved, reopened, and printed from a VPS-hosted demo.
- The total build effort stays intentionally small and reversible.

## Product Constraints

- Internal-only tool for demos and early validation
- Single business
- Single owner or shared internal access
- English only
- SQLite on one VPS
- No over-engineering before validation

## Non-Goals For This PoC

- Customer-facing portal
- Multi-user roles and permissions
- Email sending
- Real PDF generation service
- Complex pricing rules engine
- Vector database or RAG
- Multi-tenant SaaS architecture
- Billing or subscriptions

## Recommended Technical Stack

### Frontend

- Existing `React + TypeScript + Vite + Tailwind + shadcn`

### Backend

- `FastAPI`
- `Pydantic v2` for request and LLM output validation
- `SQLAlchemy 2` + `Alembic` for persistence and migrations

### Database

- `SQLite`
- Enable WAL mode
- Store the database on a mounted VPS volume

### LLM

- One OpenAI-compatible provider behind the backend
- Backend-only API key
- Prompting and schema validation live on the server

### Deployment

- One Docker image
- Frontend built with Vite
- FastAPI serves both static files and `/api`
- Optional VPS reverse proxy for TLS and simple password protection

## Why This Shape

This keeps the PoC small while preserving the important fundamentals:

- secrets stay off the frontend
- LLM behavior is controlled server-side
- quote math is deterministic
- data persists between demos
- the stack is easy to deploy and easy to throw away if the idea does not validate

## Recommended Repository Shape

```text
src/                        # existing React frontend
server/
  app/
    main.py
    core/
      config.py
      db.py
    api/
      routes/
        health.py
        settings.py
        quotes.py
    models/
      settings.py
      quote.py
      quote_line_item.py
      quote_message.py
    schemas/
      settings.py
      quotes.py
      chat.py
    services/
      llm_service.py
      quote_engine.py
      quote_service.py
    prompts/
      quote_assistant.md
  alembic/
requirements.txt
data/
  .gitkeep
```

## Core Product Flow

1. Owner opens the app and clicks `New Quote`.
2. Backend creates a draft quote.
3. Owner describes the job in plain language.
4. Backend sends the owner message, current quote state, business defaults, and assistant instructions to the model.
5. Model returns one of:
   - `ask_question`
   - `update_quote`
6. Backend validates the response with Pydantic.
7. Backend merges valid quote changes into the draft.
8. Backend recalculates totals deterministically.
9. Frontend shows the assistant reply and updated quote.
10. Owner edits, saves, and prints the quote.

## Core Product Rule

The LLM may gather information and propose quote changes.

The backend must always own:

- money math
- totals
- tax calculation
- final persisted quote state

The LLM must never be trusted to invent final prices silently.

## Minimal Data Model

### `settings`

Single-row table for business defaults.

Fields:

- `id`
- `business_name`
- `business_email`
- `business_phone`
- `business_address`
- `default_currency`
- `default_tax_rate`
- `default_payment_terms`
- `default_validity_days`
- `updated_at`

### `quotes`

Keep customer details directly on the quote for the PoC to avoid building a full CRM too early.

Fields:

- `id`
- `quote_number`
- `status` (`draft`, `ready`, `sent`)
- `customer_name`
- `customer_company`
- `customer_email`
- `customer_phone`
- `customer_address`
- `title`
- `job_summary`
- `assumptions`
- `notes`
- `currency`
- `subtotal_cents`
- `tax_rate`
- `tax_amount_cents`
- `total_cents`
- `pricing_complete`
- `valid_until`
- `created_at`
- `updated_at`

### `quote_line_items`

Fields:

- `id`
- `quote_id`
- `description`
- `quantity`
- `unit`
- `unit_price_cents`
- `line_total_cents`
- `needs_review`
- `source` (`manual`, `ai`)
- `sort_order`

### `quote_messages`

Fields:

- `id`
- `quote_id`
- `role` (`user`, `assistant`, `system`)
- `content`
- `assistant_action`
- `quote_patch_json`
- `created_at`

## API Surface

### Health

- `GET /api/health`

Purpose:

- health check for local dev and VPS deployment

### Settings

- `GET /api/settings`
- `PATCH /api/settings`

Purpose:

- load and update business defaults used by quote generation

### Quotes

- `POST /api/quotes`
- `GET /api/quotes`
- `GET /api/quotes/{quote_id}`
- `PATCH /api/quotes/{quote_id}`

Purpose:

- create, list, read, and update draft quotes

### Quote Chat

- `POST /api/quotes/{quote_id}/chat`

Purpose:

- append a user message
- run the assistant
- validate returned structure
- update the quote if appropriate
- recalculate totals
- return the updated state

## Suggested Chat API Contract

### Request

```json
{
  "message": "I need a quote for repainting a small office with two meeting rooms."
}
```

### Response: Ask Follow-Up

```json
{
  "assistant_message": "I can help with that. What is the approximate square footage and do you want paint included?",
  "action": "ask_question",
  "quote": {
    "id": 12,
    "status": "draft"
  }
}
```

### Response: Update Quote

```json
{
  "assistant_message": "I drafted the quote and marked one line item for price review.",
  "action": "update_quote",
  "quote_patch": {
    "title": "Office repainting quote",
    "job_summary": "Interior repainting for a small office with two meeting rooms.",
    "line_items": [
      {
        "description": "Interior wall preparation and painting",
        "quantity": 1,
        "unit": "job",
        "unit_price_cents": null,
        "needs_review": true
      }
    ]
  },
  "quote": {
    "id": 12,
    "status": "draft"
  }
}
```

## LLM Output Contract

The model should always return structured JSON matching a strict schema:

```json
{
  "action": "ask_question | update_quote",
  "assistant_message": "string",
  "quote_patch": {
    "customer_name": "optional string",
    "customer_company": "optional string",
    "customer_email": "optional string",
    "title": "optional string",
    "job_summary": "optional string",
    "assumptions": "optional string",
    "notes": "optional string",
    "line_items": [
      {
        "description": "string",
        "quantity": 1,
        "unit": "job",
        "unit_price_cents": 10000,
        "needs_review": false
      }
    ]
  }
}
```

### LLM Rules

- Ask one focused follow-up question at a time
- Do not invent customer details
- Do not invent prices when uncertain
- If a price is unknown, return `unit_price_cents: null` and `needs_review: true`
- Keep assistant messages concise and businesslike
- Prefer incomplete-but-honest over fabricated certainty

## Quote Calculation Rules

All quote totals must be calculated by backend code.

### Backend Responsibilities

- sum line item totals
- apply default or chosen tax rate
- calculate subtotal, tax, and total
- mark quote as incomplete if any line item still needs review or lacks pricing

### PoC Simplification

For v1:

- use one default tax rate from settings
- no discount engine
- no travel fee logic
- no advanced templates
- no jurisdiction-specific tax logic

## Frontend Screens

### Dashboard

Purpose:

- entry point for demos
- list recent quotes
- button to create a new quote

Main elements:

- page header
- recent quote list
- status badges
- new quote button

### Quote Workspace

Purpose:

- primary PoC screen

Layout:

- left: chat thread + composer
- right: live quote editor and totals panel

Main elements:

- chat message list
- message input
- quote header fields
- line items editor
- totals summary
- save status
- print button

### Settings

Purpose:

- set business defaults used by the assistant

Main fields:

- business name
- contact info
- tax rate
- payment terms
- validity window
- default currency

## Frontend Components To Add

- `AppShell`
- `QuoteList`
- `QuoteStatusBadge`
- `ChatThread`
- `ChatMessage`
- `ChatComposer`
- `QuoteEditor`
- `LineItemsTable`
- `TotalsCard`
- `SettingsForm`
- `EmptyState`
- `LoadingState`

## Recommended Routes

- `/` -> dashboard
- `/quotes/new` -> create draft and redirect to quote workspace
- `/quotes/:id` -> quote workspace
- `/settings` -> business defaults

## State Management Recommendation

Keep this simple for the PoC.

### Default

- small `lib/api.ts` fetch wrapper
- page-level `useState` and `useEffect`
- custom hooks only where helpful

### Avoid For Now

- Redux
- Zustand
- large client-side domain layer

If async state becomes annoying later, add React Query.

## Implementation Phases

### Phase 1 - Backend Foundation

Tasks:

- [x] add FastAPI app skeleton
- [x] add config management
- [x] add SQLite connection
- [x] add SQLAlchemy models
- [x] add Alembic migrations
- [x] add `GET /api/health`
- [x] add settings read and update endpoints
- [x] add local dev setup for frontend and backend

Acceptance criteria:

- [x] frontend and backend run locally
- [x] SQLite DB file is created
- [x] settings can be loaded and updated
- [x] health endpoint works

### Phase 2 - Quote CRUD + Workspace Shell

Tasks:

- [x] add quote and line item models
- [x] add quote CRUD endpoints
- [x] add dashboard screen
- [x] add quote workspace route
- [x] add quote editor panel
- [x] add manual line item editing
- [x] add save and update flow

Acceptance criteria:

- [x] owner can create a draft quote
- [x] owner can edit customer fields and line items
- [x] totals are calculated correctly
- [x] quote can be saved and reopened

### Phase 3 - LLM Chat Integration

Tasks:

- [x] add prompt file
- [x] implement `llm_service.py`
- [x] define Pydantic schema for assistant response
- [x] add `POST /api/quotes/{id}/chat`
- [x] store quote messages
- [x] merge validated quote patches
- [x] show updated quote state in the UI

Acceptance criteria:

- [x] owner can chat against a quote
- [x] assistant asks follow-up questions when needed
- [x] assistant can update the draft quote
- [x] invalid model output is rejected safely
- [x] totals remain backend-controlled

### Phase 4 - Demo Polish

Tasks:

- [x] add loading and error states
- [x] add `needs review` UI for incomplete pricing
- [ ] add print-friendly quote view
- [x] add quote status badge
- [ ] add simple search or filter on dashboard
- [x] improve empty states and messaging

Acceptance criteria:

- demo flow feels coherent end to end
- unclear pricing is visibly flagged
- owner can print the quote cleanly
- app feels stable enough to show prospects

### Phase 5 - Deployment

Tasks:

- [ ] update Docker build to include Python backend and built frontend
- [ ] serve `dist/` from FastAPI in production
- [ ] mount SQLite file as a volume
- [ ] add environment variables
- [ ] add reverse proxy or simple password protection
- [ ] add DB backup plan

Acceptance criteria:

- app runs on one VPS
- data survives container restarts
- app is behind HTTPS and password protection
- backup procedure is documented and tested

## Deployment Defaults

### App Runtime

- FastAPI serves the static frontend and API
- run with `uvicorn`

### Storage

- SQLite at `/app/data/app.db`
- enable WAL mode
- mount `/app/data` from host

### Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `APP_ENV`
- `APP_SECRET` if app-side password or session is added
- `ALLOWED_ORIGINS` for dev if frontend and backend run separately

### VPS Protection

Recommended minimum:

- HTTPS at reverse proxy
- basic auth or one shared login page
- no public anonymous access

### Backup

- nightly copy of SQLite DB file
- keep 7 to 14 daily backups
- test restoration once before demos

## Demo Script Recommendation

Use 3 repeatable scenarios to validate the product:

1. A straightforward job with enough detail
2. A job missing key details so the assistant must ask follow-up questions
3. A job with unknown pricing so the assistant must flag items for review

If these 3 demos work well, the PoC is strong enough to show.

## Go / No-Go Evaluation

After 5 to 10 realistic quote runs, evaluate:

- Did the tool save time?
- Did the owner trust the draft?
- Were follow-up questions useful?
- How much manual cleanup was still needed?
- Did prospects immediately understand the value?

If the answer is mostly no, stop and narrow the use case before building more.

## Recommended Next Step After PoC

If the PoC works, the next investment should not be more AI first.

It should be:

1. pick one specific business niche
2. improve pricing structure for that niche
3. improve quote template quality
4. add a small customer directory
5. add send and export workflow

## First Build Order Summary

1. FastAPI skeleton
2. SQLite schema
3. settings screen
4. quote CRUD
5. quote workspace
6. backend quote calculator
7. LLM chat endpoint
8. validation and review flags
9. print view
10. VPS deploy

## Notes

This plan is intentionally biased toward fast validation, not long-term platform design.

The main product question is not whether the LLM is clever enough.

The real question is whether this workflow saves enough time and feels trustworthy enough that a business owner would want to keep using it.

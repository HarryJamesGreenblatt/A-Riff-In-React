# Template Summary: What this template is and what it does

This short note complements the existing project documentation with a concise, non-repetitive summary that explains the template's purpose, intended audience, and quick usage patterns.

Who this is for

- Developers who need a modern React + TypeScript starter that demonstrates production-ready patterns.
- Teams that want an opinionated but adaptable scaffold for hybrid Azure SQL + Cosmos DB applications.
- Educators and demonstrators who want a clear example of Azure containerized backends, managed identity usage, and MSAL authentication.

What the template provides (at a glance)

- A Vite + React + TypeScript frontend with feature-based organization.
- An Express.js backend (in `api/`) designed to run containerized on Azure Container Apps.
- Example integrations: Azure SQL (relational) and Cosmos DB (document) with code patterns for when to use each.
- Authentication scaffolding using Microsoft Authentication Library (MSAL) and managed identity patterns.
- Minimal but opinionated UI examples (feature cards, hero, auth buttons) using semantic CSS and component patterns.
- CI/CD and deployment examples: GitHub Actions workflows and Bicep infrastructure templates under `infra/`.

Design and implementation goals

- Keep the template easy to understand and modify. Small, focused examples (User feature, Activity feature) provide practical guidance without overwhelming the starter.
- Demonstrate secure, modern patterns for cloud-native development: containers, managed identities, environment-driven configuration, and least-privilege access.
- Be framework-agnostic at the surface: the UI avoids deep coupling to a single design system so teams can adopt Tailwind, CSS modules, or component libraries as needed.

Quick start notes

- Frontend:
  - Root entry: `src/main.tsx` and top-level app in `src/App.tsx`.
  - Global styles live in `src/index.css` (this project intentionally keeps semantic CSS minimal and framework-free).
  - Routes use React Router; add pages in `src/pages` and components in `src/components`.

- Backend:
  - API entry: `api/src/index.ts`.
  - Local run: `docker-compose up` from the repo root (see `api/README.md` for details).

- Deploy:
  - Infrastructure is defined in `infra/main.bicep` and helper modules.
  - GitHub Actions workflows demonstrate container and static web deployments.

Where to add more

If you want to expand the documentation, consider small additions here rather than editing the canonical files:

- Short usage patterns and decision notes: when to choose SQL vs Cosmos vs cache.
- Security patterns: how managed identity is used and how to test locally.
- A small "what's inside the template" quick-reference table for common files and entry points.

---

This supplemental file is intentionally short to avoid repeating content in the main docs; treat it as a developer-facing quick summary to orient new contributors.

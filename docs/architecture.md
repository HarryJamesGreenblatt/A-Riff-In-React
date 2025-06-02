# Architecture

This document describes the modular architecture of **A Riff In React**, a production-ready React template designed for hybrid Azure SQL + Cosmos DB applications.

> _This architecture is inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

## Overview

- **Component-based structure**: All UI and logic are organized into reusable components and feature modules.
- **Hybrid persistence**: Demonstrates integration with both Azure SQL Database (for structured data) and Cosmos DB (for flexible, real-time data).
- **Azure-ready**: Designed for seamless deployment to Azure App Service, with extension points for Key Vault and Application Insights.

## Folder Structure

```
src/
  components/      # Reusable UI components
  features/        # Feature modules (e.g., user, activity)
  context/         # React context providers
  routes/          # App routing
  ...
```

## Modularity

- Each feature is self-contained, similar to Flask blueprints.
- Context and hooks provide extensibility for state management (Redux-ready).

## Extending the Template

- Add new features as modules in `src/features/`.
- Replace example entities (User, Activity) with your own domain models.

---

> _For a detailed comparison with the Flask template, see [A Fugue In Flask: architecture.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/architecture.md)_

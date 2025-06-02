# Architecture

This document describes the modular architecture of **A Riff In React**, a production-ready React template designed for hybrid Azure SQL + Cosmos DB applications.

> _This architecture is inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

## Overview

- **Component-based structure**: All UI and logic are organized into reusable components and feature modules.
- **Hybrid persistence**: Demonstrates integration with both Azure SQL Database (for structured data) and Cosmos DB (for flexible, real-time data).
- **Azure-ready**: Designed for seamless deployment to Azure App Service, with extension points for Key Vault and Application Insights.

## State Management

The application uses Redux Toolkit for centralized state management, providing:

- **Predictable State Updates**: Single source of truth for application state
- **RTK Query**: Powerful data fetching and caching solution
- **Feature-based Organization**: Each feature has its own slice
- **TypeScript Integration**: Fully typed state and actions

### State Structure

```
Store
├── api/              # RTK Query API state
├── users/            # User management state
│   ├── currentUser   # Currently authenticated user
│   └── isAuthenticated
└── activity/         # Activity logging state
    ├── recentActivities
    └── isLoading
```

### Data Flow

1. **Components** dispatch actions or use RTK Query hooks
2. **Actions** are processed by reducers or API endpoints
3. **State** is updated immutably using Redux Toolkit
4. **Components** re-render based on state changes

## Folder Structure

```
src/
  components/      # Reusable UI components
  features/        # Feature modules (e.g., user, activity)
    users/         # User feature
      slice.ts     # Redux slice with reducers and actions
    activity/      # Activity feature  
      slice.ts     # Redux slice with reducers and actions
  store/           # Redux store configuration
    index.ts       # Store setup
    api.ts         # RTK Query API configuration
    hooks.ts       # Typed Redux hooks
  context/         # React context providers (if needed)
  routes/          # App routing
  ...
```

## Modularity

- Each feature is self-contained, similar to Flask blueprints.
- Context and hooks provide extensibility for state management (Redux-ready).

## Extending the Template

- Add new features as modules in `src/features/`
- Create Redux slices for feature-specific state
- Use RTK Query for all API interactions
- Replace example entities (User, Activity) with your own domain models

---

> _For a detailed comparison with the Flask template, see [A Fugue In Flask: architecture.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/architecture.md)_

# Architecture

This document describes the modular architecture of **A Riff In React**, a production-ready React template designed for hybrid Azure SQL + Cosmos DB applications.

> _This architecture is inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

## Overview

- **Component-based structure**: All UI and logic are organized into reusable components and feature modules.
- **Hybrid persistence**: Demonstrates integration with both Azure SQL Database (for structured data) and Cosmos DB (for flexible, real-time data).
- **Azure-ready**: Designed for seamless deployment to Azure App Service.

## Azure Infrastructure Architecture

A core principle of the "Scaffolding" series of templates (`A Fugue in Flask`, `A Riff in React`, etc.) is resource optimization and cost management. To that end, the Azure infrastructure is designed around a **shared resource model** for expensive components.

### Database Strategy: Shared Server, Dedicated Databases

- **Shared SQL Server**: Instead of provisioning a new, costly Azure SQL Server for each project, all templates are designed to deploy their databases to a single, pre-existing shared server (e.g., `sequitur-sql-server` in the `db-rg` resource group).
- **Dedicated Databases**: Each project provisions its own dedicated database (e.g., `riff-react-db`) on the shared server. This provides complete data and schema isolation between applications.
- **Cross-Resource Group Deployment**: The database is deployed to the shared server's resource group using a dedicated Bicep module (`infra/modules/sqlDatabase.bicep`), which is the best practice for deploying child resources (the database) to a parent resource (the server) located in a different resource group.

This pattern provides the best of both worlds:
1.  **Cost Efficiency**: Avoids the high cost of running multiple SQL server instances.
2.  **Isolation & Security**: Each application has its own database and credentials, ensuring strong security and data boundaries.
3.  **Independent Schemas**: Each database has a completely independent schema, allowing for tailored data models per application without conflict.

## Backend Architecture: Express on Azure Functions

To provide a scalable and maintainable serverless backend, this project uses the **"Express on Functions"** pattern. This hybrid approach combines the familiar structure and robust middleware ecosystem of the Express.js framework with the serverless, event-driven power of Azure Functions.

### How It Works

1.  **Express App (`api/src/app.ts`)**: A standard Express application is defined. This is where all middleware (CORS, body-parser), routes, and application logic reside. It's the heart of the API.
2.  **Azure Function Trigger (`api/src/functions/api.ts`)**: A single, generic HTTP-triggered Azure Function is created. Its route is configured with a wildcard (`{*route}`) to catch all incoming API requests.
3.  **The Adapter**: The core of the pattern is the adapter code within the Azure Function trigger. This code is responsible for:
    *   Translating the incoming Azure Functions `HttpRequest` object into a format that Express can understand (`Request`).
    *   Creating a mock Express `Response` object.
    *   Passing both to the Express app instance.
    *   Capturing the output from the mock `Response` (e.g., status code, JSON body) and translating it back into an `HttpResponseInit` object that the Azure Functions runtime can send back to the client.

### Advantages of this Pattern

-   **Structured & Scalable**: Allows for a well-organized API with routers, controllers, and services, which is difficult to achieve with many individual, disconnected functions.
-   **Full Middleware Support**: The entire Express middleware ecosystem is available, simplifying tasks like authentication, logging, and error handling.
-   **Developer Familiarity**: Developers with Express experience can be immediately productive without needing to learn a new paradigm for every piece of logic.
-   **Serverless Benefits**: Still retains the core benefits of Azure Functions, including automatic scaling, consumption-based pricing, and integrated triggers.
-   **Local Development**: The API can be developed and tested locally using the standard Azure Functions Core Tools, providing a high-fidelity development environment.

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

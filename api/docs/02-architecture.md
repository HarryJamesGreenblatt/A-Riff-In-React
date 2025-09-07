# Architecture

This document describes the modular architecture of **A Riff In React**, a production-ready React template designed for hybrid Azure SQL + Cosmos DB applications running on Windows Azure App Service.

> _This architecture is inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

## Overview

- **Component-based structure**: All UI and logic are organized into reusable components and feature modules.
- **Windows App Service**: Single Windows-based App Service Plan hosting both React frontend and Node.js API.
- **Hybrid persistence**: Demonstrates integration with both Azure SQL Database (for structured data) and Cosmos DB (for flexible, real-time data).
- **External Authentication**: Microsoft Entra External ID for customer identity management.
- **Azure-ready**: Designed for seamless deployment to Azure App Service with IIS integration.

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

## Backend Architecture: Express on Azure App Service

The backend uses a standard Express.js server deployed to Azure App Service, providing a familiar development experience with the managed services and scalability of Azure.

### How It Works

1.  **Express Server (`api/deployment/server.js`)**: A standard Express application with middleware (CORS, body-parser), routes, and application logic. This is the complete API server.
2.  **Azure App Service Hosting**: The Express server runs directly on Azure App Service's Node.js runtime, providing automatic scaling, load balancing, and managed infrastructure.
3.  **Simple Deployment**: The server is deployed as a complete Node.js application package containing the Express server and all dependencies.

### Advantages of this Pattern

-   **Familiar Development**: Standard Express.js development patterns with full middleware support
-   **Simplified Architecture**: Direct server deployment without function wrappers or adapters
-   **Full Express Features**: Complete access to Express ecosystem and patterns
-   **Azure Benefits**: Managed infrastructure, automatic scaling, integrated monitoring
-   **Cost Effective**: Predictable pricing with Basic tier App Service hosting
-   **Local Development**: Standard Node.js development and testing workflows

### Current Status

**⚠️ Deployment Issue**: The API is currently experiencing startup failures due to TypeScript compiler errors in the Azure environment. The Express server code is functional, but the deployment environment contains conflicting TypeScript build configurations.

**Resolution in Progress**: Clean deployment package with only JavaScript files and production dependencies has been created and deployed.

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

# Architecture

This document describes the modular architecture of **A Riff In React**, a production-ready React template designed for hybrid Azure SQL + Cosmos DB applications running on Azure Container Apps and Static Web Apps.

> _This architecture is inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

## Overview

- **Component-based structure**: All UI and logic are organized into reusable components and feature modules.
- **Container Apps**: Containerized Express API with TypeScript running on Azure Container Apps.
- **Static Web Apps**: React frontend hosted on Azure Static Web Apps.
- **Hybrid persistence**: Demonstrates integration with both Azure SQL Database (for structured data) and Cosmos DB (for flexible, real-time data).
- **External Authentication**: Microsoft Entra External ID for customer identity management.
- **Azure-ready**: Designed for seamless deployment with CI/CD via GitHub Actions.

## Azure Infrastructure Architecture

A core principle of the "Scaffolding" series of templates (`A Fugue in Flask`, `A Riff in React`, etc.) is resource optimization and cost management. To that end, the Azure infrastructure is designed around a **shared resource model** for expensive components.

### Database Strategy: Shared Server, Dedicated Databases

- **Shared SQL Server**: Instead of provisioning a new, costly Azure SQL Server for each project, all templates are designed to deploy their databases to a single, pre-existing shared server (e.g., `sequitur-sql-server` in the `db-rg` resource group).
- **Dedicated Databases**: Each project provisions its own dedicated database (e.g., `riff-react-db`) on the shared server. This provides complete data and schema isolation between applications.
- **Cross-Resource Group Deployment**: The database is deployed to the shared server's resource group using a dedicated Bicep module (`infra/modules/sqlRoleAssignment.bicep`), which is the best practice for deploying role assignments for a parent resource (the server) located in a different resource group.

This pattern provides the best of both worlds:
1.  **Cost Efficiency**: Avoids the high cost of running multiple SQL server instances.
2.  **Isolation & Security**: Each application has its own database and credentials, ensuring strong security and data boundaries.
3.  **Independent Schemas**: Each database has a completely independent schema, allowing for tailored data models per application without conflict.

## Backend Architecture: Express on Azure Container Apps

The backend uses a standard Express.js server containerized with Docker and deployed to Azure Container Apps, providing a platform-agnostic, scalable, and managed hosting environment.

### How It Works

1.  **Express Server (`api/src/index.ts`)**: A standard Express application with middleware (CORS, body-parser), routes, and application logic compiled from TypeScript.
2.  **Docker Containerization**: The Express server is packaged in a Docker container with a multi-stage build process that optimizes for production.
3.  **Azure Container Apps Hosting**: The containerized Express server runs in Azure Container Apps, providing automatic scaling, load balancing, and managed infrastructure.
4.  **Managed Identity**: The container uses Azure Managed Identity to securely access Azure SQL Database and Cosmos DB without storing credentials.

### Advantages of this Pattern

-   **Platform Independence**: Containerization eliminates platform-specific issues (like IISNode compatibility)
-   **Consistent Environments**: Same container runs locally and in production
-   **Simplified Scaling**: Container Apps handles scaling and orchestration
-   **Better Security**: Managed Identity eliminates need for stored credentials
-   **Cost Effective**: Pay only for the resources you use with consumption-based pricing
-   **Local Development**: Easy local testing with Docker Compose

## Frontend Architecture: React on Static Web Apps

The frontend is a React application hosted on Azure Static Web Apps, providing a modern, scalable hosting solution with built-in CDN capabilities.

### How It Works

1.  **React Application**: Standard React application built with modern tools and patterns
2.  **Static Web Apps Hosting**: Optimized for static site hosting with dynamic API routing
3.  **CI/CD Integration**: Built-in GitHub Actions integration for automated deployments
4.  **Global CDN**: Automatic content delivery network for improved performance

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
/
├── src/                        # Frontend React code
├── api/                        # Backend Express API 
│   ├── src/                    # API source code
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Database services
│   │   └── models/             # Data models
│   └── Dockerfile              # Multi-stage build for API container
├── infra/                      # Infrastructure as Code (Bicep)
│   ├── main.bicep              # Main deployment template
│   └── modules/                # Modular Bicep components
├── .github/workflows/          # CI/CD pipeline
│   ├── container-deploy.yml    # API deployment workflow
│   └── static-web-deploy.yml   # Frontend deployment workflow
└── docker-compose.yml          # Local development setup
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

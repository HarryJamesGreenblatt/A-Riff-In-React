# A Riff In React

## 📢 Current Status: ✅ RESOLVED - Platform Migration Complete

**Date:** September 6, 2025

**Resolution:** ✅ **API Deployment Successfully Migrated to Container Apps**

**Root Causes Addressed:**
1. **Platform Compatibility**: Previous Windows App Service with IISNode caused TypeScript compilation issues
2. **Environment-Specific Configuration**: Deployment environment inconsistencies led to runtime failures
3. **Database Authentication**: Connection string approach was less secure and difficult to manage

**Solutions Implemented:**
- ✅ **Containerized Approach**: API migrated to Docker containers with multi-stage builds
- ✅ **Azure Container Apps**: Deployment platform changed to Container Apps for better scalability
- ✅ **Managed Identity**: Secure, credential-free database access implemented
- ✅ **Static Web Apps**: Frontend migrated to Static Web Apps with global CDN
- ✅ **Dual CI/CD Workflows**: Separate pipelines for API and frontend

**Current Status - Systems Operational with Integration Pending:**   
- ✅ **Frontend**: Live at https://a-riff-in-react.harryjamesgreenblatt.com (Basic template deployed, custom domain with SSL)
- ✅ **API Backend**: Live at https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io (Full REST API ready)
- 🔧 **Frontend-API Integration**: Not yet connected - React app needs API integration
- ✅ **Database**: Cosmos DB provisioned and ready
- ✅ **Infrastructure**: Container Apps Environment, Registry, Monitoring active
- ⚠️ **Cost Optimization**: Orphaned App Service resources accumulating costs (cleanup needed)

---

A modern, production-ready React application template demonstrating hybrid Azure SQL Database + Cosmos DB architecture.

## 🎯 Project Vision

**A Riff In React** is a general-purpose, production-ready React template that demonstrates best practices for modular architecture, Azure deployment, and polyglot persistence using both Azure SQL Database and Cosmos DB. This template is designed to be reusable for a variety of business scenarios, providing a solid foundation for scalable, maintainable, and Azure-ready web applications.

> _This template's modular structure and deployment patterns are inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._

While the template includes example modules (such as user management and activity logs) to illustrate hybrid database patterns, it is not tied to any specific domain. Example scenarios, such as a running club management app, are provided in the documentation to demonstrate how to extend the template for real-world use cases.

## 📈 Development Progress

### ✅ Phase 1: Foundation (COMPLETED)
- ✅ **Documentation Framework**: Comprehensive docs structure established
- ✅ **Project Vision**: General-purpose, Azure-ready template defined
- ✅ **Basic React App Structure**: Vite + TypeScript + React 18 setup complete

### ✅ Phase 2: Core Features (95% COMPLETED ✅)
- ✅ **UI framework integration**: Tailwind CSS + shadcn/ui-style components implemented
- ✅ **State management setup**: Redux Toolkit + RTK Query implemented
- ✅ **Authentication system (MSAL)**: Microsoft Entra External ID fully operational
- ✅ **Database infrastructure**: Azure SQL + Cosmos DB infrastructure deployed
- ✅ **Backend API**: Express containerized on Azure Container Apps
- ✅ **Azure deployment**: Dual CI/CD pipelines with GitHub Actions
- ✅ **Production deployment**: Frontend + API both live and operational
- ✅ **Containerization**: Docker multi-stage builds for consistent deployment
- ✅ **Platform Migration**: Successfully moved from App Service to Container Apps
- [ ] **Frontend-Backend Integration**: Connect React app to Container App API (CURRENT PRIORITY)

>**Current Status**: Infrastructure migration to Container Apps complete! Both frontend and API are deployed and operational. **Next critical step**: Integrate React frontend with the Container App API and clean up orphaned App Service resources to reduce costs.

### 📋 Phase 3: Example Extensions (READY)
- [ ] Example: User management (Azure SQL)
- [ ] Example: Activity log (Cosmos DB)
- [ ] Example: Real-time updates
- [ ] Example: Analytics dashboard

### 🚀 Phase 4: Advanced Features (PLANNED)
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite ✅
- **UI Framework**: Tailwind CSS + shadcn/ui-style components ✅
- **State Management**: Redux Toolkit + RTK Query ✅
- **Authentication**: Microsoft Entra External ID (MSAL) ✅
- **Backend API**: Node.js + Express in Docker container ✅
- **Databases**: Azure SQL Database + Cosmos DB ✅
- **Infrastructure**: Azure Bicep templates ✅
- **Hosting**: Azure Container Apps + Static Web Apps ✅
- **CI/CD**: GitHub Actions with container registry ✅

## 🌐 Live Demo
   
**Frontend URL**: https://a-riff-in-react.harryjamesgreenblatt.com (Basic template - API integration pending, custom domain with SSL)   
**API URL**: https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io (Full REST API operational)

## Architecture

This project follows modern cloud-native architecture:

- **Frontend**: React SPA hosted on Azure Static Web Apps
- **API**: Express.js containerized API hosted on Azure Container Apps
- **Data Storage**: 
  - Azure SQL Database for structured data (users, projects)
  - Azure Cosmos DB for activity logs and real-time data
- **Authentication**: Microsoft Entra External ID

## 🚀 Getting Started

### Prerequisites

- Node.js 18 LTS or higher
- Docker Desktop
- Visual Studio Code
- Git

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd api && npm install
   ```
3. Start the development servers:
   ```bash
   # Start the React development server
   npm run start
   
   # In another terminal, start the API using Docker
   docker-compose up
   ```

## Deployment

This project uses GitHub Actions for CI/CD:

- **Container Deploy Workflow**: Builds and deploys the API to Azure Container Apps
- **Static Web Deploy Workflow**: Builds and deploys the frontend to Azure Static Web Apps

See the [CI/CD Setup Guide](./docs/ci-cd-setup.md) for detailed instructions.

## Project Structure

```
/
├── src/                      # Frontend React code
├── api/                      # Backend Express API 
│   ├── src/                  # API source code
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Database services
│   │   └── models/           # Data models
│   └── Dockerfile            # Multi-stage build for API container
├── infra/                    # Infrastructure as Code (Bicep)
│   ├── main.bicep            # Main deployment template
│   └── modules/              # Modular Bicep components
├── .github/workflows/        # CI/CD pipeline
│   ├── container-deploy.yml  # API deployment workflow
│   └── static-web-deploy.yml # Frontend deployment workflow
└── docker-compose.yml        # Local development setup
```

## 📚 Documentation

Complete documentation is available in the [docs folder](./docs/README.md) with a logical progression from setup to deployment:

### Quick Navigation
- **Getting Started**: [Project Overview](./docs/01-project-overview.md) → [Architecture](./docs/02-architecture.md) → [Development Setup](./docs/03-development-setup.md)
- **Development**: [Local Development](./docs/04-local-development.md) → [UI Framework](./docs/05-ui-framework-setup.md) → [State Management](./docs/06-state-management.md)
- **Authentication**: [MSAL Integration](./docs/07-authentication-msal.md)
- **Backend**: [Backend API](./docs/08-backend-api.md)
- **Deployment**: [Provider Registration](./docs/09-provider-registration.md) → [Azure Deployment](./docs/10-azure-deployment.md) → [CI/CD Pipeline](./docs/11-github-actions-ci-cd.md)

### Phase-Based Documentation Structure
1. **Understanding & Setup** (01-04): Project basics and local development
2. **Frontend Implementation** (05-07): React, UI, state management, auth
3. **Backend & Infrastructure** (08-11): API, Azure deployment, CI/CD
4. **Operations & Reference** (12+): Success documentation and troubleshooting

---

**Development Methodology**: Feature-by-feature, commit-by-commit collaborative approach

---

> _For architectural, deployment, and documentation patterns, see [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask) for reference and rationale._

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authentication Status (2025-09-14)

- The project implements MSAL with Microsoft Entra External ID and a hybrid plan to include Google social sign-in.
- A hosted External ID user flow (`B2X_1_user-flow-for-a-riff-in-react`) exists but is not yet active for the SPA because the app must be associated with the user flow or the SPA must launch the user-flow authority. See `docs/07-authentication-msal.md` and `context/Auth Modernization/auth-modernization-journal.md` for detailed debugging notes and next steps.

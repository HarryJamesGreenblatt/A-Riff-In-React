# A Riff In React

## 📢 Front Page News: Current Task

**Date:** 2025-08-30

**Task:** Frontend-Backend Integration

**Summary:** The backend API (Express on Azure Functions) is successfully deployed and functional. TypeScript build errors have been resolved. The next critical step is to connect the React frontend to the deployed API endpoints using RTK Query to create a complete full-stack application with user management functionality.

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

### 🚧 Phase 2: Core Features (COMPLETED ✅)
- ✅ **UI framework integration**: Tailwind CSS + shadcn/ui-style components implemented
- ✅ **State management setup**: Redux Toolkit + RTK Query implemented
- ✅ **Authentication system (MSAL)**: Microsoft Entra External ID integration complete
- ✅ **Database infrastructure**: Azure SQL + Cosmos DB infrastructure deployed
- ✅ **Backend API**: Express on Azure Functions with user management endpoints
- ✅ **Azure deployment**: Complete CI/CD pipeline with GitHub Actions  
- ✅ **Production deployment**: Live at https://a-riff-in-react.azurewebsites.net
- ✅ **TypeScript build fixes**: Deployment errors resolved
- [ ] **Frontend-Backend Integration**: Connect React app to API endpoints

> **Note**: Successfully migrated from Azure AD B2C to Microsoft Entra External ID for cost optimization and modern authentication. Backend API implemented using "Express on Functions" pattern.

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
- **Backend API**: Node.js + Express on Azure Functions ✅
- **Databases**: Azure SQL Database + Cosmos DB ✅
- **Infrastructure**: Azure Bicep templates ✅
- **Hosting**: Azure App Service + Azure Functions ✅
- **CI/CD**: GitHub Actions ✅

## 🌐 Live Demo

**Production URL**: https://a-riff-in-react.azurewebsites.net

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

- [Project Overview](./docs/01-project-overview.md) - Vision and architecture
- [Development Setup](./docs/02-development-setup.md) - Getting started guide
- [UI Framework Setup](./docs/03-ui-framework-setup.md) - Tailwind CSS and shadcn/ui integration
- [Full Documentation](./docs/README.md) - Complete documentation index

---

**Development Methodology**: Feature-by-feature, commit-by-commit collaborative approach

---

> _For architectural, deployment, and documentation patterns, see [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask) for reference and rationale._

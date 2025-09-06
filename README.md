# A Riff In React

## 📢 Current Status: ✅ RESOLVED - API Deployment Issues

**Date:** September 6, 2025

**Resolution:** ✅ **API 500 Errors Successfully Fixed**

**Root Causes Resolved:**
1. **IISNode Incompatibility**: Express server configuration was incompatible with Azure App Service Windows iisnode
2. **App Settings Override**: GitHub Actions was destructively overwriting Bicep-configured app settings (KeyVault refs, App Insights)

**Solutions Implemented:**
- ✅ **IISNode Compatibility**: Added `app.set('port', port)` and removed callback from `app.listen()`
- ✅ **App Settings Preservation**: Removed destructive override in GitHub Actions, preserving Bicep configuration
- ✅ **Enhanced web.config**: Proper iisnode configuration with WebSocket disabled and security settings

**Current Status - All Systems Operational:**
- ✅ **Frontend**: Live at https://a-riff-in-react.azurewebsites.net (200 OK)
- ✅ **API Backend**: Live at https://api-a-riff-in-react.azurewebsites.net (200 OK) 
- ✅ **Authentication**: Microsoft Entra External ID fully functional  
- ✅ **Infrastructure**: Windows App Service + proper iisnode configuration
- ✅ **CI/CD Pipeline**: GitHub Actions with preserved Bicep settings

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
- ✅ **Backend API**: Express on Azure App Service Windows with proper iisnode configuration
- ✅ **Azure deployment**: Complete CI/CD pipeline with GitHub Actions preserving Bicep settings
- ✅ **Production deployment**: Frontend + API both live and operational
- ✅ **TypeScript build fixes**: All compilation errors resolved
- ✅ **IISNode compatibility**: Express server properly configured for Azure App Service Windows
- [ ] **Frontend-Backend Integration**: Connect authenticated app to working API endpoints

>**Current Status**: All major infrastructure and deployment issues resolved! Both frontend and API are operational. Next focus is on frontend-backend integration to complete the template's core functionality.

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
- **Backend API**: Node.js + Express on Azure App Service ✅
- **Databases**: Azure SQL Database + Cosmos DB ✅
- **Infrastructure**: Azure Bicep templates ✅
- **Hosting**: Azure App Service (Frontend + API) ✅
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

# A-Riff-In-React Documentation

This documentation follows a logical progression from project understanding through implementation to deployment and operations.

## 📚 Documentation Structure

### Phase 1: Understanding & Setup
Start here to understand the project and set up your development environment.

- **[01-project-overview.md](./01-project-overview.md)** - Project vision, template philosophy, and architecture goals
- **[01a-template-summary.md](./01a-template-summary.md)** - Quick summary for contributors
- **[02-architecture.md](./02-architecture.md)** - Technical architecture, patterns, and design decisions
- **[03-development-setup.md](./03-development-setup.md)** - Initial project setup and tooling configuration
- **[04-local-development.md](./04-local-development.md)** - Complete local development workflow and best practices

### Phase 2: Frontend Implementation
Build the React application with modern patterns and JWT authentication.

- **[05-ui-framework-setup.md](./05-ui-framework-setup.md)** - Tailwind CSS and shadcn/ui component integration
- **[06-state-management.md](./06-state-management.md)** - Redux Toolkit and RTK Query implementation
- **[07-authentication.md](./07-authentication.md)** - JWT-based authentication system

### Phase 3: Backend & Infrastructure  
Deploy and configure the backend API and Azure infrastructure.

- **[08-backend-api.md](./08-backend-api.md)** - Express.js API with Container Apps deployment
- **[09-provider-registration.md](./09-provider-registration.md)** - Azure Resource Provider setup (required before deployment)
- **[10-azure-deployment.md](./10-azure-deployment.md)** - Complete Azure infrastructure deployment
- **[11-github-actions-ci-cd.md](./11-github-actions-ci-cd.md)** - Automated CI/CD pipeline setup

### Phase 4: Operations & Reference
Production operations, troubleshooting, and success documentation.

- **[12-deployment-success.md](./12-deployment-success.md)** - Deployment success summary and lessons learned
- **[13-cosmos-db-features.md](./13-cosmos-db-features.md)** - Cosmos DB features: User Counter and Notifications

## 🚀 Quick Navigation

### For New Developers
1. Start with [Project Overview](./01-project-overview.md)
2. Read [Architecture](./02-architecture.md) to understand the system
3. Follow [Development Setup](./03-development-setup.md) to get started
4. Use [Local Development](./04-local-development.md) for day-to-day workflow

### For Deployment
1. Ensure [Provider Registration](./09-provider-registration.md) is complete
2. Follow [Azure Deployment](./10-azure-deployment.md) guide
3. Set up [CI/CD Pipeline](./11-github-actions-ci-cd.md)
4. Review [Deployment Success](./12-deployment-success.md) for verification

### For Frontend Work
- [UI Framework Setup](./05-ui-framework-setup.md)
- [State Management](./06-state-management.md)
- [Authentication](./07-authentication.md)

### For Backend Work
- [Backend API](./08-backend-api.md)
- [Cosmos DB Features](./13-cosmos-db-features.md)
- [Local Development](./04-local-development.md)

## 🔄 Document Maintenance

### Recent Updates (January 2025)
- **Cosmos DB Features**: Added user counter implementation and notification system planning
- **Documentation Restructure**: Numbered Cosmos features doc to follow conventions

### Previously (October 12, 2025)
- **Authentication Strategy Change**: Migrated from MSAL/Entra External ID to JWT-based auth; `docs/07-authentication.md` is the canonical guide.
- **Template-First Focus**: Emphasized portable, client-deployable architecture
- **Simplified Deployment**: Removed manual Portal configuration requirements
- **Archived**: MSAL documentation moved to `archive/` folder

### Previously (September 6, 2025)
- Fixed duplicate numbering (02-architecture vs 02-development-setup)
- Moved provider registration before deployment (critical dependency)
- Consolidated local development guides
- Improved logical flow and grouping

### Contributing to Documentation
- Follow the numbered structure for new documents
- Update cross-references when adding new content
- Keep the README updated with new sections
- Test all links and commands before committing

## 📋 Cross-References

### Key Dependencies
- **Provider Registration** (09) must be completed before **Azure Deployment** (10)
- **Development Setup** (03) is required for **Local Development** (04)
- **Authentication** (07) demonstrates JWT patterns used in **Backend API** (08)
- **Cosmos DB Features** (13) builds on **Backend API** (08) and **State Management** (06)

### Common Workflows
- **Getting Started**: 01 → 02 → 03 → 04
- **Frontend Development**: 04 → 05 → 06 → 07
- **Deployment**: 09 → 10 → 11 → 12
- **Full Implementation**: Follow numerical order 01-13

## 🎯 Template Philosophy

This documentation reflects our **template-first** approach:

**Key Principles:**
1. **Portable**: Works in any Azure subscription without modification
2. **Simple**: Zero manual configuration, fully automated deployment
3. **Secure**: Industry-standard patterns (JWT, bcrypt, HTTPS)
4. **Extensible**: Easy to customize for specific use cases

**Not Included (By Design):**
- Complex enterprise identity integrations (Azure AD, Entra External ID)
- Multi-tenant architectures
- Advanced OAuth flows
- Separate B2C/External ID tenants

**Why?** These add deployment friction. Clients needing these features can extend the template.

## 📦 What Clients Get

When deploying this template, clients receive:

✅ **Working Application** (15-minute deployment)
- User registration and login (JWT-based)
- Profile management
- Activity logging examples
- User counter feature (Cosmos DB)
- Responsive UI

✅ **Complete Infrastructure** (Bicep templates)
- Azure Container Apps for API
- Azure Static Web Apps for frontend
- Azure SQL Database for structured data
- Cosmos DB for flexible data
- Managed Identity for secure access
- Container Registry for Docker images

✅ **CI/CD Pipeline** (GitHub Actions)
- Automated deployments on push
- Docker image building
- Health check verification

✅ **Development Environment** (Docker Compose)
- Local API and frontend development
- Hot reload for both
- Consistent with production

## 🔍 Finding Information

**If you need to...**
- Understand the project vision → [01-project-overview.md](./01-project-overview.md)
- See the technical architecture → [02-architecture.md](./02-architecture.md)
- Set up locally → [03-development-setup.md](./03-development-setup.md) + [04-local-development.md](./04-local-development.md)
- Implement authentication → [07-authentication.md](./07-authentication.md)
- Work with Cosmos DB → [13-cosmos-db-features.md](./13-cosmos-db-features.md)
- Deploy to Azure → [10-azure-deployment.md](./10-azure-deployment.md)
- Set up CI/CD → [11-github-actions-ci-cd.md](./11-github-actions-ci-cd.md)
- Troubleshoot deployment → [12-deployment-success.md](./12-deployment-success.md)

## 🗂️ Archive

Older documentation (superseded or no longer relevant) is stored in the `archive/` folder:
- `07-authentication-msal.md` - Original MSAL/Entra External ID implementation (superseded by JWT auth)
- `SSO-FIX-SUMMARY.md` - SSO troubleshooting notes (no longer applicable)

---

> **Note**: This documentation was restructured on October 12, 2025, to reflect the shift from MSAL/Entra External ID to JWT-based authentication, emphasizing template portability and client deployability.

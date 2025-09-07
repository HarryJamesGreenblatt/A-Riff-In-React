# A-Riff-In-React Documentation

This documentation follows a logical progression from project understanding through implementation to deployment and operations.

## 📚 Documentation Structure

### Phase 1: Understanding & Setup
Start here to understand the project and set up your development environment.

- **[01-project-overview.md](./01-project-overview.md)** - Project vision, architecture principles, and goals
- **[02-architecture.md](./02-architecture.md)** - Technical architecture, patterns, and design decisions
- **[03-development-setup.md](./03-development-setup.md)** - Initial project setup and tooling configuration
- **[04-local-development.md](./04-local-development.md)** - Complete local development workflow and best practices

### Phase 2: Frontend Implementation
Build the React application with modern patterns and authentication.

- **[05-ui-framework-setup.md](./05-ui-framework-setup.md)** - Tailwind CSS and shadcn/ui component integration
- **[06-state-management.md](./06-state-management.md)** - Redux Toolkit and RTK Query implementation
- **[07-authentication-msal.md](./07-authentication-msal.md)** - Microsoft Entra External ID integration

### Phase 3: Backend & Infrastructure  
Deploy and configure the backend API and Azure infrastructure.

- **[08-backend-api.md](./08-backend-api.md)** - Express.js API with Container Apps deployment
- **[09-provider-registration.md](./09-provider-registration.md)** - Azure Resource Provider setup (required before deployment)
- **[10-azure-deployment.md](./10-azure-deployment.md)** - Complete Azure infrastructure deployment
- **[11-github-actions-ci-cd.md](./11-github-actions-ci-cd.md)** - Automated CI/CD pipeline setup

### Phase 4: Operations & Reference
Production operations, troubleshooting, and success documentation.

- **[12-deployment-success.md](./12-deployment-success.md)** - Deployment success summary and lessons learned

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
- [Authentication](./07-authentication-msal.md)

### For Backend Work
- [Backend API](./08-backend-api.md)
- [Local Development](./04-local-development.md)

## 🔄 Document Maintenance

### Recently Reorganized (September 6, 2025)
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
- **Authentication** (07) references **State Management** (06) patterns

### Common Workflows
- **Getting Started**: 01 → 02 → 03 → 04
- **Frontend Development**: 04 → 05 → 06 → 07
- **Deployment**: 09 → 10 → 11 → 12
- **Full Implementation**: Follow numerical order 01-12

---

> **Note**: This documentation structure was reorganized on September 6, 2025, to improve logical flow and eliminate numbering conflicts. A backup of the previous structure is available in `docs-backup-*` folders.

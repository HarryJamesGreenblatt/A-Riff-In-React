# Fresh Start Implementation Plan for A-Riff-In-React

This document provides a clean-slate approach for rebuilding the A-Riff-In-React application with best practices for Azure deployment in 2025.

## Project Requirements (From Documentation)

Based on review of `/docs` folder and current implementation:

1. **Application Type**:
   - React SPA frontend
   - Express.js API backend
   - Hybrid database strategy (Azure SQL + Cosmos DB)

2. **Core Features**:
   - User authentication with Microsoft Entra External ID
   - User management via Azure SQL Database
   - Activity logging via Cosmos DB
   - Real-time updates

3. **Target Architecture**:
   - Cloud-native architecture on Azure
   - Secure authentication
   - Cost-effective infrastructure

## Correct Implementation Strategy for 2025

### 1. Project Structure

```
/
├── src/                      # Frontend React code
├── api/                      # Backend Express API 
│   ├── src/                  # API source code with TypeScript
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Database services
│   │   └── models/           # Data models
│   ├── package.json          # API dependencies
│   └── tsconfig.json         # TypeScript configuration
├── infra/                    # Infrastructure as Code
│   ├── main.bicep            # Main Bicep template
│   ├── modules/              # Modular Bicep components
│   │   ├── staticWebApp.bicep # Frontend hosting
│   │   ├── containerApp.bicep # API hosting
│   │   ├── sqlDatabase.bicep  # SQL Database 
│   │   └── cosmosDb.bicep     # Cosmos DB
│   └── azure.yaml            # Azure Developer CLI configuration
└── .github/workflows/        # CI/CD pipeline
    └── azure-deploy.yml      # GitHub Actions workflow
```

### 2. Development Tools

- **Azure Developer CLI (azd)**: Use `azd` for local development and deployment
- **Docker**: Containerize the API for consistent deployment
- **TypeScript**: Use TypeScript for both frontend and API for type safety

### 3. Infrastructure Approach

#### Frontend Hosting
**Azure Static Web Apps** (NOT regular App Service)
- Built-in authentication support
- GitHub integration
- Free SSL certificates
- Global CDN

#### API Hosting
**Azure Container Apps** (NOT App Service with IISNode)
- Containerized deployment eliminates platform inconsistencies
- Better scaling capabilities
- Modern Node.js support
- No IIS/Windows compatibility issues

#### Database Strategy
- **Azure SQL Database**: For structured data (users, profiles, projects)
- **Cosmos DB**: For activity logs and real-time data
- **Managed Identities**: For secure database access without connection strings in code

### 4. Authentication

- **Microsoft Entra External ID**: For customer identity
- **Microsoft Graph API**: For user profile data
- **Azure Static Web Apps Auth**: For frontend authentication

### 5. Deployment Pipeline

```
GitHub Push → GitHub Actions → Azure Developer CLI → Azure Resources
```

- Single pipeline for both infrastructure and application code
- Environment-based deployments (dev, test, prod)
- Automated testing before deployment

## Migration Strategy

1. **Create New Branch**: `fresh-start` (already done)
2. **Clean Up**:
   - Keep `/docs` folder for reference
   - Keep `/context` folder for history
   - Keep only essential frontend and API code

3. **Setup Azure Developer CLI**:
   ```bash
   # Initialize project with azd
   azd init --template azure-developer-cli-samples/react-express-webapp
   
   # Customize template for hybrid database approach
   # Add Cosmos DB modules to bicep templates
   ```

4. **Convert API to Container**:
   - Create Dockerfile for API
   - Use Node.js 20 LTS
   - Test locally with Docker

5. **Deploy**:
   ```bash
   # Provision infrastructure
   azd provision
   
   # Deploy code
   azd deploy
   ```

## Advantages Over Current Approach

1. **Reliability**: Containerized deployment eliminates platform-specific issues
2. **Simplicity**: Azure Developer CLI handles infrastructure and deployment
3. **Maintainability**: Clean separation of concerns
4. **Cost-Effective**: Static Web App has free tier, Container Apps scale to zero
5. **Modern**: Latest Node.js support without compatibility issues

## Timeline

- **Day 1**: Setup project structure and Azure Developer CLI
- **Day 2**: Implement API with Container Apps
- **Day 3**: Set up frontend with Static Web Apps
- **Day 4**: Configure authentication and database
- **Day 5**: Test and refine

## References

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [React + Express Sample Template](https://github.com/Azure-Samples/todo-nodejs-mongo)

# A Riff In React

A modern React application demonstrating hybrid database architecture with Azure SQL Database and Cosmos DB.

## Project Overview

A Riff In React is a web application designed for music collaboration, allowing users to share musical riffs, collaborate on compositions, and build musical projects together. The application demonstrates modern web development practices with React, Azure, and Microsoft Entra External ID.

## Architecture

This project follows modern cloud-native architecture:

- **Frontend**: React SPA hosted on Azure Static Web Apps
- **API**: Express.js containerized API hosted on Azure Container Apps
- **Data Storage**: 
  - Azure SQL Database for structured data (users, projects)
  - Azure Cosmos DB for activity logs and real-time data
- **Authentication**: Microsoft Entra External ID

## Getting Started

### Prerequisites

- Node.js 18 LTS or higher
- Docker Desktop
- Visual Studio Code
- Git

### Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd api && npm install
   ```
3. Start the development servers:
   ```
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

## Documentation

- [Project Overview](./docs/01-project-overview.md)
- [Architecture](./docs/02-architecture.md)
- [Development Setup](./docs/02-development-setup.md)
- [UI Framework](./docs/03-ui-framework-setup.md)
- [State Management](./docs/04-state-management.md)
- [Authentication](./docs/05-authentication-msal.md)
- [Backend API](./docs/07-backend-api.md)
- [Azure Deployment](./docs/08-azure-deployment.md)
- [CI/CD Pipeline](./docs/09-github-actions-ci-cd.md)
- [Deployment Success](./docs/10-deployment-success.md)
- [Local Development Guide](./docs/local-development.md)
- [Production Deployment Guide](./docs/production-deployment.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

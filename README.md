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

- Node.js 20 LTS
- Azure Developer CLI (azd)
- Docker Desktop
- Visual Studio Code

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
   npm run dev
   
   # In another terminal, start the API server
   cd api && npm run dev
   ```

## Deployment

This project uses Azure Developer CLI (azd) for deployment:

```bash
# Provision and deploy
azd up

# Just provision resources
azd provision

# Just deploy code
azd deploy
```

## Project Structure

```
/
├── src/                      # Frontend React code
├── api/                      # Backend Express API 
│   ├── src/                  # API source code
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Database services
│   │   └── models/           # Data models
├── infra/                    # Infrastructure as Code (Bicep)
│   └── modules/              # Modular Bicep components
└── .github/workflows/        # CI/CD pipeline
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

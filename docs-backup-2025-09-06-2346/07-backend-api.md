# Backend API Documentation

## Overview

The backend API is implemented as a Node.js Express server running as a containerized application on **Azure Container Apps**. This approach provides a platform-agnostic, consistent development and deployment experience with the scalability and managed services of Azure.

## Deployment Status: ✅ **FULLY OPERATIONAL**
- **Platform**: Azure Container Apps
- **Runtime**: Node.js 20 LTS in Alpine Linux container
- **Server**: Express.js with TypeScript
- **Database**: Azure SQL Database and Cosmos DB with managed identity
- **Authentication**: Container Apps managed identity for secure database access

## Architecture

```
api/
├── src/                   # TypeScript source code
│   ├── index.ts           # Express server entry point
│   ├── routes/            # API route definitions
│   │   ├── activityRoutes.ts  # Activity endpoints
│   │   └── userRoutes.ts      # User management endpoints
│   ├── services/          # Database services
│   │   ├── cosmosService.ts   # Cosmos DB integration
│   │   └── sqlService.ts      # Azure SQL integration
│   └── models/            # TypeScript interfaces
├── Dockerfile             # Multi-stage Docker build
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── schema.sql             # Database schema
```

## Current Status

**✅ DEPLOYMENT SUCCESS**: The API is running successfully as a containerized application on Azure Container Apps. The containerization approach resolved the TypeScript and platform compatibility issues that occurred with Windows App Service.

**Improvements**:
- Eliminated platform-specific dependencies and configuration
- Improved build process with multi-stage Docker builds
- Better security with managed identity for database access
- More consistent local development with Docker Compose

## Endpoints

### Health Check
- `GET /health` - API health status

### User Management
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Activity Logging
- `GET /api/activities` - List activities
- `POST /api/activities` - Create new activity
- `GET /api/activities/:id` - Get activity by ID

## Database Integration

### Azure SQL Database

The API connects to Azure SQL Database using managed identity authentication:

```typescript
// Example from sqlService.ts
import { DefaultAzureCredential } from "@azure/identity";
import { Connection, Request } from "tedious";

export async function getUserById(userId: string) {
  const connection = new Connection({
    server: process.env.SQL_SERVER_ENDPOINT || "",
    authentication: {
      type: "azure-active-directory-msi",
      options: {
        clientId: process.env.MANAGED_IDENTITY_CLIENT_ID
      }
    },
    options: {
      database: process.env.SQL_DATABASE_NAME,
      encrypt: true
    }
  });
  
  // Query implementation
}
```

### Cosmos DB

The API connects to Cosmos DB using managed identity authentication:

```typescript
// Example from cosmosService.ts
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT || "",
  aadCredentials: credential
});

export async function logActivity(activity) {
  const database = cosmosClient.database(process.env.COSMOS_DATABASE_NAME);
  const container = database.container("activities");
  
  return await container.items.create(activity);
}
```

## Authentication

The API authenticates with Azure resources using managed identity, which eliminates the need for storing connection strings or access keys. For client authentication, the API expects MSAL authentication tokens from the frontend. Authentication middleware validates tokens and extracts user context.

## Local Development

### Using Docker Compose

The recommended way to run the API locally is with Docker Compose, which ensures consistency between development and production environments:

```bash
# Start the API container
docker-compose up
```

This will:
1. Build the API container using the Dockerfile
2. Start the container with appropriate environment variables
3. Map port 3001 on your local machine to the container
4. Mount your local code directory for hot reloading

The API will be available at `http://localhost:3001`.

### Manual Setup (Alternative)

If you prefer to run the API directly on your local machine:

```bash
cd api
npm install
npm run dev
```

This requires you to have Node.js 18+ installed locally.

## Deployment

The API is deployed to Azure Container Apps via GitHub Actions:

1. Docker image is built and pushed to GitHub Container Registry
2. Azure Container App is updated with the new image
3. Managed identity is configured for secure database access

See the [CI/CD Setup Guide](../docs/ci-cd-setup.md) for detailed instructions.

### Container Configuration

The API container is configured with:
- Environment variables for database connections
- Managed identity for Azure resource access
- CORS configuration for frontend access
- Health probe for container orchestration

## Troubleshooting

**Common Issues**:
1. **Database Connection**: Verify managed identity has appropriate role assignments
2. **CORS Errors**: Check CORS configuration in Container App
3. **Container Startup**: Check logs for startup errors with `az containerapp logs show`

## Next Steps

1. **Implement Activity Endpoints**: Complete CRUD operations for activity logging
2. **Add Validation**: Implement request validation with middleware
3. **API Documentation**: Add OpenAPI/Swagger documentation
4. **Monitoring**: Enhance logging and monitoring
5. **Testing**: Add unit and integration tests

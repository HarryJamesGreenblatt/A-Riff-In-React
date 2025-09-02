# Backend API Documentation

## Overview

The backend API is implemented as a standard Express.js server running on Azure App Service. This approach provides a familiar development experience with the scalability and managed services of Azure.

## Architecture

```
api/
├── deployment/             # Clean deployment package
│   ├── server.js          # Express server entry point
│   ├── package.json       # Production dependencies (Express 4.x)
│   ├── routes/
│   │   └── userRoutes.js  # User management endpoints
│   └── services/
│       └── database.js    # Database configuration
├── schema.sql             # Database schema
└── local.settings.json    # Local development configuration
```

## Current Status

**⚠️ DEPLOYMENT ISSUE**: The API is currently experiencing startup failures due to TypeScript compiler errors in the deployment environment. The Express server code is functional, but Azure App Service is attempting to run TypeScript build scripts that are not needed.

**Next Steps**:
- Remove TypeScript dependencies from Azure environment
- Verify clean package.json deployment (Express 4.x only)
- Test minimal Express server startup

## Endpoints

### Health Check
- `GET /health` - API health status

### User Management (Planned)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Integration

The API connects to Azure SQL Database using the `mssql` package:

```javascript
// Example usage in database service
const pool = await sql.connect(dbConfig);
const result = await pool.request()
  .input('email', sql.VarChar, email)
  .query('SELECT * FROM Users WHERE email = @email');
```

## Authentication

The API is designed to work with MSAL authentication tokens from the frontend. Authentication middleware validates tokens and extracts user context.

## Local Development

```bash
cd api/deployment
npm install
npm start
```

The API runs on `http://localhost:8000` when developing locally.

## Deployment

The API is deployed to Azure App Service via:
1. **Manual deployment**: Kudu file manager (most reliable)
2. **GitHub Actions**: Automated deployment (when configured)
3. **Azure CLI**: Command-line deployment

### Deployment Package Structure

The deployment package (`api/deployment/`) contains only the essential files:
- `server.js` - Express server (JavaScript, no TypeScript)
- `package.json` - Production dependencies only
- `routes/` and `services/` - Application logic
- No TypeScript configuration or build tools

## Troubleshooting

**Common Issues**:
1. **TypeScript Errors**: Ensure no `tsc` or TypeScript build scripts in production package.json
2. **Port Configuration**: Use `process.env.PORT || 8000` for Azure compatibility
3. **CORS Issues**: Configure CORS for frontend domain

## Next Steps

1. **Resolve Deployment Issues**: Fix TypeScript compiler errors
2. **Implement User Endpoints**: Complete CRUD operations
3. **Add Authentication**: Implement MSAL token validation
4. **Error Handling**: Add comprehensive error responses
5. **Testing**: Add unit and integration tests
6. **Documentation**: Add OpenAPI/Swagger documentation

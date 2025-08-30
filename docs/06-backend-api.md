# Backend API Documentation

## Overview

The backend API is implemented using the "Express on Functions" pattern, providing a full Express.js server running on Azure Functions. This approach gives us the flexibility of Express with the scalability of serverless functions.

## Architecture

```
api/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Azure Functions entry point
│   ├── routes/
│   │   └── users.ts        # User management endpoints
│   ├── services/
│   │   └── userService.ts  # Business logic layer
│   └── config/
│       └── database.ts     # Database configuration
├── package.json            # Dependencies and scripts
└── host.json              # Azure Functions configuration
```

## Endpoints

### User Management
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Integration

The API connects to Azure SQL Database using the `mssql` package:

```typescript
// Example usage in userService.ts
const pool = await sql.connect(dbConfig);
const result = await pool.request()
  .input('email', sql.VarChar, email)
  .query('SELECT * FROM Users WHERE email = @email');
```

## Authentication

The API is designed to work with MSAL authentication tokens from the frontend. Authentication middleware validates tokens and extracts user context.

## Local Development

```bash
cd api
npm install
npm run dev
```

The API runs on `http://localhost:7071/api` when developing locally.

## Deployment

The API is automatically deployed to Azure Functions via GitHub Actions when changes are pushed to the main branch.

## Next Steps

1. **Frontend Integration**: Update React app to call these endpoints using RTK Query
2. **Error Handling**: Implement comprehensive error responses
3. **Validation**: Add request validation middleware
4. **Testing**: Add unit and integration tests
5. **Documentation**: Add OpenAPI/Swagger documentation

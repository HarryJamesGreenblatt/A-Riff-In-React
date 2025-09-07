# Local Development Guide

This guide provides step-by-step instructions for setting up and running the A Riff In React application locally using Docker Compose.

## Quick Start

### 1. Frontend Only (Connect to Live API)
```bash
# Install dependencies
npm install

# Start frontend (connects to live Azure API)
npm run start
# or
npm run dev

# Open: http://localhost:5173
```

### 2. Full Local Stack (API + Frontend)
```bash
# Start local API with Docker
docker-compose -f docker-compose.dev.yml up -d

# In another terminal, start frontend
npm run start

# Frontend: http://localhost:5173
# API: http://localhost:3001
```

### 3. API Only (for API development)
```bash
cd api
npm run dev
# API: http://localhost:8080
```

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+**: Required for frontend development
- **Docker Desktop**: Required for running the containerized API
- **Git**: For source control
- **Visual Studio Code**: Recommended editor with extensions for React and TypeScript

## Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HarryJamesGreenblatt/A-Riff-In-React.git
   cd A-Riff-In-React
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install API dependencies**:
   ```bash
   cd api
   npm install
   cd ..
   ```

## Configuration

### Frontend Configuration

Create a `.env.local` file in the project root with the following content:

```env
VITE_ENTRA_CLIENT_ID=your-client-id
VITE_ENTRA_TENANT_ID=your-tenant-id
VITE_REDIRECT_URI=http://localhost:5173
VITE_POST_LOGOUT_URI=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

### API Configuration

Create a `.env` file in the project root (for Docker Compose) with the following:

```env
# For local development with Docker Compose
SQL_SERVER_NAME=localhost
SQL_DATABASE_NAME=ARiffInReact
SQL_USER=sa
SQL_PASSWORD=YourSecurePassword123!
COSMOS_ENDPOINT=https://localhost:8081
COSMOS_KEY=your-local-cosmos-key
COSMOS_DATABASE=ARiffInReact
```

## Running the Application

### 1. Start the API with Docker Compose

```bash
docker-compose up
```

This will:
- Build the API container using the Dockerfile
- Start the containerized API on port 3001
- Set up a SQL Server container for local database access

### 2. Start the Frontend Development Server

In a separate terminal:

```bash
npm run start
```

This will start the Vite development server on port 5173.

### 3. Access the Application

- Frontend: http://localhost:5173
- API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## Database Setup

### Local SQL Server

The Docker Compose setup includes a SQL Server container. To initialize the database:

1. Connect to the SQL Server container using a SQL client:
   - Server: localhost,1433
   - Username: sa
   - Password: YourSecurePassword123! (or whatever you set in .env)

2. Execute the SQL script located at `api/schema.sql` to create the necessary tables.

### Local Cosmos DB Emulator (Optional)

For full functionality, you can install the Azure Cosmos DB Emulator:

1. Download and install the [Azure Cosmos DB Emulator](https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator)
2. Update your `.env` file with the emulator connection details

## Development Workflow

### Recommended Workflow

1. Make changes to the frontend or API code
2. For API changes, Docker Compose will automatically detect changes and restart the container
3. For frontend changes, Vite's hot module replacement will update the UI
4. Test changes in the browser or with API client
5. Commit changes with descriptive messages

### VS Code Extensions

Install these recommended extensions for a better development experience:

- ESLint
- Prettier
- Docker
- Azure Tools

## Debugging

### Frontend Debugging

Use the browser's developer tools for frontend debugging:

1. Open Chrome DevTools (F12)
2. Navigate to the Sources tab
3. Find your source files under the webpack:// directory

### API Debugging

For API debugging, you can:

1. Check Docker Compose logs:
   ```bash
   docker-compose logs -f api
   ```

2. Add console.log statements to the API code
3. Use a tool like Postman to test API endpoints directly

## Development Workflow

### The RIGHT Way:
```
1. Make changes locally
2. Test locally (npm run start + npm run test)
3. Commit only when working
4. Push to trigger deployment
```

### The WRONG Way (what we were doing):
```
1. Make changes
2. Commit and push
3. Wait for GitHub Actions
4. Test in production
5. Repeat 😢
```

### Recommended Workflow

1. Make changes to the frontend or API code
2. For API changes, Docker Compose will automatically detect changes and restart the container
3. For frontend changes, Vite's hot module replacement will update the UI
4. Test changes in the browser or with API client
5. Commit changes with descriptive messages

## Environment Switching

### Local Development
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001` or live Azure API
- Auth: Redirect to localhost

### Production
- Frontend: `https://gentle-stone-08653e81e.1.azurestaticapps.net`
- API: `https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io`
- Auth: Redirect to production URL

## Testing Strategy

### Local Testing
1. **Unit Tests**: `npm run test`
2. **Integration**: Test frontend + API locally
3. **E2E**: Test auth flow locally

### Pre-deployment Testing
1. **Build Test**: `npm run build` (frontend)
2. **Container Test**: `docker-compose up` (API)
3. **Lint**: `npm run lint`

### Post-deployment Testing
1. **Smoke Tests**: Health endpoints
2. **Integration**: Key user flows
3. **Performance**: Load testing

## Branch Strategy

### Current (can be improved later):
```
main -> production
fresh-start -> development/staging
feature-branches -> merge to fresh-start
```

### Professional (future):
```
main -> production
develop -> staging
feature/* -> develop
hotfix/* -> main
```

## Common Issues and Solutions

### CORS Issues

If you encounter CORS errors:

1. Verify the `VITE_API_URL` in your frontend `.env.local` file
2. Check that the API CORS configuration includes your frontend URL
3. Ensure you're using the correct protocol (http vs https)

### Authentication Issues

If Microsoft Entra authentication isn't working:

1. Verify your app registration in the Azure portal
2. Check that redirect URIs are correctly configured
3. Ensure your Entra tenant and client IDs are correct in the `.env.local` file

### Database Connection Issues

If the API can't connect to the database:

1. Check your Docker Compose logs for connection errors
2. Verify that the SQL Server container is running
3. Ensure your database credentials are correct in the `.env` file

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)

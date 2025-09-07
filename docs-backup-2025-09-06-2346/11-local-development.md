# Local Development Guide

This guide provides step-by-step instructions for setting up and running the A Riff In React application locally using Docker Compose.

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

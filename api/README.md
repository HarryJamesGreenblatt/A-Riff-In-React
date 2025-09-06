# A-Riff-In-React API

This is the backend API for the A-Riff-In-React application.

## Technology Stack

- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Programming language
- **Azure SQL Database**: Relational data storage
- **Azure Cosmos DB**: NoSQL data storage
- **Azure App Service**: Hosting platform

## API Endpoints

### Users API

- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a user by ID
- `POST /api/users`: Create a new user

### Activities API

- `GET /api/activities`: Get activities (filter by userId query param)
- `GET /api/activities/stream`: Get a stream of recent activities
- `POST /api/activities`: Create a new activity

### Health Check

- `GET /health`: Check API health status

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up your local environment variables in `.env` or `local.settings.json`

3. Build the TypeScript code:
   ```
   npm run build
   ```

4. Run the API locally:
   ```
   npm run start
   ```

5. For development with auto-reloading:
   ```
   npm run dev
   ```

## Database Setup

1. Run the `schema.sql` script against your SQL Server to create the required tables:
   ```
   sqlcmd -S localhost -U sa -P <password> -i schema.sql
   ```

2. For Cosmos DB, containers will be created automatically if they don't exist.

## Deployment

The API is automatically deployed to Azure App Service using GitHub Actions when changes are pushed to the main branch.

## Authentication

In production, the API uses Managed Identity to authenticate with Azure SQL Database and Cosmos DB.

## Configuration

Configuration is loaded from environment variables. See `.env.example` for required variables.

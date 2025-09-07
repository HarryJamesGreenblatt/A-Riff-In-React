# A-Riff-In-React API

This is the backend API for the A-Riff-In-React application, containerized for deployment to Azure Container Apps.

## Technology Stack

- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Programming language
- **Docker**: Containerization
- **Azure SQL Database**: Relational data storage
- **Azure Cosmos DB**: NoSQL data storage
- **Azure Container Apps**: Hosting platform

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

### Using Docker (Recommended)

1. Install Docker Desktop
2. Build and run the container:
   ```bash
   docker build -t a-riff-in-react-api .
   docker run -p 3001:3001 --env-file ../.env a-riff-in-react-api
   ```

3. Or use Docker Compose from the root directory:
   ```bash
   docker-compose up
   ```

### Traditional Method

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your local environment variables in `.env` or `local.settings.json`

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Run the API locally:
   ```bash
   npm run start
   ```

5. For development with auto-reloading:
   ```bash
   npm run dev
   ```

## Database Setup

1. Run the `schema.sql` script against your SQL Server to create the required tables:
   ```bash
   sqlcmd -S localhost -U sa -P <password> -i schema.sql
   ```

2. For Cosmos DB, containers will be created automatically if they don't exist.

## Deployment

The API is automatically deployed to Azure Container Apps using GitHub Actions when changes are pushed to the fresh-start branch.

See the GitHub workflow file in `.github/workflows/container-deploy.yml` for details.

## Authentication

In production, the API uses Managed Identity to authenticate with Azure SQL Database and Cosmos DB.

## Configuration

Configuration is loaded from environment variables. See `.env.example` for required variables.

For Container Apps, environment variables are set via the Bicep deployment template.

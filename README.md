# A Riff In React

A Riff In React is a deployable React + Express template that accelerates building user-facing web apps with authenticated users, persistent activity data, and real-time-style notifications. It's designed so teams can clone, configure three values, and deploy quickly to Azure.

## Core features

- **Authenticated login**
  - Email/password registration and login with JWT-based sessions and secure password hashing.
- **Protected user dashboard**
  - Route guards, a simple profile page, and per-user UI that requires authentication.
- **Activity tracking**
  - Flexible activity documents stored in Cosmos DB for event logs, counters, and activity feeds.
- **Notification system**
  - Create, list, mark-as-read, and delete notifications (Cosmos DB-backed) with frontend RTK Query support and optimistic updates.

## Why this template

This repository focuses on feature patterns you will use in many client apps: authentication, a user-specific dashboard, event/activity capture, and a notification mechanism. It packages those features with production-minded defaults (containerization, IaC, CI/CD) so you can adapt them rather than build from scratch.

## 🛠️ Technology Stack

### Frontend
- **React 18** + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui patterns
- **State**: Redux Toolkit + RTK Query
- **Auth**: JWT tokens with localStorage

### Backend
- **Runtime**: Node.js 18 + Express
- **Deployment**: Docker containers on Azure Container Apps
- **Authentication**: JWT with bcrypt password hashing
- **API Design**: RESTful with OpenAPI-ready structure

### Data Layer
- **Azure SQL Database**: Structured data (users, profiles, relational queries)
- **Azure Cosmos DB**: Flexible data (activity logs, real-time streams)
- **Access**: Managed Identity (credential-free, secure)

### Infrastructure
- **IaC**: Azure Bicep templates
- **Hosting**: Azure Static Web Apps (frontend) + Container Apps (API)
- **CI/CD**: GitHub Actions with container registry
- **Monitoring**: Application Insights (optional)

## 🌐 Live Demo
   
**Frontend**: https://a-riff-in-react.harryjamesgreenblatt.com  
**API**: https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/health

## 🏗️ Architecture

### Containerized, Single-Tenant Design

```
┌─────────────────────────────────────────────────────────┐
│                React Frontend (Static Web Apps)          │
│  - Vite bundled SPA                                      │
│  - JWT token in localStorage                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Express API (Container Apps)                    │
│  /api/auth/register   - Create user account             │
│  /api/auth/login      - Authenticate & return JWT       │
│  /api/users/*         - Profile management              │
│  /api/activities/*    - Activity logging                │
│  /api/notifications/* - Notification management         │
└────────┬────────────────────────┬───────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐      ┌─────────────────┐
│  Azure SQL DB    │      │   Cosmos DB     │
│  - Users         │      │   - Activities  │
│  - Profiles      │      │   - Logs        │
│  - Relationships │      │   - Events      │
└──────────────────┘      └─────────────────┘
```

### Authentication Flow (JWT-Based)

```
1. User Registration:
   POST /api/auth/register { email, password, name }
   → bcrypt hash password
   → Store in Azure SQL
   → Return success

2. User Login:
   POST /api/auth/login { email, password }
   → Verify password with bcrypt
   → Generate JWT token (7-day expiry)
   → Return { token, user }

3. Protected Requests:
   GET /api/users/profile
   Headers: { Authorization: "Bearer <JWT>" }
   → Middleware validates JWT
   → Extract userId from token
   → Process request
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18 LTS** or higher
- **Docker Desktop** (for local API development)
- **Azure CLI** (for deployment)
- **Git**

### Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/HarryJamesGreenblatt/A-Riff-In-React.git
cd A-Riff-In-React

# Install dependencies
npm install
cd api && npm install && cd ..

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development servers
npm run dev              # Frontend (http://localhost:5173)
docker-compose up        # API (http://localhost:3001)
```

### Client Deployment (Azure)

```bash
# Login to Azure
az login

# Configure deployment parameters
cp infra/parameters.example.json infra/parameters.json
# Edit parameters.json with your values

# Deploy infrastructure
az deployment sub create \
  --location westus \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json

# Deploy via CI/CD (recommended)
# Push to main branch - GitHub Actions handles deployment
```

**Deployment Time**: 10-15 minutes from clone to working app

## 📚 Documentation

Complete documentation in [docs/](./docs/):

### For Developers Getting Started
1. [Project Overview](./docs/01-project-overview.md) - Vision and architecture
2. [Architecture Deep Dive](./docs/02-architecture.md) - Technical decisions
3. [Development Setup](./docs/03-development-setup.md) - Local environment
4. [Local Development Workflow](./docs/04-local-development.md) - Day-to-day development

### For Feature Implementation
5. [UI Framework](./docs/05-ui-framework-setup.md) - Tailwind + components
6. [State Management](./docs/06-state-management.md) - Redux patterns
7. [Authentication](./docs/07-authentication.md) - JWT auth implementation
8. [Backend API](./docs/08-backend-api.md) - Express API structure

### For Deployment
9. [Provider Registration](./docs/09-provider-registration.md) - Azure prerequisites
10. [Azure Deployment](./docs/10-azure-deployment.md) - Infrastructure deployment
11. [CI/CD Pipeline](./docs/11-github-actions-ci-cd.md) - GitHub Actions setup
12. [Deployment Success](./docs/12-deployment-success.md) - Verification & troubleshooting

## 🔐 Security Considerations

This template implements security best practices:

- ✅ **Password Hashing**: bcrypt with 10 rounds
- ✅ **JWT Tokens**: Signed with HS256, 7-day expiry
- ✅ **HTTPS Only**: Enforced in production
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **CORS Configuration**: Whitelist-based origin control
- ✅ **Environment Secrets**: Never committed to git

**Note**: This provides a secure foundation. Clients may want to add:
- Email verification flows
- Password reset functionality
- Rate limiting on auth endpoints
- MFA (Multi-Factor Authentication)
- OAuth social providers

## 📦 What's Included Out-of-the-Box

### Authentication & User Management
- Email/password registration
- Login with JWT token generation
- User profile CRUD operations
- Protected route middleware

### Database Examples
- Azure SQL: User accounts, profiles
- Cosmos DB: Activity logs, event streams
- Managed Identity: Secure database access

### Deployment Infrastructure
- Bicep templates for all Azure resources
- GitHub Actions CI/CD workflows
- Docker containerization
- Environment configuration templates

### Developer Experience
- TypeScript throughout
- ESLint + Prettier configured
- Hot reload for frontend and API
- Docker Compose for local development

## 🎯 Extending This Template

This template is designed to be customized for your specific use case:

### Example: Run Club App
```typescript
// Add domain-specific models
interface RunActivity {
  id: string
  userId: string
  distance: number
  duration: number
  route: GeoJSON
  timestamp: Date
}

// Add domain-specific routes
router.post('/api/runs', authenticateToken, async (req, res) => {
  // Store run in Cosmos DB
})
```

### Example: E-Commerce App
```typescript
// Replace user profiles with customers
// Add product catalog in Azure SQL
// Add order history in Cosmos DB
```

### Example: SaaS Application
```typescript
// Add organization/tenant concept
// Add role-based access control
// Add subscription management
```

## 📝 Project Structure

```
/
├── src/                       # React frontend
│   ├── components/            # UI components
│   ├── features/              # Feature modules (users, activities)
│   ├── services/              # API clients
│   ├── store/                 # Redux store
│   └── App.tsx                # Main app component
│
├── api/                       # Express backend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── authRoutes.ts       # Registration, login
│   │   │   ├── userRoutes.ts       # User profiles
│   │   │   └── activityRoutes.ts   # Activity logs
│   │   ├── services/          # Database clients
│   │   │   ├── sqlService.ts       # Azure SQL operations
│   │   │   └── cosmosService.ts    # Cosmos DB operations
│   │   ├── middleware/        # Auth, logging, error handling
│   │   └── index.ts           # Express app setup
│   ├── Dockerfile             # Multi-stage container build
│   └── schema.sql             # Database schema
│
├── infra/                     # Infrastructure as Code
│   ├── main.bicep             # Root template
│   ├── modules/               # Bicep modules
│   │   ├── containerApp.bicep
│   │   ├── staticWebApp.bicep
│   │   ├── sqlDatabase.bicep
│   │   └── cosmosDb.bicep
│   └── parameters.json        # Deployment configuration
│
├── .github/workflows/         # CI/CD
│   ├── container-deploy.yml   # API deployment
│   └── static-web-deploy.yml  # Frontend deployment
│
├── docs/                      # Documentation
└── docker-compose.yml         # Local development
```

## 🤝 Contributing

This is a template project. Feel free to:
- Fork and customize for your use case
- Submit issues for bugs or unclear documentation
- Propose improvements via pull requests

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🔗 Related Templates

Part of the **Scaffolding** template series:
- [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask) - Python/Flask + Azure SQL
- **A Riff In React** (this template) - React/TypeScript + Azure SQL + Cosmos DB
- More templates coming soon...

---

**Built with the philosophy**: Make it easy to deploy, easy to understand, easy to customize.

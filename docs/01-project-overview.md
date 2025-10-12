# Project Overview: A Riff In React

This document outlines the vision, architecture, and core components of **A Riff In React**, a production-ready React application template demonstrating hybrid Azure SQL Database + Cosmos DB architecture with portable JWT authentication.

## 🎯 Vision

**A Riff In React** is a **deployment template** designed for clients to clone and deploy to their own Azure subscriptions with minimal configuration. It showcases best practices for:

1. **Portable Architecture**: Single-tenant design that deploys in minutes
2. **Hybrid Database Strategy**: Demonstrating when to use Azure SQL vs. Cosmos DB
3. **Containerized Deployment**: Docker + Azure Container Apps for consistency
4. **Self-Contained Authentication**: JWT-based auth with no external dependencies
5. **Infrastructure as Code**: Complete Bicep templates for reproducible deployments

The template is designed to be reusable across a variety of business scenarios, providing a solid foundation for scalable, maintainable web applications that leverage Azure cloud services **without complex setup requirements**.

## 🏗️ Architecture

### The "Scaffolding" Project Philosophy

As part of a larger collection of template projects under the "Scaffolding" umbrella, this project follows a **client-deployable** infrastructure strategy. Key principles:

- **Single Tenant Design**: Everything in one Azure tenant, one resource group
- **Shared Infrastructure Pattern**: Cost-effective resource sharing (e.g., SQL server)
- **Zero Manual Configuration**: No Portal clicking required
- **Client Ownership**: Full control over code, data, and infrastructure

### Core Architecture Principles

The architecture of A Riff In React follows these key principles:

1. **Feature-based Organization**: Components, state, and services grouped by feature or domain
2. **Separation of Concerns**: Clear boundaries between UI components, state management, and services
3. **Azure-Native Configuration**: Uses Azure services properly (Managed Identity, Container Apps, etc.)
4. **Hybrid Database Strategy**: Clear patterns for using both relational and document databases
5. **Template-First Design**: Optimized for client deployment, not enterprise complexity

### Project Structure

```
a-riff-in-react/
├── src/                    # Frontend (React)
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   ├── layout/         # Layout components (header, footer, etc.)
│   │   └── auth/           # Auth components (LoginForm, RegisterForm)
│   ├── features/           # Feature modules
│   │   ├── users/          # User management (Azure SQL)
│   │   │   ├── components/ # Feature-specific components
│   │   │   ├── hooks/      # Feature-specific hooks
│   │   │   ├── services/   # API services
│   │   │   └── slice.ts    # Redux slice
│   │   └── activities/     # Activity logging (Cosmos DB)
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── slice.ts
│   ├── services/           # Core services
│   │   ├── api/            # API client setup
│   │   └── auth/           # Authentication service (JWT)
│   ├── store/              # Redux store configuration
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
│
├── api/                    # Backend (Express in Container)
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   │   ├── authRoutes.ts    # Registration, login, token refresh
│   │   │   ├── userRoutes.ts    # User profile management
│   │   │   └── activityRoutes.ts # Activity logging
│   │   ├── services/       # Database service implementations
│   │   │   ├── sqlService.ts    # Azure SQL Database client
│   │   │   └── cosmosService.ts # Cosmos DB client
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.ts          # JWT validation
│   │   │   ├── errors.ts        # Error handling
│   │   │   └── logging.ts       # Request logging
│   │   ├── models/         # TypeScript interfaces
│   │   └── index.ts        # Express server entry point
│   ├── Dockerfile          # Multi-stage Docker build for API
│   └── schema.sql          # Database schema
│
├── infra/                  # Azure deployment configuration (Bicep)
│   ├── main.bicep          # Main deployment template
│   ├── modules/            # Bicep modules
│   │   ├── containerApp.bicep       # Container Apps configuration
│   │   ├── staticWebApp.bicep       # Static Web Apps configuration
│   │   ├── sqlDatabase.bicep        # Azure SQL deployment
│   │   ├── cosmosDb.bicep           # Cosmos DB deployment
│   │   └── managedIdentity.bicep    # Identity for secure access
│   └── parameters.json     # Deployment parameters template
│
├── .github/workflows/      # GitHub Actions CI/CD pipelines
│   ├── container-deploy.yml     # API container deployment workflow
│   └── static-web-deploy.yml    # Frontend deployment workflow
│
├── docker-compose.yml      # Local development configuration
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🔄 Hybrid Database Approach

A key feature of this template is demonstrating a hybrid database approach using both Azure SQL Database and Cosmos DB.

### When to Use Azure SQL Database

Azure SQL Database is ideal for:
- ✅ Structured, relational data with fixed schema
- ✅ ACID-compliant transactions
- ✅ Complex queries with JOINs and aggregations
- ✅ Data with well-defined relationships
- ✅ Strong consistency requirements

**Example in template**: User profiles, authentication credentials, relationships

```sql
-- User accounts with strong schema
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255),
    createdAt DATETIME2 DEFAULT GETUTCDATE()
)
```

### When to Use Cosmos DB

Cosmos DB is ideal for:
- ✅ Semi-structured or unstructured data
- ✅ Rapidly changing schemas
- ✅ High-throughput scenarios and real-time data
- ✅ Document, graph, or key-value data models
- ✅ Global distribution requirements

**Example in template**: Activity logs, user preferences, event streams

```typescript
// Flexible activity schema
interface Activity {
  id: string
  userId: string
  type: 'run' | 'event' | 'achievement'
  data: Record<string, any>  // Flexible schema
  timestamp: string
  metadata?: {
    location?: GeoPoint
    weather?: string
    [key: string]: any
  }
}
```

## 🔐 Authentication Architecture: JWT-Based

Unlike enterprise applications that use Azure AD or Entra External ID, this template uses a **homebrew JWT authentication** pattern optimized for **template deployability**.

### Why JWT Instead of Entra External ID?

**Template Requirements:**
- ✅ Deploy to client's Azure in 15 minutes
- ✅ Zero manual Azure Portal configuration
- ✅ Single tenant (no separate B2C tenant)
- ✅ Client owns all code and data
- ✅ Works in any Azure subscription

**Entra External ID Requirements:**
- ❌ Separate tenant creation (30+ minutes)
- ❌ Manual Portal configuration (user flows, providers)
- ❌ Two tenants to manage (main + B2C)
- ❌ Complex troubleshooting
- ❌ High setup friction for clients

### JWT Authentication Flow

```
Registration:
  POST /api/auth/register { email, password, name }
  → Validate input
  → Hash password with bcrypt
  → Store in Azure SQL
  → Return success

Login:
  POST /api/auth/login { email, password }
  → Find user by email
  → Verify password with bcrypt
  → Generate JWT token (7-day expiry)
  → Return { token, user: { id, email, name } }

Protected Requests:
  GET /api/users/profile
  Headers: { Authorization: "Bearer <JWT>" }
  → Middleware validates JWT signature
  → Extract userId from token payload
  → Process request with authenticated context
```

### JWT Token Structure

```typescript
// Token payload
{
  userId: "uuid",
  email: "user@example.com",
  iat: 1634567890,  // Issued at
  exp: 1635172690   // Expires in 7 days
}

// Signed with HS256 algorithm
// Secret stored in environment variable
```

### Security Considerations

This template implements:
- ✅ **bcrypt password hashing** (10 rounds)
- ✅ **Signed JWT tokens** (HS256 with secret)
- ✅ **Token expiration** (7-day default)
- ✅ **HTTPS enforcement** in production
- ✅ **Parameterized SQL queries** (injection prevention)
- ✅ **CORS whitelist** configuration

**For production use, clients should consider adding:**
- Email verification flows
- Password reset functionality
- Rate limiting on auth endpoints
- Refresh token rotation
- Multi-factor authentication (MFA)
- OAuth social providers (if needed)

## 🔌 Azure Services Integration

The template is configured for seamless integration with the following Azure services:

- **Azure Container Apps**: For hosting the containerized Node.js API
- **Azure Static Web Apps**: For hosting the React application with global CDN
- **Azure SQL Database**: For structured, relational data
- **Azure Cosmos DB**: For document-based and real-time data
- **User-Assigned Managed Identity**: For secure database access without credentials
- **Azure Container Registry**: For Docker image storage
- **Application Insights** (optional): For monitoring and diagnostics

### Managed Identity Pattern

Instead of storing database connection strings, this template uses **Managed Identity**:

```typescript
// Azure SQL connection with Managed Identity
const connection = new Connection({
  server: process.env.SQL_SERVER_ENDPOINT,
  authentication: {
    type: 'azure-active-directory-msi-app-service',
    options: {
      clientId: process.env.MANAGED_IDENTITY_CLIENT_ID
    }
  },
  options: {
    database: process.env.SQL_DATABASE_NAME,
    encrypt: true
  }
})
```

**Benefits:**
- No credentials in code or environment variables
- Automatic credential rotation
- Azure-managed security
- Audit trail of database access

## 🚀 Getting Started

To learn how to set up and use this template:
1. See the [Development Setup](./03-development-setup.md) guide for local environment configuration
2. Explore the [Authentication](./07-authentication.md) guide for JWT implementation details
3. Refer to [Azure Deployment](./10-azure-deployment.md) for deployment instructions

## 🔄 From Flask to React: Architectural Parallels

This template mirrors key architectural concepts from [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask):

| A Fugue In Flask | A Riff In React | Purpose |
|------------------|-----------------|---------|
| Flask Blueprint | Feature Module | Encapsulate domain-specific functionality |
| Application Factory | Store/Provider Configuration | Centralized application setup |
| Flask-SQLAlchemy | Redux + Azure SQL Service | Structured data management |
| Flask-Login | JWT Middleware | Authentication state management |
| Jinja Templates | React Components | UI rendering |
| Flask Extensions | React Hooks/Context | Shared functionality across app |

## 🧩 Extension Examples

The template includes examples of how to extend it for specific business scenarios:

### Example Use Case: Run Club Membership App

**User Management** (Azure SQL):
- Member registration and profiles
- Membership tiers and roles
- Contact information and preferences

**Activity Logging** (Cosmos DB):
- Run tracking (distance, pace, route)
- Event participation
- Achievements and milestones
- Real-time activity feeds

**Implementation Pattern:**
```typescript
// Feature module structure
src/features/runs/
  ├── components/
  │   ├── RunList.tsx
  │   ├── RunDetails.tsx
  │   └── LogRunForm.tsx
  ├── hooks/
  │   └── useRuns.ts
  ├── services/
  │   └── runsApi.ts
  └── slice.ts  // Redux state management
```

These examples can be used as reference implementations when adapting the template to specific business requirements.

## 📦 What Clients Get

When a client deploys this template, they get:

**✅ Working Application** (15-minute deployment)
- User registration and login
- Profile management
- Activity logging examples
- Responsive UI

**✅ Complete Infrastructure** (defined in Bicep)
- Container Apps for API
- Static Web Apps for frontend
- Azure SQL Database
- Cosmos DB
- Managed Identity
- Container Registry

**✅ CI/CD Pipeline** (GitHub Actions)
- Automated API deployments
- Automated frontend deployments
- Docker image building and pushing
- Health check verification

**✅ Development Environment** (Docker Compose)
- Local API development
- Hot reload for frontend and backend
- Consistent with production

**✅ Documentation** (this folder)
- Architecture guide
- Deployment instructions
- Extension examples
- Troubleshooting tips

## 🎯 Design Goals Achieved

1. **Portability**: ✅ Deploys to any Azure subscription
2. **Simplicity**: ✅ Zero manual configuration
3. **Security**: ✅ Industry-standard auth patterns
4. **Scalability**: ✅ Container Apps auto-scale
5. **Maintainability**: ✅ Clear code organization
6. **Extensibility**: ✅ Easy to customize for specific use cases

---

> _This template's modular structure and deployment patterns are inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._
# Project Overview: A Riff In React

This document outlines the vision, architecture, and core components of **A Riff In React**, a production-ready React application template demonstrating hybrid Azure SQL Database + Cosmos DB architecture.

## 🎯 Vision

**A Riff In React** is a general-purpose React template that showcases best practices for:

1. **Modular Architecture**: Organized, maintainable component structure inspired by the Application Factory Pattern
2. **Azure Integration**: Production-ready configuration for Azure services
3. **Hybrid Database Approach**: Demonstrating when and how to use Azure SQL Database vs. Cosmos DB
4. **Documentation**: Comprehensive guides and examples for extension

The template is designed to be reusable across a variety of business scenarios, providing a solid foundation for scalable, maintainable web applications that leverage Azure cloud services.

## 🏗️ Architecture

### The "Scaffolding" Project Philosophy

As part of a larger collection of template projects under the "Scaffolding" umbrella, this project follows a cost-effective infrastructure strategy. Instead of provisioning a dedicated Azure SQL Server for each template, we utilize a single, shared server (`sequitur-sql-server`) and create a dedicated database for each project. This approach reduces cost and management overhead while still demonstrating a full-stack, database-driven architecture.

### Core Architecture Principles

The architecture of A Riff In React follows these key principles:

1. **Feature-based Organization**: Components, state, and services grouped by feature or domain
2. **Separation of Concerns**: Clear boundaries between UI components, state management, and services
3. **Azure-Ready Configuration**: Integration points for Azure services pre-configured
4. **Hybrid Database Strategy**: Clear patterns for using both relational and document databases
5. **Containerization**: Platform-agnostic deployment using Docker containers

### Project Structure

```
a-riff-in-react/
├── api/                    # Backend API (Express with TypeScript in Docker container)
│   ├── src/                # API source code
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # Express route definitions
│   │   └── services/       # Database connection services
│   ├── Dockerfile          # Multi-stage build for containerization
│   └── schema.sql          # Database schema
├── src/                    # Frontend (React)
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   └── layout/         # Layout components (header, footer, etc.)
│   ├── features/           # Feature modules
│   │   ├── users/          # User management (Azure SQL)
│   │   │   ├── components/ # Feature-specific components
│   │   │   ├── hooks/      # Feature-specific hooks
│   │   │   ├── services/   # API services
│   │   │   └── slice.ts    # Redux slice
│   │   └── activity/       # Activity logging (Cosmos DB)
│   │       ├── components/ # Feature-specific components
│   │       ├── hooks/      # Feature-specific hooks
│   │       ├── services/   # API services
│   │       └── slice.ts    # Redux slice
│   ├── services/           # Core services
│   │   ├── api/            # API client setup
│   │   │   ├── sql.ts      # Azure SQL Database client
│   │   │   └── cosmos.ts   # Cosmos DB client
│   │   └── auth/           # Authentication services (MSAL)
│   ├── store/              # Redux store configuration
│   │   ├── index.ts        # Store setup
│   │   └── api.ts          # RTK Query API
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── infra/                  # Infrastructure as Code (Bicep)
│   ├── main.bicep          # Main deployment template
│   └── modules/            # Modular Bicep components
├── .github/workflows/      # CI/CD pipeline configuration
│   ├── container-deploy.yml # API deployment workflow
│   └── static-web-deploy.yml # Frontend deployment workflow
├── docs/                   # Documentation
└── docker-compose.yml      # Local development setup
```

## 🔄 Hybrid Database Approach

A key feature of this template is demonstrating a hybrid database approach using both Azure SQL Database and Cosmos DB.

### When to Use Azure SQL Database

Azure SQL Database is ideal for:
- Structured, relational data with fixed schema
- ACID-compliant transactions
- Complex queries and reporting
- Data with well-defined relationships

**Example in template**: User profiles, authentication, and structured business data

### When to Use Cosmos DB

Cosmos DB is ideal for:
- Semi-structured or unstructured data
- Rapidly changing schemas
- Global distribution requirements
- High-throughput scenarios and real-time data
- Document, graph, or key-value data models

**Example in template**: Activity logs, user preferences, real-time dashboards

## 🔌 Azure Services Integration

The template is configured for seamless integration with the following Azure services:

- **Azure Static Web Apps**: For hosting the React application
- **Azure Container Apps**: For hosting the containerized API
- **Azure SQL Database**: For structured, relational data
- **Azure Cosmos DB**: For document-based and real-time data
- **Azure Key Vault**: For secure storage of secrets and configuration
- **Azure Application Insights**: For monitoring and analytics
- **Microsoft Authentication Library (MSAL)**: For Azure AD authentication

## 🚀 Getting Started

To learn how to set up and use this template:
1. See the [Local Development Guide](../local-development.md) for local environment configuration
2. Explore the [UI Framework Setup](./03-ui-framework-setup.md) for UI component usage
3. Refer to [Production Deployment Guide](../production-deployment.md) for deployment instructions

## 🔄 From Flask to React: Architectural Parallels

This template mirrors key architectural concepts from [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask):

| A Fugue In Flask | A Riff In React | Purpose |
|------------------|-----------------|---------|
| Flask Blueprint | Feature Module | Encapsulate domain-specific functionality |
| Application Factory | Store/Provider Configuration | Centralized application setup |
| Flask-SQLAlchemy | Redux + Azure SQL Service | Structured data management |
| Flask Extensions | React Hooks/Context | Shared functionality across app |
| Jinja Templates | React Components | UI rendering |

## 🧩 Extension Examples

The template includes examples of how to extend it for specific business scenarios:
- User management system (using Azure SQL)
- Activity logging system (using Cosmos DB)
- Real-time dashboard (using Cosmos DB change feed)

These examples can be used as reference implementations when adapting the template to specific business requirements.

---

> _This template's modular structure and deployment patterns are inspired by the Application Factory Pattern and Blueprint Modularity described in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)._
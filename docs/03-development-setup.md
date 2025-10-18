# Development Setup

## 🎯 Phase 1: Basic React App Structure

### Technology Decisions

**React Setup Method**: Vite
- **Rationale**: Faster development server, modern build tooling, better TypeScript support
- **Alternative Considered**: Create React App (slower, less flexible)

**TypeScript Configuration**: Strict mode enabled
- **Benefits**: Better error catching, improved developer experience
- **Configuration**: Strict type checking, path mapping, modern ES features

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (LoadingSpinner, ErrorBoundary)
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   └── ui/             # Design system components (shadcn/ui)
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── store/              # Redux state management
├── types/              # TypeScript type definitions
├── lib/                # Utility functions and helpers
├── config/             # Configuration files
└── assets/             # Static assets (images, fonts, etc.)
```

### Development Tools

- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control with conventional commits

### Setup Steps

1. ✅ **Initialize Vite React TypeScript project**
   - Created with `npm create vite@latest . -- --template react-ts`
   - Package name: `a-riff-in-react`
   - Dependencies installed successfully
   - Development server tested and working

2. ✅ **Basic Dependencies Installed**
   - React 18.x with JWT authentication support
   - TypeScript 5.8.3 with strict configuration
   - ESLint with React and TypeScript rules
   - Vite 6.3.5 for fast development and building

3. ✅ **Project Structure Verified**
   - Standard Vite React TypeScript template structure
   - Development server working at `http://localhost:5173/`
   - Hot Module Replacement (HMR) functional
   - TypeScript compilation successful

### Generated Structure Analysis

**Key Files Created**:
- `package.json`: Project dependencies and scripts
- `vite.config.ts`: Vite configuration with React plugin
- `tsconfig.json`: TypeScript project references
- `tsconfig.app.json`: Main TypeScript configuration (ES2020, strict mode)
- `eslint.config.js`: ESLint configuration for React/TypeScript
- `src/App.tsx`: Main React component
- `src/main.tsx`: Application entry point
- `index.html`: HTML template

**Dependencies Overview**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.4.1",
    "typescript": "~5.8.3",
    "vite": "^6.3.5",
    "eslint": "^9.25.0"
  }
}
```

### Authentication Status

The project uses JWT-based authentication with email/password credentials. This approach was chosen for its:
- **Template portability**: Works in any Azure subscription without external dependencies
- **Zero configuration**: No separate tenant or Portal setup required
- **Client ownership**: All authentication logic is in the codebase

Primary auth documentation: `docs/07-authentication.md`

### Step 1 Completed: Basic Vite Setup ✅

**What was accomplished:**
- ✅ Vite React TypeScript template initialized
- ✅ Dependencies installed successfully (189 packages)
- ✅ Development server running on `http://localhost:5173/`
- ✅ Hot Module Replacement (HMR) working
- ✅ Basic React 18.x app with TypeScript 5.8.3

**Generated files:**
- `package.json` - Project configuration and dependencies
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint setup
- `src/App.tsx` - Main application component
- `src/main.tsx` - React entry point

**Next immediate step:** Configure project structure and basic routing

---

## 🎯 Phase 2: Core Features

### UI Framework Integration ✅

**Technology Stack**:
- Tailwind CSS for utility-first styling
- shadcn/ui-style component architecture
- Custom Button component implementation

**Details**: See [UI Framework Setup](./05-ui-framework-setup.md)

### State Management Setup ✅

**Technology Stack**:
- Redux Toolkit for state management
- RTK Query for API integration
- TypeScript for type safety

**Key Features Implemented**:
- Centralized Redux store configuration
- RTK Query API setup with authentication
- Feature slices for users (Azure SQL) and activities (Cosmos DB)
- Typed hooks for Redux usage
- Example components demonstrating integration

**Details**: See [State Management](./06-state-management.md)

### Backend API Setup (Node.js / Docker / Container Apps)

The backend is a Node.js application using Express, designed to run as a containerized application on Azure Container Apps.

**Prerequisites**:
- Docker Desktop
- Node.js (LTS version recommended)

**Setup Steps**:

1. **Clone the repository and navigate to the project**:
   ```bash
   git clone https://github.com/HarryJamesGreenblatt/A-Riff-In-React.git
   cd A-Riff-In-React
   ```

2. **Configure local settings**:
   - Create a `.env` file in the root directory
   - Fill in the required values:
     ```env
     JWT_SECRET=your-secret-key-min-32-chars
     JWT_EXPIRY=7d
     SQL_SERVER=localhost
     SQL_DATABASE=ARiffInReact
     SQL_USER=sa
     SQL_PASSWORD=YourPassword123!
     COSMOS_ENDPOINT=https://localhost:8081
     COSMOS_KEY=your-cosmos-key
     COSMOS_DATABASE=ARiffInReact
     ```

3. **Start the backend with Docker Compose**:
   ```bash
   docker-compose up
   ```
   - The API will be available at `http://localhost:3001`.

4. **Run the database schema**:
   - Connect to your Azure SQL database or local SQL Server
   - Execute the script in `api/schema.sql` to create the `Users` table and related schema.

### Current Status

**✅ COMPLETED**:
- Basic React app foundation
- UI framework with Tailwind CSS and shadcn/ui patterns
- Redux Toolkit state management with RTK Query
- JWT-based authentication system
- Backend API for user persistence
- Docker containerization for consistent development and deployment

**🎯 NEXT**: End-to-end testing and Cosmos DB integration.

### Success Criteria

- [x] React development server runs successfully
- [x] Backend API server runs successfully with Docker
- [x] TypeScript compilation works without errors
- [x] UI framework integrated and functional
- [x] Redux state management configured
- [x] JWT authentication system implemented
- [ ] Database connections established and tested end-to-end

---

**Next Phase**: Authentication with MSAL

# A Riff In React

A modern, production-ready React application template demonstrating hybrid Azure SQL Database + Cosmos DB architecture.

## 🎯 Project Vision

**A Riff In React** showcases modern web development best practices while demonstrating a polyglot persistence approach using both Azure SQL Database and Cosmos DB for a running club management application.

## 📈 Development Progress

### ✅ Phase 1: Foundation (COMPLETED)
- ✅ **Documentation Framework**: Comprehensive docs structure established
- ✅ **Project Vision**: Running club domain and architecture defined  
- ✅ **Basic React App Structure**: Vite + TypeScript + React 19 setup complete

### 🚧 Phase 2: Core Features (IN PROGRESS)
- [ ] UI framework integration (Tailwind CSS + shadcn/ui)
- [ ] State management setup (Redux Toolkit)
- [ ] Authentication system (MSAL)
- [ ] Database integration (Azure SQL + Cosmos DB)

### 📋 Phase 3: Business Logic (PLANNED)
- [ ] Running club features
- [ ] Member management
- [ ] Event management  
- [ ] Activity tracking

### 🚀 Phase 4: Advanced Features (PLANNED)
- [ ] Real-time updates
- [ ] Analytics dashboard
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui *(planned)*
- **State Management**: Redux Toolkit + RTK Query *(planned)*
- **Authentication**: Microsoft Authentication Library (MSAL) *(planned)*
- **Databases**: Azure SQL Database + Cosmos DB *(planned)*
- **Hosting**: Azure Static Web Apps or Container Apps *(planned)*

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

- [Project Overview](./docs/01-project-overview.md) - Vision and architecture
- [Development Setup](./docs/02-development-setup.md) - Getting started guide
- [Full Documentation](./docs/README.md) - Complete documentation index

---

**Development Methodology**: Feature-by-feature, commit-by-commit collaborative approach
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

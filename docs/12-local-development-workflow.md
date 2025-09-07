# Local Development Guide

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

## Environment Switching

### Local Development
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001` or live Azure API
- Auth: Redirect to localhost

### Production
- Frontend: `https://a-riff-in-react.{random}.azurestaticapps.net`
- API: `https://api-a-riff-in-react.westus.azurecontainerapps.io`
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

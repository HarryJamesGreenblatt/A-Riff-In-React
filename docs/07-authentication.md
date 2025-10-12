# Authentication with JWT (JSON Web Tokens)

This document describes the JWT-based authentication implementation in **A Riff In React**.

## ?? Overview

This template uses **homebrew JWT authentication** - a self-contained, portable authentication system that requires zero external configuration. Unlike enterprise identity platforms (Azure AD, Entra External ID), this approach prioritizes:

- ? **Template Deployability**: Works immediately after deployment
- ? **Client Ownership**: All auth logic in client's codebase
- ? **Zero Dependencies**: No external auth providers
- ? **Single Tenant**: Everything in one Azure subscription

## ??? Architecture

### Authentication Flow

```
???????????????
?   Frontend  ?
?  (React)    ?
???????????????
       ?
       ? 1. POST /api/auth/register
       ?    { email, password, name }
       ?
???????????????????????????????????
?   Express API                    ?
?                                  ?
?   ???????????????????????????  ?
?   ?  authRoutes.ts          ?  ?
?   ?  - Hash password        ?  ?
?   ?  - Store in database    ?  ?
?   ???????????????????????????  ?
???????????????????????????????????
         ?
         ?
????????????????????
?  Azure SQL DB    ?
?  Users table     ?
????????????????????

       ?
       ? 2. POST /api/auth/login
       ?    { email, password }
       ?
???????????????????????????????????
?   Express API                    ?
?                                  ?
?   ???????????????????????????  ?
?   ?  authRoutes.ts          ?  ?
?   ?  - Verify password      ?  ?
?   ?  - Generate JWT         ?  ?
?   ?  - Return token         ?  ?
?   ???????????????????????????  ?
???????????????????????????????????
         ?
         ? 3. JWT Token returned
         ?    { token, user: {...} }
         ?
???????????????
?   Frontend  ?
?  Store JWT  ?
?  in memory  ?
???????????????
       ?
       ? 4. GET /api/users/profile
       ?    Headers: { Authorization: "Bearer <JWT>" }
       ?
???????????????????????????????????
?   Express API                    ?
?                                  ?
?   ???????????????????????????  ?
?   ?  auth middleware        ?  ?
?   ?  - Verify JWT signature ?  ?
?   ?  - Extract userId       ?  ?
?   ?  - Attach to request    ?  ?
?   ???????????????????????????  ?
?                                  ?
?   ???????????????????????????  ?
?   ?  userRoutes.ts          ?  ?
?   ?  - Process request      ?  ?
?   ?  - Return user data     ?  ?
?   ???????????????????????????  ?
????????????????????????????????????
```

## ?? Security Implementation

### Password Hashing (bcrypt)

Passwords are **never stored in plain text**. We use bcrypt with 10 salt rounds:

```typescript
// api/src/routes/authRoutes.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// During registration
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

// During login
const isValid = await bcrypt.compare(password, user.passwordHash)
```

**Why bcrypt?**
- Industry standard for password hashing
- Intentionally slow (prevents brute-force attacks)
- Built-in salting (prevents rainbow table attacks)
- Adaptive (can increase rounds as computers get faster)

### JWT Token Generation

JWT tokens are signed with a secret key and have a 7-day expiration:

```typescript
// api/src/routes/authRoutes.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRY = '7d'

const token = jwt.sign(
  {
    userId: user.id,
    email: user.email
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRY }
)
```

**Token Payload:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "runner@example.com",
  "iat": 1634567890,
  "exp": 1635172690
}
```

### JWT Token Validation

Protected routes use middleware to validate tokens:

```typescript
// api/src/middleware/auth.ts
import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1] // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded  // Attach user info to request
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}
```

## ?? API Endpoints

### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "email": "runner@example.com",
  "password": "SecurePass123!",
  "name": "Jane Runner"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "runner@example.com",
    "name": "Jane Runner",
    "createdAt": "2025-10-12T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid input (missing fields, invalid email format)
- `409` - Email already registered

---

### POST /api/auth/login

Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "runner@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "runner@example.com",
    "name": "Jane Runner"
  }
}
```

**Errors:**
- `400` - Invalid input
- `401` - Invalid credentials

---

### GET /api/auth/me

Get current authenticated user (requires token).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "runner@example.com",
    "name": "Jane Runner",
    "createdAt": "2025-10-12T00:00:00Z"
  }
}
```

**Errors:**
- `401` - No token provided
- `403` - Invalid or expired token

---

### POST /api/auth/logout

Logout (client-side only - removes token from storage).

**Note:** JWT tokens are stateless, so "logout" is handled by the client removing the token. The server doesn't maintain session state.

## ?? Frontend Integration

### Authentication Service

```typescript
// src/services/auth/authService.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const authService = {
  async register(email: string, password: string, name: string) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      email,
      password,
      name
    })
    return response.data
  },

  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    })
    
    if (response.data.token) {
      // Store token in localStorage
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data
  },

  async logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}
```

### Axios Interceptor (Auto-attach Token)

```typescript
// src/services/api/apiClient.ts
import axios from 'axios'
import { authService } from '../auth/authService'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

// Automatically attach JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Login Component

```typescript
// src/components/auth/LoginForm.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth/authService'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { authService } from '../../services/auth/authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

### Usage in Routes

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { Dashboard } from './pages/Dashboard'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
```

## ??? Database Schema

### Users Table (Azure SQL)

```sql
-- api/schema.sql
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'member',
    emailVerified BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
)

CREATE INDEX IX_Users_Email ON Users(email)
```

## ?? Security Best Practices

### What This Template Provides

? **Password Hashing**: bcrypt with 10 rounds  
? **Token Signing**: JWT with secret key  
? **Token Expiration**: 7-day default  
? **HTTPS Enforcement**: Production-only  
? **SQL Injection Prevention**: Parameterized queries  
? **CORS Configuration**: Whitelist origins  

### What Clients Should Add for Production

?? **Email Verification**: Confirm user email addresses  
?? **Password Reset**: Secure password recovery flow  
?? **Rate Limiting**: Prevent brute-force attacks  
?? **Refresh Tokens**: Implement token rotation  
?? **MFA (Optional)**: Multi-factor authentication  
?? **OAuth (Optional)**: Social login providers  

## ?? Testing Authentication

### Manual Testing with cURL

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Use token to access protected route
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Integration Tests

```typescript
// api/tests/auth.test.ts
import request from 'supertest'
import app from '../src/index'

describe('Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      })
    
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('newuser@example.com')
  })

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!'
      })
    
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'WrongPassword'
      })
    
    expect(res.status).toBe(401)
  })
})
```

## ?? Deployment Configuration

### Environment Variables

```env
# Backend (.env)
JWT_SECRET=<random-256-bit-string>
JWT_EXPIRY=7d

SQL_SERVER_ENDPOINT=your-server.database.windows.net
SQL_DATABASE_NAME=your-database
MANAGED_IDENTITY_CLIENT_ID=<identity-client-id>

CORS_ORIGINS=https://your-frontend.com,http://localhost:5173
```

### Frontend Environment

```env
# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:3001
VITE_API_BASE_URL=https://your-api.azurecontainerapps.io  # Production
```

## ?? Additional Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

> _This authentication approach prioritizes template deployability over enterprise features. For applications requiring Azure AD integration, social OAuth, or advanced identity features, consider implementing these as extensions to this base system._

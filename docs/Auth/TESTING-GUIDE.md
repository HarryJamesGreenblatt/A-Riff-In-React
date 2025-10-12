# Testing JWT Authentication

## Quick cURL Tests

### 1. Register a New User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member",
    "createdAt": "2024-12-..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member"
  }
}
```

**Save the token** from the response for the next request.

### 3. Get Current User (Protected Route)

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200)**:
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member",
    "createdAt": "2024-12-..."
  }
}
```

### 4. Test Invalid Token

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response (403)**:
```json
{
  "error": "Invalid or expired token"
}
```

### 5. Test No Token

```bash
curl -X GET http://localhost:8080/api/auth/me
```

**Expected Response (401)**:
```json
{
  "error": "No token provided"
}
```

## Frontend Testing with Browser Console

Open the browser console and run:

### Register
```javascript
const response = await fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'frontend@example.com',
    password: 'TestPass123!',
    name: 'Frontend User'
  })
});
const data = await response.json();
console.log(data);
```

### Login
```javascript
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'frontend@example.com',
    password: 'TestPass123!'
  })
});
const data = await response.json();
const token = data.token;
localStorage.setItem('authToken', token);
console.log('Token saved:', token);
```

### Get Current User
```javascript
const token = localStorage.getItem('authToken');
const response = await fetch('http://localhost:8080/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('Current user:', data);
```

## React App Testing

### Using the AuthService

```typescript
import { AuthService } from './services/auth/authService';

// Register
try {
  const user = await AuthService.register(
    'react@example.com',
    'ReactPass123!',
    'React User'
  );
  console.log('Registered:', user);
} catch (error) {
  console.error('Registration failed:', error);
}

// Login
try {
  const { token, user } = await AuthService.login(
    'react@example.com',
    'ReactPass123!'
  );
  console.log('Logged in:', user);
  console.log('Token:', token);
} catch (error) {
  console.error('Login failed:', error);
}

// Get current user
try {
  const user = await AuthService.getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get user:', error);
}

// Check if authenticated
const isAuth = AuthService.isAuthenticated();
console.log('Is authenticated:', isAuth);

// Logout
AuthService.signOut();
console.log('Logged out');
```

## Common Issues

### Issue: CORS Error
**Solution**: Make sure your API has CORS enabled for `http://localhost:5173`

### Issue: "Cannot find module 'bcrypt'"
**Solution**: Run `cd api && npm install`

### Issue: Database Connection Error
**Solution**: Check your database connection string and ensure the Users table exists

### Issue: "Invalid credentials"
**Solution**: Verify the password is correct and the user exists in the database

### Issue: Token not working
**Solution**: Check that JWT_SECRET is the same in both token generation and validation

## Next Steps

1. ? Verify registration works
2. ? Verify login returns a valid token
3. ? Verify protected route validates token
4. ? Verify logout removes token
5. ?? Test end-to-end in React app
6. ?? Deploy to Azure and test in production

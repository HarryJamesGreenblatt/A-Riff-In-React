# Cosmos DB Features Implementation

## Overview

This document covers the implementation of Azure Cosmos DB-powered features in **A Riff In React**. Cosmos DB provides flexible, schema-less storage for dynamic user data, activity tracking, and future notification systems.

## Current Status:  **USER COUNTER IMPLEMENTED**

- **Phase 1**: User Counter -  **COMPLETE**
- **Phase 2**: Notification System -  **PLANNED**

## Architecture

The application uses a **single Cosmos DB container** (`activities`) with multiple document types, partitioned by `userId` for optimal query performance.

### Container Structure

```
Cosmos DB Database: ARiffInReact
- Container: activities
    - Partition Key: userId
    - Document Types:
        - Activities (type: user_action, etc.)
        - User Counters (type: user_counter)
        - Notifications (type: notification) [planned]
```

### Data Models

**Activity Document**:
```typescript
interface Activity {
  id: string;                    // Auto-generated
  userId: string;                // Partition key
  type: string;                  // Activity type
  data: Record<string, any>;     // Flexible data
  metadata: Record<string, any>;
  timestamp: string;             // ISO 8601
}
```

**User Counter Document**:
```typescript
interface UserCounter {
  id: string;          // Same as userId
  userId: string;      // Partition key
  count: number;
  lastUpdated: string;
  type: 'user_counter';
}
```

**Notification Document** (Planned):
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt: string;
}
```

## Phase 1: User Counter Feature 

### Backend Implementation

**API Endpoints**:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/counter` | Get user's counter |  Yes |
| POST | `/api/counter/increment` | Increment counter |  Yes |
| POST | `/api/counter/reset` | Reset to zero |  Yes |

**Service Methods** (`api/src/services/cosmosService.ts`):

```typescript
// Get or create user counter
async getUserCounter(userId: string): Promise<UserCounter>

// Increment counter by amount (default: 1)
async incrementUserCounter(userId: string, amount: number = 1): Promise<UserCounter>

// Reset counter to zero
async resetUserCounter(userId: string): Promise<UserCounter>
```

**Route Handlers** (`api/src/routes/counterRoutes.ts`):

- JWT authentication required for all routes
- Input validation (amount: 1-1000)
- Error handling with appropriate status codes

### Frontend Implementation

**Redux Slice** (`src/features/counter/slice.ts`):

```typescript
// RTK Query hooks
useGetCounterQuery()           // Fetch counter
useIncrementCounterMutation()  // Increment with optimistic updates
useResetCounterMutation()      // Reset counter
```

**UI Component** (`src/components/counter/CounterWidget.tsx`):
- Real-time counter display
- Quick action buttons (+1, +5, +10)
- Custom amount input
- Reset with confirmation dialog
- Loading and error states

**Dashboard Integration** (`src/pages/Dashboard.tsx`):
- Protected route (requires authentication)
- Counter widget displayed prominently
- User profile information
- Placeholder for future notification system

### Key Features

 **User-Specific**: Each user has their own counter  
 **Persistent**: Data survives logout/login  
 **Optimistic Updates**: UI updates instantly  
 **Validation**: Amount limited to 1-1000  
 **Secure**: JWT authentication required  

### Testing the Counter

1. **Login** to the application
2. **Navigate** to `/dashboard`
3. **Increment** using quick buttons or custom amount
4. **Verify** counter persists after logout/login
5. **Reset** counter (requires confirmation)

Example API calls:

```bash
# Get counter (requires JWT token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/counter

# Increment by 5
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}' \
  http://localhost:8080/api/counter/increment

# Reset counter
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/counter/reset
```

## Phase 2: Notification System 

### Planned Features

**Backend Endpoints**:

- `GET /api/notifications` - List user notifications
- `GET /api/notificationsunreadOnly=true` - Unread notifications
- `POST /api/notifications` - Create notification (admin/system)
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

**Frontend Components**:

- `NotificationBell.tsx` - Header icon with badge
- `NotificationDropdown.tsx` - Quick view of recent alerts
- `NotificationPage.tsx` - Full notification history
- Real-time updates (polling or WebSocket)

**Service Methods** (Already implemented in `cosmosService.ts`):

```typescript
getNotifications(userId: string, unreadOnly: boolean)
createNotification(notification: Omit<Notification, 'id' | 'createdAt'>)
markNotificationAsRead(notificationId: string, userId: string)
```

### Use Cases

- **User Actions**: "Profile updated successfully"
- **Admin Broadcasts**: "System maintenance scheduled"
- **Milestones**: "You reached 100 counter increments!"
- **Expiring Alerts**: Time-sensitive notifications

## Database Design

### Partitioning Strategy

**Partition Key**: `userId`

**Benefits**:
-  Efficient per-user queries
-  Automatic data distribution
-  Cost-effective operations
-  Horizontal scalability

### Query Optimization

Queries filter by document `type` to separate concerns:

```sql
-- Get only activities (exclude counters and notifications)
SELECT * FROM c 
WHERE c.userId = @userId 
  AND c.type != 'user_counter' 
  AND c.type != 'notification'
ORDER BY c.timestamp DESC
```

### Indexing

Default indexing policy includes all properties. For production optimization:
- Consider composite indexes for common query patterns
- Exclude rarely-queried properties from indexing
- Monitor RU consumption and adjust as needed

## Local Development

### Prerequisites

- Azure Cosmos DB Emulator (optional for local testing)
- Valid Cosmos DB connection string in `.env`

### Environment Variables

```env
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DATABASE_NAME=ARiffInReact
COSMOS_CONTAINER_ID=activities

# Production: Uses Managed Identity
# Local: Requires COSMOS_KEY
COSMOS_KEY=your-local-cosmos-key
```

### Running Locally

```bash
# Start API
cd api
npm run dev

# API will connect to Cosmos DB
# Counter endpoints available at http://localhost:8080/api/counter
```

## Deployment

### Production Configuration

**Managed Identity**:
- Container App uses managed identity for Cosmos DB access
- No connection keys stored in environment variables
- Role assignment: **Cosmos DB Data Contributor**

**Bicep Configuration** (`infra/main.bicep`):
```bicep
// Cosmos DB role assignment for managed identity
module cosmosRoleAssignment 'modules/cosmosRoleAssignment.bicep' = {
  name: 'cosmosRoleAssignment'
  scope: resourceGroup(existingCosmosDbResourceGroup)
  params: {
    cosmosDbAccountName: existingCosmosDbAccountName
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: '00000000-0000-0000-0000-000000000002'
  }
}
```

### Deployment Checklist

- [x] Cosmos DB account exists
- [x] `activities` container created with `/userId` partition key (automated via Bicep)
- [x] Managed identity has Cosmos DB Data Contributor role (automated via Bicep)
- [x] Environment variables set in Container App (automated via Bicep)
- [ ] API endpoints tested with authentication

## Troubleshooting

### Common Issues

**Issue**: `404 Not Found` when calling `/api/counter`  
**Solution**: 
- Ensure counter routes are registered in `api/src/index.ts`
- Verify API endpoint paths include `/api` prefix in client code
- Check that API is deployed and accessible

**Issue**: `500 Internal Server Error` with "invalid input: input is not string"  
**Solution**: This occurs when `userId` is not a string (e.g., GUID object from SQL)
- **Root cause**: SQL Server returns `UNIQUEIDENTIFIER` as objects, not strings
- **Fix**: Convert to string before using: `String(user.id)` in auth routes
- **Where to fix**: 
  - `api/src/routes/authRoutes.ts`: `const userId = String(user.id);` before `generateToken()`
  - `api/src/routes/counterRoutes.ts`: `const userId = String(req.user.userId);` before Cosmos calls
- **Verification**: Re-login to get new token with userId as string

**Issue**: `Unauthorized` or `403 Forbidden`  
**Solution**: Verify JWT token is valid and not expired
- Check localStorage has `authToken` in browser DevTools
- Token expires after 7 days by default (configurable via `JWT_EXPIRY`)
- Re-login if token expired

**Issue**: Cosmos DB connection errors  
**Solution**: 
- **Local**: Check `COSMOS_KEY` and `COSMOS_ENDPOINT` in `.env`
- **Production**: Verify managed identity has proper role assignment
- **Fallback**: In-memory mode activates if Cosmos unavailable (dev only)

**Issue**: Counter not persisting  
**Solution**: 
- Check Cosmos DB container exists: `activities`
- Verify partition key is correct: `/userId`
- Confirm managed identity has **Cosmos DB Data Contributor** role
- Check container logs for initialization errors

**Issue**: Counter resets to 0 after logout/login  
**Solution**: 
- Verify `userId` in JWT matches user ID in SQL
- Check Cosmos document ID equals userId (both must be same string)
- Look for Cosmos SDK errors in API logs

### Debug Steps

1. **Check API Health**: `curl https://<api-host>/health`
2. **Verify Token**: Decode JWT at jwt.io (check userId is string, not object)
3. **Test Counter Endpoint**: 
   ```bash
   curl -H "Authorization: Bearer <token>" \
     https://<api-host>/api/counter
   ```
4. **Check Container Logs**:
   ```bash
   az containerapp logs show \
     --name ca-api-a-riff-in-react \
     --resource-group a-riff-in-react \
     --follow
   ```
5. **Inspect Cosmos DB**: Use Data Explorer in Azure Portal to view documents

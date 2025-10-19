# Notification System Implementation

## Overview

Phase 2 of Cosmos DB features: Build a real-time notification system to display alerts, messages, and system updates to users.

**Status**: ?? **PLANNED** (Phase 2 of Cosmos DB Features)

## Goals

- Display user-specific notifications (profile updates, milestones, etc.)
- Admin broadcast messages (maintenance alerts, announcements)
- Real-time updates (polling initially, WebSocket stretch goal)
- Mark as read/unread functionality
- Expiring notifications (auto-cleanup)
- Notification history page

## Architecture

### Backend (API)

**New Routes** (`api/src/routes/notificationRoutes.ts`):

```typescript
// GET /api/notifications - List user's notifications
router.get('/', authenticateToken, async (req, res) => {
  const { unreadOnly } = req.query;
  const userId = String(req.user.userId);
  const notifications = await cosmosService.getNotifications(
    userId, 
    unreadOnly === 'true'
  );
  res.json(notifications);
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = String(req.user.userId);
  const notification = await cosmosService.markNotificationAsRead(id, userId);
  res.json(notification);
});

// POST /api/notifications (admin only) - Create notification
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, type, title, message, expiresAt } = req.body;
  const notification = await cosmosService.createNotification({
    userId,
    type,
    title,
    message,
    read: false,
    expiresAt,
    metadata: req.body.metadata || {}
  });
  res.status(201).json(notification);
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = String(req.user.userId);
  await cosmosService.deleteNotification(id, userId);
  res.status(204).send();
});
```

**Service Methods** (already exist in `cosmosService.ts`):
- ? `getNotifications(userId, unreadOnly)`
- ? `createNotification(notification)`
- ? `markNotificationAsRead(notificationId, userId)`
- ?? Need to add: `deleteNotification(id, userId)`

### Frontend (React)

**Redux Slice** (`src/features/notifications/slice.ts`):

```typescript
export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], { unreadOnly?: boolean }>({
      query: ({ unreadOnly = false }) => 
        `/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`,
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});
```

**UI Components**:

1. **NotificationBell** (`src/components/notifications/NotificationBell.tsx`)
   - Icon in header
   - Badge with unread count
   - Dropdown on click

2. **NotificationDropdown** (`src/components/notifications/NotificationDropdown.tsx`)
   - Recent 5 notifications
   - "Mark all as read" button
   - Link to full notification page

3. **NotificationList** (`src/components/notifications/NotificationList.tsx`)
   - Full list with pagination
   - Filter by read/unread
   - Delete individual notifications

4. **NotificationItem** (`src/components/notifications/NotificationItem.tsx`)
   - Icon based on type (info/success/warning/error)
   - Title and message
   - Timestamp (relative: "2 hours ago")
   - Mark as read button

### Data Model

```typescript
interface Notification {
  id: string;                          // Auto-generated
  userId: string;                      // Partition key
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;                       // "Profile Updated"
  message: string;                     // "Your profile has been updated successfully"
  read: boolean;                       // false initially
  createdAt: string;                   // ISO timestamp
  expiresAt?: string;                  // Optional auto-delete time
  metadata?: {                         // Optional context
    link?: string;                     // "/profile"
    actionLabel?: string;              // "View Profile"
    [key: string]: any;
  };
}
```

## Implementation Plan

### Step 1: Backend Routes (1-2 hours)
- [ ] Create `api/src/routes/notificationRoutes.ts`
- [ ] Add `deleteNotification` method to `cosmosService.ts`
- [ ] Register routes in `api/src/index.ts`
- [ ] Add admin middleware (optional, for broadcast)
- [ ] Test with curl/Postman

### Step 2: Frontend Slice (1 hour)
- [ ] Create `src/features/notifications/slice.ts`
- [ ] Add RTK Query endpoints
- [ ] Export hooks
- [ ] Add to store

### Step 3: UI Components (3-4 hours)
- [ ] `NotificationBell` in header (dropdown trigger)
- [ ] `NotificationDropdown` (quick view)
- [ ] `NotificationList` (full page at `/notifications`)
- [ ] `NotificationItem` (individual notification)
- [ ] Styling with Tailwind

### Step 4: Real-time Updates (1-2 hours)
- [ ] Polling mechanism (every 30s when user active)
- [ ] Badge update on new notifications
- [ ] Toast notification for high-priority alerts
- [ ] (Stretch) WebSocket for instant updates

### Step 5: Testing & Polish (1-2 hours)
- [ ] Test notification creation (manual via API)
- [ ] Test mark as read flow
- [ ] Test delete flow
- [ ] Test notification expiry (background job?)
- [ ] Add loading states
- [ ] Add empty states ("No notifications")

## Use Cases

### User Actions
```typescript
// After user updates profile
await cosmosService.createNotification({
  userId: req.user.userId,
  type: 'success',
  title: 'Profile Updated',
  message: 'Your profile has been updated successfully.',
  read: false
});
```

### Admin Broadcasts
```typescript
// Notify all users (loop through users)
await cosmosService.createNotification({
  userId: '*', // Special case for broadcast
  type: 'warning',
  title: 'Maintenance Scheduled',
  message: 'System will be down for maintenance on Oct 20 at 2 AM.',
  read: false,
  expiresAt: new Date('2025-10-21').toISOString()
});
```

### Milestones
```typescript
// When counter reaches 100
if (counter.count === 100) {
  await cosmosService.createNotification({
    userId: req.user.userId,
    type: 'info',
    title: '?? Milestone Reached!',
    message: 'You've reached 100 counter increments!',
    read: false,
    metadata: { link: '/dashboard' }
  });
}
```

## Technical Decisions

### Polling vs WebSocket

**Phase 1 (Current Plan): Polling**
- Simpler to implement
- No additional infrastructure
- Poll every 30s when user active
- Pause polling when tab inactive

**Phase 2 (Future): WebSocket**
- Real-time updates
- More complex setup (Socket.IO or native WebSocket)
- Requires server-side connection management
- Better for high-frequency notifications

**Recommendation**: Start with polling, upgrade to WebSocket if needed.

### Notification Storage

**Option 1: Cosmos DB (Current)**
- ? Already set up
- ? Flexible schema
- ? Partition by userId
- ? Costs scale with usage

**Option 2: Azure Table Storage**
- ? Very cheap
- ? Good for simple CRUD
- ? Additional service
- ? Less flexible queries

**Recommendation**: Use Cosmos DB (already integrated).

### Expiry Handling

**Option 1: TTL (Time-to-Live)**
- Set Cosmos DB TTL on container
- Documents auto-delete after expiry
- No manual cleanup needed

**Option 2: Scheduled Job**
- Azure Function runs daily
- Deletes expired notifications
- More control over cleanup logic

**Recommendation**: Use TTL (simpler, built-in).

## API Examples

### Get Unread Notifications
```bash
curl -H "Authorization: Bearer <token>" \
  https://<api-host>/api/notifications?unreadOnly=true
```

**Response:**
```json
[
  {
    "id": "notif-123",
    "userId": "abc-456",
    "type": "success",
    "title": "Profile Updated",
    "message": "Your profile has been updated successfully.",
    "read": false,
    "createdAt": "2025-10-19T12:00:00Z"
  }
]
```

### Mark as Read
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  https://<api-host>/api/notifications/notif-123/read
```

### Delete Notification
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://<api-host>/api/notifications/notif-123
```

## UI Wireframe

```
???????????????????????????????????????????
?  A Riff In React     [?? 3]  [Profile]  ? ? Header with bell
???????????????????????????????????????????
                        ?
                        ? (click bell)
              ???????????????????????
              ? Notifications (3)   ?
              ???????????????????????
              ? ?? Milestone!       ?
              ? You hit 100 clicks  ?
              ? 2 hours ago   [?]   ?
              ???????????????????????
              ? ? Profile Updated  ?
              ? Changes saved       ?
              ? 1 day ago     [?]   ?
              ???????????????????????
              ? ??  Maintenance     ?
              ? Oct 20 at 2 AM      ?
              ? 2 days ago    [?]   ?
              ???????????????????????
              ? Mark all as read    ?
              ? View all            ?
              ???????????????????????
```

## Testing Checklist

- [ ] Create notification via API
- [ ] See notification in dropdown
- [ ] Mark notification as read
- [ ] Badge count decreases
- [ ] Delete notification
- [ ] Notification list page works
- [ ] Polling updates badge automatically
- [ ] Empty state displays correctly
- [ ] Expired notifications don't show

## Future Enhancements

- [ ] Push notifications (browser API)
- [ ] Email notifications (SendGrid integration)
- [ ] Notification preferences (user settings)
- [ ] Notification categories (filter by type)
- [ ] Rich notifications (images, actions)
- [ ] Notification templates (reusable formats)

## References

- [Cosmos DB TTL Documentation](https://docs.microsoft.com/azure/cosmos-db/time-to-live)
- [RTK Query Polling](https://redux-toolkit.js.org/rtk-query/usage/polling)
- [Browser Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

**Status**: Planning Complete | Ready to Implement  
**Estimated Time**: 8-10 hours  
**Priority**: Medium  
**Next**: Begin Step 1 (Backend Routes)

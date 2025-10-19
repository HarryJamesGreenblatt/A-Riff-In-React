# Notification System Implementation

**Status**: Implemented and smoke-tested (October 19, 2025)

## Summary
The notification system is implemented end-to-end:
- Backend API routes: `GET /api/notifications`, `POST /api/notifications`, `POST /api/notifications/:id/read`, `DELETE /api/notifications/:id`.
- `api/src/services/cosmosService.ts` updated with create/read/replace/delete operations for notification documents in the `activities` container.
- Frontend: `src/features/notifications/slice.ts` (RTK Query endpoints and optimistic updates) and a minimal dashboard UI (`src/pages/Dashboard.tsx`) to display and interact with notifications.

## Smoke Test Results
- Created notifications via API (PowerShell `Invoke-RestMethod`) and confirmed Cosmos DB documents have `docType: "notification"` and `userId` set to string values.
- Dashboard displays notifications for logged-in user and allows marking as read and deletion.
- API logs show no more `invalid input: input is not string` errors after coercing IDs.

## How it works
- Notifications are stored as documents in the `activities` container with `docType: "notification"` and partition key `/userId`.
- Backend ensures `userId` and document `id` are strings when calling Cosmos SDK.
- Frontend fetches notifications using RTK Query and invalidates cache on mutations.

## Next work items
- Add `NotificationBell` component in app header with unread badge and dropdown
- Add polling (30s) to update badge and dropdown automatically
- Add integration tests and small migration script to normalize any legacy `userId` types
- UI polish for notification list page and item actions

## Commands used for testing
- Create notification (PowerShell)

```powershell
$body = @{ userId='2'; type='info'; title='Test Notification'; message='This is a test.'; read=$false } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri 'https://<api>/api/notifications' -Method Post -Headers @{ Authorization='Bearer <TOKEN>' } -ContentType 'application/json' -Body $body
```

- List notifications (PowerShell)

```powershell
Invoke-RestMethod -Uri 'https://<api>/api/notifications' -Method Get -Headers @{ Authorization='Bearer <TOKEN>' }
```

- Mark read and delete were verified via API and frontend interactions.

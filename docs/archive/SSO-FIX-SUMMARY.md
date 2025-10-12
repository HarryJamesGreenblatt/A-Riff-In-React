# SSO Login Fix Summary

## 🐛 Issues Found

### 1. Microsoft Login Error: "tenant identifier 'undefined'"
**Root Cause:** `.env.local` was missing the `VITE_ENTRA_USER_FLOW_AUTHORITY` environment variable, and Vite was loading `.env.local` which takes precedence over `.env`.

### 2. Google Login Not Working (No Response on Click)
**Root Cause:** Same issue - External ID requires the user flow authority to be set for social providers like Google to work.

### 3. Conflicting Client IDs
- `.env` had: `1ae6625f-c018-4921-897a-1ba43d37a17c`
- `.env.local` had: `f0cb9adf-c1b0-4a11-acb3-04df6187d07f`

## ✅ Solutions Applied

### 1. Updated `.env.local` with Complete Configuration
```bash
# IMPORTANT: This client ID must match the app registration in your External ID user flow
VITE_ENTRA_CLIENT_ID=1ae6625f-c018-4921-897a-1ba43d37a17c
VITE_ENTRA_TENANT_ID=813307d1-6d39-4c75-8a38-2e34128203bc

# External ID User Flow Authority (REQUIRED for Google/social sign-in)
VITE_ENTRA_USER_FLOW_AUTHORITY=https://sequitursolutions.b2clogin.com/tfp/813307d1-6d39-4c75-8a38-2e34128203bc/b2x_1_user-flow-for-a-riff-in-react/v2.0

VITE_REDIRECT_URI=http://localhost:5173
VITE_POST_LOGOUT_URI=http://localhost:5173
```

### 2. Unified Client ID
Now both files use the same client ID that matches your External ID user flow app registration.

### 3. Added User Flow Authority
The `VITE_ENTRA_USER_FLOW_AUTHORITY` is now properly set in `.env.local`, which is required for:
- Google sign-in
- Microsoft sign-in through External ID
- Any other social provider

### 4. Created Auth Test Page
Created `/auth-test` route to help verify configuration is loaded correctly.

## 🧪 Testing Steps

### Step 1: Verify Configuration is Loaded
1. Navigate to: `http://localhost:5173/auth-test`
2. Check that all environment variables show as "✅ Set"
3. Verify the User Flow Authority is displayed correctly

### Step 2: Test Microsoft Login
1. Go to: `http://localhost:5173/register`
2. Click the **Microsoft** button
3. You should be redirected to Microsoft login
4. **Expected behavior:** Login screen appears (not an error about "tenant identifier 'undefined'")

### Step 3: Test Google Login
1. Go to: `http://localhost:5173/register`
2. Click the **Google** button
3. You should be redirected to the External ID user flow
4. **Expected behavior:** External ID login screen with Google option appears

## 📋 Configuration Reference

### Your External ID Setup
- **Tenant ID:** `813307d1-6d39-4c75-8a38-2e34128203bc`
- **Client ID:** `1ae6625f-c018-4921-897a-1ba43d37a17c` (app registration in user flow)
- **User Flow Name:** `b2x_1_user-flow-for-a-riff-in-react`
- **B2C Domain:** `sequitursolutions.b2clogin.com`

### User Flow Authority Format
```
https://<tenant>.b2clogin.com/tfp/<tenant-id>/<policy-name>/v2.0
```

## ⚠️ Important Notes

1. **Dev Server Restart Required**
   - After changing `.env` files, **ALWAYS** restart the dev server
   - Vite only reads environment variables at startup
   - Command: `npm run dev`

2. **Environment Variable Precedence**
   - `.env.local` overrides `.env`
   - `.env.local` is gitignored (good for local dev)
   - `.env` is committed to repo (shared config)

3. **Client ID Must Match**
   - The `VITE_ENTRA_CLIENT_ID` must match the app registration in your Azure External ID user flow
   - If you have multiple app registrations, ensure you're using the correct one

4. **Social Providers Require User Flow**
   - Direct Azure AD authority: `https://login.microsoftonline.com/{tenant-id}`
   - User Flow authority: `https://{tenant}.b2clogin.com/tfp/{tenant-id}/{policy}/v2.0`
   - Google/social login ONLY works with the User Flow authority

## 🔧 Troubleshooting

### If Microsoft login still shows "tenant identifier 'undefined'":
1. Check `/auth-test` to verify `VITE_ENTRA_TENANT_ID` is loaded
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache and cookies
4. Restart dev server completely

### If Google login still doesn't work:
1. Check `/auth-test` to verify `VITE_ENTRA_USER_FLOW_AUTHORITY` is set
2. Verify the user flow authority URL is correct (check Azure portal)
3. Ensure the app registration is associated with the user flow in Azure
4. Check browser console for MSAL errors

### If you get CORS errors:
1. Ensure redirect URIs are registered in Azure app registration
2. Check that `http://localhost:5173` is in the list of redirect URIs
3. Verify the user flow includes your app registration

## 📚 Additional Resources

- **Azure External ID Docs:** https://learn.microsoft.com/en-us/azure/active-directory/external-identities/
- **MSAL React Guide:** https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react
- **User Flow Configuration:** Check your Azure portal → External ID → User flows

## 🎯 Next Steps

1. Test both Microsoft and Google logins
2. If successful, remove the `/auth-test` page (or keep for debugging)
3. Set up production environment variables for deployment
4. Consider adding error handling UI for better user experience

---

**Configuration Updated:** September 30, 2025
**Dev Server:** Running on `http://localhost:5173`
**Test Page:** `http://localhost:5173/auth-test`

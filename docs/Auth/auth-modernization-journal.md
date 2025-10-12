# Authentication Modernization Journal

## Date: September 13, 2025

### Objective
Unify authentication in A-Riff-In-React to support:
- Microsoft SSO (MSAL/Entra External ID)
- Social identity providers (Google, Facebook, Apple, etc.)
- Classic email/password registration

### Current State
 MSAL login is implemented for Microsoft accounts and Entra External ID.
 Social login (Google, Facebook) is not yet enabled, but research confirms Entra External ID supports these providers if configured.
 Direct registration (email/password) is partially implemented; password handling strategy is pending.

### Next Steps
 1. Register the app in Google Cloud Console and Facebook Developer Portal to obtain client IDs and secrets for social login.
 2. Configure Google and Facebook as identity providers in Entra External ID using the admin center or PowerShell.
 3. Implement local registration flow (email/password).
 4. Update frontend authentication UI to present all options (Microsoft, Google, Facebook, email/password).
 5. Ensure backend API validates tokens from all providers and supports user creation.
 6. Test all authentication flows and update documentation.

---

### Implementation Plan

---

#### Entry 1: Planning
- Reviewed current MSAL/Entra External ID setup.
- Identified need for unified authentication experience.
- Outlined steps for enabling social providers and local registration.
- Decided to journal all changes and decisions in this file for transparency and future reference.

---

*Continue to add entries as implementation progresses.*

---

#### Entry 2: Developer work - frontend & backend wiring
- Date: September 13, 2025
- Implemented a `RegisterForm` React component at `src/components/auth/RegisterForm.tsx` to collect name/email/password and call `AuthService.register`.
- Extended `AuthService` with a `register` method that POSTs to `/api/users` and dispatches the returned user to Redux store via `setCurrentUser`.
- Notes: Backend `POST /api/users` currently accepts `name` & `email` and will return existing user if email already exists. Password is not yet stored — planned to integrate with Entra External ID or hashed storage if local storage is chosen.

*Next*: Update frontend UI to surface the register form and wire validation; coordinate with backend if passwords should be handled locally or via Entra External ID self-service sign-up.

---

#### Entry 3: Styling and UX
- Date: September 13, 2025
- Implemented Tailwind-based styling for `RegisterForm` and centered layout in `Register` page.
- Added success and error messages, focus rings, and responsive container sizing.
- Notes: Form now presents clean UX on desktop; mobile responsiveness handled by Tailwind utility classes. Still to decide whether passwords are persisted locally or delegated to Entra External ID self-service.

*Next*: Wire the Register link into main navigation or auth modal; add client-side validation and unit tests.

---

#### Entry 4: Switched to semantic vanilla CSS
- Date: September 13, 2025
- Converted the register form styling from Tailwind to semantic vanilla CSS (`src/components/auth/register-form.css`).
- Updated `RegisterForm` to use semantic class names and imported CSS in the Register page.
- This avoids adding Tailwind to the project and keeps the UI consistent with the existing CSS approach.

*Next*: Add client-side validation, and decide on password handling strategy (Entra vs local hashing).

---

#### Entry 5: Layout fix
- Date: September 13, 2025
- The register form was visually stuck to the left; refactored the register page into a two-column layout (`.register-inner`) and placed the `RegisterForm` in an aside to the right of the heading.
- Added `.register-page` and supporting rules in `register-form.css` to ensure responsive collapse on small screens.

*Next*: Add client-side validation and decide whether to rely on Entra External ID for self sign-up or implement local password hashing.

---

#### Entry 6: Social provider support confirmed
 - Date: September 14, 2025
 - Researched Azure Entra External ID capabilities and confirmed support for Google and Facebook sign-in via social identity providers.
 - Learned that registration in Google Cloud Console and Facebook Developer Portal is required to obtain OAuth credentials (client ID/secret) for each provider.
 - These credentials must be configured in the Entra admin center or via PowerShell to enable social login.
 - No cost is associated with registering for social login; only paid services incur charges.
 - Next: Register apps with Google and Facebook, configure providers in Entra, and update frontend to present all login options.


#### Entry 7: Status update and blocker (2025-09-14)

- Goal: hybrid SSO (Microsoft + Google) using Azure Entra External ID / user flows, with in-app collection of extra profile attributes (phone number) when missing.
- Implemented so far:
	- Frontend: SSO UI restored; `Register` shows Microsoft and Google buttons (Facebook removed).
	- MSAL integration: `msalInstance` initialized; redirect handling in place. `AuthService.signIn` updated to accept a provider and to optionally override authority for Google via `VITE_ENTRA_USER_FLOW_AUTHORITY`.
	- Post-login: `PhoneCollectModal` and `AuthService.savePhoneForUser` implemented and wired to `App.tsx` to collect missing phone numbers.
	- Backend: `PUT /api/users/:id` implemented to save phone and `sqlService.updateUser` exists.
- Troubleshooting performed:
	- Registered Google as an External ID provider and created user flow `B2X_1_user-flow-for-a-riff-in-react`.
	- Updated frontend to be able to call the user-flow authority for Google sign-in.
	- Observed that clicking Google redirected to the tenant authority (`login.microsoftonline.com`) and external Google accounts were rejected with AADSTS50020 because the user flow was not active/assigned for the app.
- Blocker and explanation:
	- The portal shows the user flow exists but the "Run user flow" experience does not expose the SPA app (or the Run experience expects a Web reply URL for testing). The hosted user flow will only present social providers to external accounts when the app is associated with the user flow or when the user flow authority is used for the auth request.
	- The Run user flow testing blade historically prefers `Web` reply URLs (like `https://jwt.ms`) and may not list SPA reply URIs. This means the Run test may not list your SPA but the runtime flow still works if the app registration and redirect URIs are correct and you call the user-flow authority.
- Recommended next steps:
	1. In the Azure Portal: User flows → select `B2X_1_user-flow-for-a-riff-in-react` → Run user flow → select your frontend app in the Application dropdown. If the app doesn't appear, verify the app registration exists in the same tenant and has the SPA redirect URI.
	2. Copy the user-flow authority URL from the Run user flow pane and set it in your environment as `VITE_ENTRA_USER_FLOW_AUTHORITY` or provide it here so it can be added to the repo.
	3. Rebuild and test: clicking Google should use the user-flow authority (b2clogin) and present Google as an identity provider; after the token is returned the phone-collection modal should appear if the phone is missing.

Notes:
- Code changes were made to support per-request authority override and to make `useAuth.signIn` compatible with `onClick` handlers. Local TypeScript checks were run and passed.
- If assigning the app to the user flow in the portal is not possible, set the `VITE_ENTRA_USER_FLOW_AUTHORITY` env var to the user-flow URL — the SPA will call it directly.

---

#### Entry 8: Automation & CI/CD for auth provisioning (2025-09-14)

Objective:
- Make user-flow / policy and identity-provider (Google) bindings reproducible and automatable so templates and scaled deployments do not require manual portal clicks.

Summary:
- Manual portal edits (adding/removing apps from a user flow, uploading custom policy XML, creating policy keys) do not scale for multi-environment or templated deployments. Implementing automation in the CI/CD pipeline (GitHub Actions) and IaC (Bicep/Terraform) ensures deployments are repeatable, auditable, and suitable for handoffs.

Recommended automation components:

1) Infrastructure as Code (preferred):
 - Use `infra/main.bicep` (already present in this repo) to declare identity resources where possible. Bicep can provision:
	 - App registrations (Microsoft.Graph resource provider) and service principals
	 - Key vaults or storage for policy keys (policy signing / encryption keys)
	 - Delegated role assignments required for automation accounts
 - Note: Bicep currently cannot manage all B2C user flow binding details; for user-flow Applications list and enabling social identity providers you may need Graph or portal steps (see below).

2) Microsoft Graph automation (GitHub Actions):
 - Use GitHub Actions workflows to run authenticated scripts (PowerShell or Node.js) that call Microsoft Graph to:
	 - Create / update app registrations (set `spa.redirectUris`, reply URLs for web flows).
	 - Add the SPA application to a user flow's applications collection (or update relying party in custom policies).
	 - Upload or patch custom policy files for Identity Experience Framework (if using custom policies).
	 - Create and rotate policy keys (e.g., Google client secret or other secrets stored in Azure Key Vault).
 - Store the following secrets in GitHub Actions (or in an Azure Key Vault accessed by the workflow):
	 - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` for a service principal with least privilege to manage applications and policy files.
	 - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` to create the Google identity provider in Entra.
	 - `AZURE_CERT` / key material or KeyVault access details for policy keys used by custom policies.

3) Workflow design and safety:
 - Use separate workflow jobs per environment (`dev`, `staging`, `prod`) and conditionally apply changes with `if` checks.
 - Add dry-run and approval steps for production changes (require human approval for reassigning policies or overwriting RP XML).
 - Keep a copy of current policy files and a versioned backup in the repo (or an artifacts container) before applying updates.

4) Implementation snippets (high-level):
 - Example PowerShell (GitHub Action) steps:
	 - `az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID`
	 - `Connect-MgGraph -ClientId $AZURE_CLIENT_ID -TenantId $AZURE_TENANT_ID -CertificateThumbprint ...` or use `Install-Module Microsoft.Graph` and `Connect-MgGraph -ClientSecret` with required scopes.
	 - Use `Get-MgIdentityB2xUserFlow` and `Update-MgIdentityB2xUserFlow` (or the appropriate beta endpoints) to add/remove applications.
 - Example Node.js approach: use `@microsoft/microsoft-graph-client` or `@azure/identity` to authenticate with a client secret and call `https://graph.microsoft.com/beta/identity/b2xUserFlows/{id}/applications` to patch bindings.

Handoff notes for next engineer:
 - The repository contains `infra/main.bicep` as a starting point for identity and resource provisioning. Extend it to provision the SPA app registration if desired.
 - Store production secrets for Google in GitHub Secrets or in Azure Key Vault; the workflows assume they are present under the names listed above.
 - If your tenant uses custom policies (Identity Experience Framework), maintain the policy XML files in `infra/policies/` and have the workflow upload/patch them as an atomic step. Include tests that the RP XML contains the expected client id(s) before upload.
 - Keep the `VITE_ENTRA_USER_FLOW_AUTHORITY` env var dynamic per environment (e.g., `dev`, `staging`, `prod`) so MSAL calls the correct policy.

Next steps (automation work items):
 1. Add GitHub Actions workflow `./.github/workflows/auth-provision.yml` that:
		- Runs on push to `main` (or tag), reads environment (`env: dev|staging|prod`).
		- Authenticates with a deployment service principal.
		- Creates/updates SPA app registration and sets `spa.redirectUris`.
		- Adds the SPA to the B2X user flow Applications list (or patches RP file for custom policies).
 2. Add `infra/policies/` to the repo with versioned RP/custom policy XML files (if using custom policies). Add guarded apply/upload steps in the workflow.
 3. Add unit/integration tests for the identity provisioning script (dry run mode) and a smoke test that a test user can start the authorize redirect (validate URL constructed).

References & tips:
 - Microsoft Graph docs: manage B2C user flows (`/identity/b2xUserFlows`) and policy files (beta endpoints may be required).
 - Custom policies must be uploaded to the Identity Experience Framework blade; automate via Graph/az rest calls or az cli where necessary and validate responses.

Wrap-up:
- This journal entry documents the automation approach so the next engineer or handoff can implement GitHub Actions to manage user flows, app registrations, and policy files. The immediate priority is to record the intended secrets, workflow name, and the `infra/policies/` directory so work can continue without manual portal steps.

---

#### Entry 9: Automation Script Implementation Attempts & Ongoing Issues (2025-09-14)

**Current Status**: FAILED - PowerShell automation script for Entra External ID provisioning is not working.

**What Was Attempted**:
- Created `scripts/setup-entra-external-id.ps1` - PowerShell script intended to automate:
  - SPA app registration with correct redirect URIs
  - User flow association with the SPA app
  - Google identity provider configuration
- GitHub Actions secrets configured:
  - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (service principal)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth app credentials)
- Environment variables locally set

**Technical Approach Attempted**:
- **Primary Method**: Azure CLI (`az rest`) for Microsoft Graph API calls
- **Fallback Method**: Microsoft.Graph PowerShell modules when `az` unavailable

**Technical Challenges - UNRESOLVED**:

1. **Azure CLI Invocation Issues** (ATTEMPTED FIXES, STILL FAILING):
   - Initial ProcessStartInfo approach failed with argument parsing errors
   - Tried switching to direct PowerShell invocation of `az` commands
   - Script execution still failing

2. **Content-Type Header Issues** (ATTEMPTED FIXES):
   - Tried adding `--headers "Content-Type=application/json"` to write operations
   - Still encountering issues with `az rest` calls

3. **PowerShell URL Construction Issues** (ATTEMPTED FIXES):
   - PowerShell backticks in `$filter` query parameters causing problems
   - Attempted various URL construction approaches
   - Issues persist with Microsoft Graph API calls

**Current Script Status**:
- Script exists but DOES NOT WORK
- Multiple execution attempts have failed
- `az rest` calls are not functioning correctly
- Functions implemented but not working:
  - `Test-AzAuth`: Intended to verify Azure CLI authentication
  - `Invoke-AzRest`: Intended as wrapper for `az rest` with error handling
  - Main logic for app registration, user flow, and identity provider operations

**Next Session Action Items**:

1. **CRITICAL - Fix Script Execution** (HIGH PRIORITY):
   - The automation script `scripts/setup-entra-external-id.ps1` does not work
   - Multiple attempts to run it have failed
   - Need to completely debug why `az rest` calls are failing
   - May need to scrap the current approach and start over

2. **Alternative Approaches to Consider**:
   - Use Microsoft.Graph PowerShell modules directly instead of `az rest`
   - Use REST API calls with `Invoke-RestMethod` instead of Azure CLI
   - Manual portal configuration as fallback
   - Different scripting language (Node.js, Python)

3. **Service Principal Permissions Investigation**:
   - Verify service principal has required Microsoft Graph permissions:
     - `Application.ReadWrite.All`
     - `IdentityProvider.ReadWrite.All` 
     - `IdentityUserFlow.ReadWrite.All`
   - Check if admin consent is properly granted

4. **Environment Troubleshooting**:
   - Verify Azure CLI authentication is working: `az account show`
   - Test basic Graph API calls manually: `az rest --method GET --url "https://graph.microsoft.com/v1.0/me"`
   - Check if the issue is with the script or the underlying tools

**Known Issues for Next Engineer**:
- PowerShell script execution consistently fails
- `az rest` commands in the script do not execute successfully
- URL construction problems may persist despite attempted fixes
- Authentication or permissions issues possible
- Script may need complete rewrite

**Current Blockers**:
- Cannot provision Entra External ID resources automatically
- Manual portal configuration still required
- CI/CD automation is not functional
- Google identity provider configuration incomplete

**Files That Need Work**:
- `scripts/setup-entra-external-id.ps1` - BROKEN, needs major fixes or rewrite
- GitHub Actions workflow - NOT CREATED due to script failures

**Environment Variables** (confirmed working):
```powershell
$env:AZURE_TENANT_ID        # Set and verified
$env:AZURE_CLIENT_ID        # Set and verified  
$env:VITE_ENTRA_CLIENT_ID   # Set and verified
$env:GOOGLE_CLIENT_ID       # Set and verified
# SECRET vars are set but not displayed for security
```

**Recommendation for Next Session**: 
- Start fresh with a simpler approach
- Test basic Azure CLI functionality first
- Consider using only Microsoft.Graph PowerShell modules
- Get ONE Graph API call working before building the full script

**IMPORTANT**: Do not assume any of the "fixes" mentioned earlier actually work. The script has never executed successfully.

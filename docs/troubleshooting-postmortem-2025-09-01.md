# Troubleshooting Post-Mortem: API Routing Failures

**Date:** September 1, 2025  
**Session Type:** Extended Debugging Session  
**Duration:** ~3 hours  
**Status:** � **MAJOR ARCHITECTURAL MIGRATION COMPLETED - API STILL FAILING**  
**Outcome:** Migrated from Azure Functions to App Service, cleaned codebase, TypeScript errors identified but still having startup issues

## 🔄 What We Accomplished Today

### Major Architectural Changes ✅
- **Migrated from Azure Functions to App Service** - complete infrastructure overhaul
- **Updated Bicep infrastructure** - functionApp → apiApp conversion
- **Cleaned up duplicate/conflicting package.json files** - eliminated "evil twins"
- **Simplified deployment structure** - single clean deployment package
- **Downgraded Express 5.x → 4.x** for Node.js 14 compatibility
- **Manual deployment successful** - files confirmed uploaded to Azure

### Current Problem Analysis �
- **Container starts successfully** but **application crashes immediately** with exit code 1
- **Root cause identified**: TypeScript compiler (tsc) looking for missing '../lib/tsc.js'
- **Error pattern**: `npm run build` → `tsc` → "Cannot find module '../lib/tsc.js'" → startup failure
- **Package.json still has build scripts** in deployed version despite local cleanup

### Initial Problem (Session Started With)
- Azure Function App deployed successfully but returning 404 for all `/api/*` routes
- Function App root endpoint working (showing default Azure page)  
- All API endpoints (`/api`, `/api/health`, `/api/users`) returning 404

## 🎯 Current Status Summary

### ✅ **What's Working**
- **Frontend**: React app fully deployed and working at `a-riff-in-react.azurewebsites.net`
- **Infrastructure**: Complete migration from Azure Functions to App Service
- **Cost Optimization**: Saved $15.36/month by cleaning up orphaned resources
- **Codebase**: Eliminated duplicate/conflicting package.json files
- **Deployment**: Clean deployment package created and uploaded successfully
- **File Structure**: All files confirmed deployed to Azure (`server.js`, `package.json`, `node_modules`)

### ❌ **What's Still Broken**  
- **API Startup**: Application crashes immediately on startup with exit code 1
- **Root Cause**: TypeScript compiler missing '../lib/tsc.js' causing build failure
- **Error Flow**: `npm start` → `prestart: npm run build` → `tsc` → module not found → crash
- **503 Errors**: API returning 503 Service Unavailable due to startup failure

### 🔍 **Key Insight**
Despite uploading clean `package.json` without TypeScript, Azure is still finding a version with:
```json
{
  "scripts": {
    "prestart": "npm run build",
    "build": "tsc"
  }
}
```

This suggests either:
1. Cache issue in Azure deployment
2. Wrong files being prioritized during startup
3. TypeScript dependencies still installed in node_modules

## 🛠️ Next Session Action Plan

### Priority 1: Verify Deployed Package Content
1. **Check actual deployed package.json** in Kudu console
2. **Verify no TypeScript scripts** in deployed version
3. **Confirm Express 4.x installed** not Express 5.x

### Priority 2: Clean TypeScript Dependencies  
1. **Delete node_modules** in Azure via Kudu
2. **Run npm install** to rebuild from clean package.json
3. **Verify only Express + CORS installed**

### Priority 3: Alternative Startup Configuration
1. **Set WEBSITE_RUN_FROM_PACKAGE=0** to ensure file deployment
2. **Configure startup command** directly in Azure Portal
3. **Test with minimal server.js** (no build step)

## 📊 Progress Tracking

### Major Milestones Completed
- [x] **Architecture Migration**: Azure Functions → App Service
- [x] **Infrastructure Update**: Bicep templates converted
- [x] **Code Cleanup**: Eliminated duplicate package.json files  
- [x] **Deployment Package**: Clean Express-only deployment created
- [x] **File Upload**: Confirmed deployment via Kudu File Manager
- [x] **Express Compatibility**: Downgraded 5.x → 4.x for Node 14

### Remaining Tasks
- [ ] **Fix TypeScript Build Error**: Remove tsc dependency completely
- [ ] **API Startup Success**: Get Express server running
- [ ] **Health Check Working**: Confirm `/health` endpoint responds
- [ ] **Full API Testing**: Test all endpoints with authentication

## 🔍 What Should Have Been Done

### Systematic Diagnostic Approach

#### Step 1: Confirm Infrastructure Status
```bash
# ✅ These were working
curl https://func-a-riff-in-react.azurewebsites.net/     # Returns default page
curl https://a-riff-in-react.azurewebsites.net/         # React app working
```

#### Step 2: Check Function App Logs
```bash
# ❌ This was skipped - should have been priority #1
az functionapp logs tail --name func-a-riff-in-react --resource-group riffinreact-rg
```

#### Step 3: Verify Function Registration
```bash
# ❌ Should have checked if function was even registered
az functionapp function list --name func-a-riff-in-react --resource-group riffinreact-rg
```

#### Step 4: Test Function Directly (Bypass Routing)
```bash
# ❌ Should have tested if function itself works, not just routing
curl https://func-a-riff-in-react.azurewebsites.net/admin/functions/api
```

### Proper Root Cause Analysis

The real issue was likely one of:
1. **Function not registering** due to compilation errors
2. **Azure Functions runtime misconfiguration** in host.json
3. **Route prefix configuration** in Function App settings
4. **Build/deployment pipeline** not including the function properly

## 📚 Key Lessons Learned

### 1. **Always Start With Logs** 📋
- Azure Function Apps have extensive logging
- Application Insights provides detailed telemetry
- Logs would have immediately shown if the function was registered
- **Action:** Always check logs before modifying code

### 2. **Understand the Deployment Model** 🚀
- GitHub Actions deploys a ZIP file to Azure
- Local changes don't affect deployed app until pushed
- Environment variables are separate between local and deployed
- **Action:** Test locally, then deploy changes systematically

### 3. **Use Azure Diagnostic Tools** 🔧
- Azure Portal has built-in diagnostics
- Function App has a "Test/Run" feature
- Application Insights shows request traces
- **Action:** Leverage Azure tooling before custom debugging

### 4. **Incremental Problem Solving** 🎯
```markdown
✅ Good approach:
1. Identify ONE specific issue
2. Make ONE targeted change
3. Test the change
4. Document result
5. Repeat

❌ Bad approach:
1. Change multiple things simultaneously
2. Hope something works
3. Get confused when multiple changes interact
4. Lose track of what actually works
```

### 5. **Preserve Working States** 💾
- Commit working states frequently
- Tag stable versions
- Document what works and what doesn't
- **Action:** More frequent commits with clear messages

## 🛠️ Improved Troubleshooting Checklist

### For Azure Function API Issues

#### Phase 1: Infrastructure Verification
- [ ] Function App is running (check portal)
- [ ] Function App shows in resource group
- [ ] DNS resolves correctly
- [ ] Basic HTTP connectivity works

#### Phase 2: Application Diagnostics
- [ ] Check Function App logs in Azure Portal
- [ ] Verify function registration in Azure
- [ ] Test function directly (admin endpoints)
- [ ] Check Application Insights for errors

#### Phase 3: Code-Level Investigation
- [ ] Verify TypeScript compilation locally
- [ ] Check function export/import structure
- [ ] Validate host.json configuration
- [ ] Review routing configuration

#### Phase 4: Deployment Investigation
- [ ] Verify GitHub Actions deployment success
- [ ] Check deployment logs for errors
- [ ] Confirm ZIP file structure
- [ ] Validate environment variables

### For Any Azure Deployment Issue

1. **Portal First** - Always check Azure Portal before modifying code
2. **Logs Second** - Review all available logs and diagnostics
3. **Local Test Third** - Reproduce locally if possible
4. **Targeted Fix Fourth** - Make ONE specific change
5. **Deploy and Test Fifth** - Test the single change in deployment

## 🎯 Specific Action Items

### Immediate (Next Session)
1. **Check Azure Function logs** before any code changes
2. **Verify function registration** in Azure Portal
3. **Test basic function deployment** with minimal code
4. **Document working configuration** once found

### Process Improvements
1. **Create troubleshooting runbook** for common Azure issues
2. **Set up better local development** environment that mirrors Azure
3. **Implement health check endpoints** that provide diagnostic information
4. **Create automated tests** for deployment verification

### Documentation
- [x] Document this post-mortem
- [ ] Create Azure troubleshooting guide
- [ ] Update development setup with diagnostic tools
- [ ] Document known good configurations

## 🔄 Recovery Strategy

### What We Did Right
- **Used version control** effectively
- **Reverted to known good state** when troubleshooting went too far
- **Preserved working codebase** through git reset
- **Documented the failure** for future reference

### Revert Decision Justification
Reverting to commit `27599d2a315fd20d1eb01b7944ff8da225819544` was the correct decision because:
- We had made too many simultaneous changes
- The troubleshooting approach was not systematic
- The working deployment pipeline was preserved
- It allowed us to start fresh with better methodology

## 📈 Success Metrics for Next Attempt

### Definition of Success
- [ ] API endpoints respond correctly within 1 hour
- [ ] Root cause identified before making code changes
- [ ] Only targeted changes made
- [ ] Each change tested individually
- [ ] Working configuration documented

### Red Flags to Watch For
- Making multiple changes simultaneously
- Modifying code without checking logs first
- Assuming local changes affect deployed app
- Skipping systematic diagnosis
- Getting frustrated and making random changes

## 💡 Positive Takeaways

Despite the extended troubleshooting session:
1. **We protected the codebase** by reverting when needed
2. **We learned valuable lessons** about Azure Function debugging
3. **We have a clear methodology** for next time
4. **The infrastructure is working** - the issue is application-level
5. **The deployment pipeline works** - we can iterate quickly

---

**Status:** Ready for systematic approach to API routing resolution  
**Confidence:** High - armed with better methodology  
**Risk:** Low - codebase is protected and we know what not to do

**Next Session Goal:** Resolve API routing with systematic diagnostic approach in <1 hour

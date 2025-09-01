# Troubleshooting Post-Mortem: API Routing Failures

**Date:** September 1, 2025  
**Session Type:** Extended Debugging Session  
**Duration:** ~3 hours  
**Status:** 🔴 **REVERTED TO KNOWN GOOD STATE**  
**Outcome:** Lessons learned, codebase protected

## 🚨 What Went Wrong

### Initial Problem
- Azure Function App deployed successfully but returning 404 for all `/api/*` routes
- Function App root endpoint working (showing default Azure page)
- All API endpoints (`/api`, `/api/health`, `/api/users`) returning 404

### Critical Mistakes Made

#### 1. **Scattered Troubleshooting Approach** 🎯
**Problem:** Jumped between multiple potential fixes without systematic diagnosis
- Modified routing configuration multiple times
- Changed Express.js integration approaches
- Updated function registration methods
- Made local environment changes thinking they'd affect deployed app

**Lesson:** Always diagnose systematically before attempting fixes

#### 2. **Assumption-Driven Debugging** 🤔
**Problem:** Made assumptions about root cause without confirming evidence
- Assumed routing configuration was wrong
- Assumed Express.js integration was the issue
- Assumed local environment changes would propagate to deployed app

**Lesson:** Gather concrete evidence before making changes

#### 3. **Multiple Simultaneous Changes** ⚡
**Problem:** Made several changes at once, making it impossible to isolate what worked
- Modified function routing, path parsing, AND registration simultaneously
- Changed both local and deployment configuration
- Updated multiple files without testing individual changes

**Lesson:** Make one change at a time and test each change

#### 4. **Ignored Working Deployment Pipeline** ✅
**Problem:** Despite having a working CI/CD pipeline, focused on wrong areas
- GitHub Actions was deploying successfully
- Infrastructure was provisioned correctly
- Function App was running (evidenced by default page)

**Lesson:** When infrastructure is working, focus on application-level issues

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

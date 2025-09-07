# Documentation Reorganization Script
# This script renames and reorganizes the documentation files for better logical flow

Write-Host "📚 Reorganizing documentation for better logical flow..." -ForegroundColor Green

# Define the reorganization mapping
$docMappings = @{
    # Phase 1: Understanding & Setup (keep as-is)
    "01-project-overview.md" = "01-project-overview.md"
    "02-architecture.md" = "02-architecture.md"
    "02-development-setup.md" = "03-development-setup.md"  # Fix duplicate numbering
    
    # Phase 2: Frontend Implementation
    "03-ui-framework-setup.md" = "05-ui-framework-setup.md"
    "04-state-management.md" = "06-state-management.md"
    "05-authentication-msal.md" = "07-authentication-msal.md"
    
    # Phase 3: Backend & Infrastructure
    "07-backend-api.md" = "08-backend-api.md"
    "13-provider-registration.md" = "09-provider-registration.md"  # Move up - critical for deployment
    "08-azure-deployment.md" = "10-azure-deployment.md"
    "09-github-actions-ci-cd.md" = "11-github-actions-ci-cd.md"
    
    # Phase 4: Operations & Reference
    "10-deployment-success.md" = "12-deployment-success.md"
    
    # Special handling for local development guides (consolidate)
    "11-local-development.md" = "04-local-development.md"  # This will be the consolidated version
    "12-local-development-workflow.md" = "DELETE"  # Mark for deletion (content will be merged)
}

$docsPath = "docs"

# Create backup first
$backupPath = "docs-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
Write-Host "📦 Creating backup at: $backupPath" -ForegroundColor Yellow
Copy-Item -Path $docsPath -Destination $backupPath -Recurse

# Process each mapping
foreach ($oldName in $docMappings.Keys) {
    $newName = $docMappings[$oldName]
    $oldPath = Join-Path $docsPath $oldName
    
    if (Test-Path $oldPath) {
        if ($newName -eq "DELETE") {
            Write-Host "🗑️ Marking for deletion: $oldName" -ForegroundColor Red
            continue
        }
        
        $newPath = Join-Path $docsPath $newName
        
        if ($oldName -ne $newName) {
            Write-Host "📝 Renaming: $oldName → $newName" -ForegroundColor Cyan
            Move-Item -Path $oldPath -Destination $newPath
        } else {
            Write-Host "✅ Keeping: $oldName" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ File not found: $oldName" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 New Documentation Structure:" -ForegroundColor Cyan
Write-Host "Phase 1: Understanding & Setup" -ForegroundColor White
Write-Host "  01-project-overview.md" -ForegroundColor Gray
Write-Host "  02-architecture.md" -ForegroundColor Gray  
Write-Host "  03-development-setup.md" -ForegroundColor Gray
Write-Host "  04-local-development.md (consolidated)" -ForegroundColor Gray

Write-Host ""
Write-Host "Phase 2: Frontend Implementation" -ForegroundColor White
Write-Host "  05-ui-framework-setup.md" -ForegroundColor Gray
Write-Host "  06-state-management.md" -ForegroundColor Gray
Write-Host "  07-authentication-msal.md" -ForegroundColor Gray

Write-Host ""
Write-Host "Phase 3: Backend & Infrastructure" -ForegroundColor White
Write-Host "  08-backend-api.md" -ForegroundColor Gray
Write-Host "  09-provider-registration.md" -ForegroundColor Gray
Write-Host "  10-azure-deployment.md" -ForegroundColor Gray
Write-Host "  11-github-actions-ci-cd.md" -ForegroundColor Gray

Write-Host ""
Write-Host "Phase 4: Operations & Reference" -ForegroundColor White
Write-Host "  12-deployment-success.md" -ForegroundColor Gray

Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "1. Consolidate local development guides into 04-local-development.md" -ForegroundColor Gray
Write-Host "2. Delete 12-local-development-workflow.md after content merge" -ForegroundColor Gray
Write-Host "3. Update cross-references in documentation" -ForegroundColor Gray
Write-Host "4. Test all documentation links" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Documentation reorganization complete!" -ForegroundColor Green

# Azure Function App Configuration Script
# Run this when network connectivity to Azure is working

Write-Host "🔧 Configuring Function App Settings..." -ForegroundColor Yellow

$functionAppName = "func-a-riff-in-react"
$resourceGroup = "riffinreact-rg"

# Configuration settings for the Function App
$appSettings = @{
    "SQL_CONNECTION_STRING" = "Server=tcp:sequitur-sql-server.database.windows.net,1433;Initial Catalog=riff-react-db;Persist Security Info=False;User ID=sqladmin;Password=TempPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    "COSMOS_ENDPOINT" = "https://cosmos-a-riff-in-react.documents.azure.com:443/"
    "COSMOS_DATABASE" = "cosmosdb-a-riff-in-react"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "FUNCTIONS_WORKER_RUNTIME" = "node"
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
    "AzureWebJobsFeatureFlags" = "EnableWorkerIndexing"
}

# Try using Azure CLI
Write-Host "🔄 Attempting with Azure CLI..." -ForegroundColor Cyan
$settingsString = ($appSettings.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "

try {
    az functionapp config appsettings set `
        --name $functionAppName `
        --resource-group $resourceGroup `
        --settings $settingsString
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure CLI configuration successful!" -ForegroundColor Green
    } else {
        throw "Azure CLI failed"
    }
} catch {
    Write-Host "❌ Azure CLI failed, trying PowerShell..." -ForegroundColor Yellow
    
    # Try using Azure PowerShell
    try {
        Import-Module Az.Websites -Force
        
        # Convert hashtable to proper format for PowerShell
        $psSettings = @{}
        foreach ($setting in $appSettings.GetEnumerator()) {
            $psSettings[$setting.Key] = $setting.Value
        }
        
        Set-AzWebApp -ResourceGroupName $resourceGroup -Name $functionAppName -AppSettings $psSettings
        Write-Host "✅ PowerShell configuration successful!" -ForegroundColor Green
    } catch {
        Write-Host "❌ PowerShell also failed. Manual configuration needed." -ForegroundColor Red
        Write-Host "📋 Here are the settings to configure manually in Azure Portal:" -ForegroundColor Cyan
        
        foreach ($setting in $appSettings.GetEnumerator()) {
            Write-Host "   $($setting.Key) = $($setting.Value)" -ForegroundColor White
        }
        
        Write-Host "🌐 Azure Portal URL: https://portal.azure.com/#@813307d1-6d39-4c75-8a38-2e34128203bc/resource/subscriptions/e428c28c-07fc-4295-84b8-c499842619b7/resourceGroups/riffinreact-rg/providers/Microsoft.Web/sites/func-a-riff-in-react/appServices" -ForegroundColor Cyan
    }
}

Write-Host "🎯 Next steps:" -ForegroundColor Green
Write-Host "  1. Verify Function App settings are configured" -ForegroundColor White
Write-Host "  2. Deploy the Function App code" -ForegroundColor White
Write-Host "  3. Test the API endpoints" -ForegroundColor White
Write-Host "  4. Update frontend to use new API URL" -ForegroundColor White

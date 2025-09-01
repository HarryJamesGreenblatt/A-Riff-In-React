# Deploy Azure Function App for A-Riff-In-React
# This script creates the missing Function App that handles your API endpoints

$resourceGroup = "riffinreact-rg"
$functionAppName = "func-a-riff-in-react"
$storageAccountName = "stariffint"  # Valid storage name: lowercase, no hyphens
$appServicePlan = "asp-a-riff-in-react"

Write-Host "🚀 Deploying Function App for A-Riff-In-React..." -ForegroundColor Green

# Check if storage account exists, create if not
Write-Host "📦 Checking storage account..." -ForegroundColor Yellow
$storageExists = az storage account check-name --name $storageAccountName --query "nameAvailable" --output tsv 2>$null
if ($storageExists -eq "false") {
    Write-Host "✅ Storage account $storageAccountName already exists" -ForegroundColor Green
} else {
    Write-Host "🔧 Creating storage account $storageAccountName..." -ForegroundColor Yellow
    az storage account create `
        --name $storageAccountName `
        --location westus `
        --resource-group $resourceGroup `
        --sku Standard_LRS `
        --kind StorageV2 2>$null
}

# Create Function App
Write-Host "🔧 Creating Function App $functionAppName..." -ForegroundColor Yellow
az functionapp create `
    --resource-group $resourceGroup `
    --plan $appServicePlan `
    --runtime node `
    --runtime-version 20 `
    --functions-version 4 `
    --name $functionAppName `
    --storage-account $storageAccountName `
    --os-type Linux

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App created successfully!" -ForegroundColor Green
    
    # Configure Function App settings
    Write-Host "⚙️ Configuring Function App settings..." -ForegroundColor Yellow
    
    $sqlConnectionString = "Server=tcp:sequitur-sql-server.database.windows.net,1433;Initial Catalog=riff-react-db;Persist Security Info=False;User ID=sqladmin;Password=TempPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    
    az functionapp config appsettings set `
        --name $functionAppName `
        --resource-group $resourceGroup `
        --settings `
            "SQL_CONNECTION_STRING=$sqlConnectionString" `
            "WEBSITE_NODE_DEFAULT_VERSION=~20" `
            "FUNCTIONS_WORKER_RUNTIME=node" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Function App settings configured!" -ForegroundColor Green
        Write-Host "🌐 Function App URL: https://$functionAppName.azurewebsites.net" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Failed to create Function App" -ForegroundColor Red
}

Write-Host "🎉 Deployment script completed!" -ForegroundColor Green

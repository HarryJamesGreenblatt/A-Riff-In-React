# Azure Resource Provider Registration Script
# This script registers all required Azure Resource Providers for A-Riff-In-React

Write-Host "🚀 Registering Azure Resource Providers for A-Riff-In-React..." -ForegroundColor Green

# Define required providers
$providers = @(
    'Microsoft.App',
    'Microsoft.ContainerRegistry', 
    'Microsoft.OperationalInsights',
    'Microsoft.DocumentDB',
    'Microsoft.ManagedIdentity',
    'Microsoft.KeyVault',
    'Microsoft.Insights',
    'Microsoft.Web',
    'Microsoft.Resources',
    'Microsoft.Sql',
    'Microsoft.Storage'
)

# Check if Azure CLI is installed
try {
    $azVersion = az version --output tsv --query '\"azure-cli\"'
    Write-Host "✅ Azure CLI found: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --query name -o tsv 2>$null
    if ($account) {
        Write-Host "✅ Logged in to Azure account: $account" -ForegroundColor Green
    } else {
        Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Register each provider
$registeredCount = 0
$alreadyRegisteredCount = 0

foreach ($provider in $providers) {
    Write-Host "📦 Checking provider: $provider" -ForegroundColor Yellow
    
    # Check current registration state
    $state = az provider show --namespace $provider --query registrationState -o tsv 2>$null
    
    if ($state -eq "Registered") {
        Write-Host "   ✅ Already registered" -ForegroundColor Green
        $alreadyRegisteredCount++
    } else {
        Write-Host "   🔄 Registering..." -ForegroundColor Yellow
        
        try {
            az provider register --namespace $provider --wait
            Write-Host "   ✅ Successfully registered" -ForegroundColor Green
            $registeredCount++
        } catch {
            Write-Host "   ❌ Failed to register $provider" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📊 Registration Summary:" -ForegroundColor Cyan
Write-Host "   • Newly registered: $registeredCount" -ForegroundColor Green
Write-Host "   • Already registered: $alreadyRegisteredCount" -ForegroundColor Blue
Write-Host "   • Total providers: $($providers.Count)" -ForegroundColor White

if ($registeredCount -gt 0) {
    Write-Host ""
    Write-Host "⏳ Note: Provider registration can take up to 15 minutes to fully propagate." -ForegroundColor Yellow
    Write-Host "   If you encounter deployment issues, wait a few minutes and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Provider registration complete! Ready to deploy A-Riff-In-React." -ForegroundColor Green

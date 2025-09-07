#!/bin/bash
# Azure Resource Provider Registration Script for A-Riff-In-React
# This script registers all required Azure Resource Providers

set -e

echo "🚀 Registering Azure Resource Providers for A-Riff-In-React..."

# Define required providers
declare -a providers=(
    "Microsoft.App"
    "Microsoft.ContainerRegistry" 
    "Microsoft.OperationalInsights"
    "Microsoft.DocumentDB"
    "Microsoft.ManagedIdentity"
    "Microsoft.KeyVault"
    "Microsoft.Insights"
    "Microsoft.Web"
    "Microsoft.Resources"
    "Microsoft.Sql"
    "Microsoft.Storage"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not found. Please install Azure CLI first.${NC}"
    exit 1
fi

az_version=$(az version --query '"azure-cli"' -o tsv)
echo -e "${GREEN}✅ Azure CLI found: $az_version${NC}"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

account=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logged in to Azure account: $account${NC}"

# Register each provider
registered_count=0
already_registered_count=0

for provider in "${providers[@]}"; do
    echo -e "${YELLOW}📦 Checking provider: $provider${NC}"
    
    # Check current registration state
    state=$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || echo "NotFound")
    
    if [ "$state" == "Registered" ]; then
        echo -e "   ${GREEN}✅ Already registered${NC}"
        ((already_registered_count++))
    else
        echo -e "   ${YELLOW}🔄 Registering...${NC}"
        
        if az provider register --namespace "$provider" --wait; then
            echo -e "   ${GREEN}✅ Successfully registered${NC}"
            ((registered_count++))
        else
            echo -e "   ${RED}❌ Failed to register $provider${NC}"
        fi
    fi
done

echo ""
echo -e "${CYAN}📊 Registration Summary:${NC}"
echo -e "   ${GREEN}• Newly registered: $registered_count${NC}"
echo -e "   ${BLUE}• Already registered: $already_registered_count${NC}"
echo -e "   ${WHITE}• Total providers: ${#providers[@]}${NC}"

if [ $registered_count -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⏳ Note: Provider registration can take up to 15 minutes to fully propagate.${NC}"
    echo -e "${YELLOW}   If you encounter deployment issues, wait a few minutes and try again.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Provider registration complete! Ready to deploy A-Riff-In-React.${NC}"

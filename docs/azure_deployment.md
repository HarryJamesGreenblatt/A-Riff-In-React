# Azure Deployment Guide

This guide explains how to deploy **A Riff In React** to Azure, following best practices for App Service, Azure SQL, Cosmos DB, Key Vault, and Application Insights.

> _Deployment strategies and rationale are adapted from [A Fugue In Flask: azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_

## Prerequisites
- Azure account
- Azure CLI installed
- Resource group created

## 1. Provision Azure Resources
- Azure App Service (for frontend hosting)
- Azure SQL Database (for structured data)
- Azure Cosmos DB (for flexible data)
- Azure Key Vault (for secrets)
- Application Insights (for monitoring)

## 2. Configure Environment Variables
- Store connection strings and secrets in Key Vault
- Reference them in App Service configuration

## 3. Deploy the App
- Use GitHub Actions or Azure CLI for CI/CD
- See `docs/github_actions_azure.md` for pipeline setup

## 4. Monitor and Maintain
- Use Application Insights for telemetry
- Regularly update dependencies and review security

---

> _For detailed deployment steps and troubleshooting, see the Flask template’s [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_

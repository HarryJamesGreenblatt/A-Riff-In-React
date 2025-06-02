# GitHub Actions: Azure CI/CD Pipeline

This document provides a sample GitHub Actions workflow for deploying **A Riff In React** to Azure, following the patterns established in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask).

## Overview
- Build and test the React app
- Deploy to Azure App Service
- Integrate with Azure SQL, Cosmos DB, and Key Vault

## Sample Workflow
See `.github/workflows/azure.yml` for a ready-to-use pipeline.

```yaml
name: Azure CI/CD
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./dist
```

---

> _For a detailed pipeline and secrets management, see the Flask template’s [github_actions_azure.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/github_actions_azure.md)_

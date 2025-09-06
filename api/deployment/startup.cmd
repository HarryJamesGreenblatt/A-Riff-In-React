@echo off
echo Setting up deployment environment

echo Installing production dependencies...
call npm ci --only=production

echo Building TypeScript application...
call npm run build

echo Deployment setup complete!

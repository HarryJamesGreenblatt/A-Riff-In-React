# Test Registration Flow
# This script tests the registration endpoint to verify it's working

$API_URL = "https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing Registration Flow" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "? Health check passed!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $healthResponse | ConvertTo-Json
} catch {
    Write-Host "? Health check failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: Register New User (with phone)
Write-Host "2. Testing Registration Endpoint..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testEmail = "test-$timestamp@example.com"
$testName = "Test User $timestamp"
# generate a pseudo phone number for test
$numberPart = ([string]($timestamp % 1000000)).PadLeft(6,'0')
$testPhone = "+1555" + $numberPart

$registerBody = @{
    email = $testEmail
    password = "TestPass123!"
    name = $testName
    phone = $testPhone
} | ConvertTo-Json

Write-Host "Attempting to register user: $testEmail with phone $testPhone" -ForegroundColor Gray
Write-Host ""

try {
    $registerResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    
    Write-Host "? Registration successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created user:" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Name: $($registerResponse.user.name)" -ForegroundColor Gray
    Write-Host "  Role: $($registerResponse.user.role)" -ForegroundColor Gray
    Write-Host "  Phone: $($registerResponse.user.phone)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 3: Login with Created User
    Write-Host "3. Testing Login with Created User..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $testEmail
        password = "TestPass123!"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        
        Write-Host "? Login successful!" -ForegroundColor Green
        Write-Host "JWT Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Test 4: Access Protected Route
        Write-Host "4. Testing Protected Route (/api/auth/me)..." -ForegroundColor Yellow
        
        $headers = @{
            Authorization = "Bearer $($loginResponse.token)"
        }
        
        try {
            $meResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/me" -Method Get -Headers $headers
            
            Write-Host "? Protected route access successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "User details:" -ForegroundColor Gray
            $meResponse.user | ConvertTo-Json
            Write-Host "Phone from /api/auth/me: $($meResponse.user.phone)" -ForegroundColor Gray
            
        } catch {
            Write-Host "? Protected route access failed" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
        
    } catch {
        Write-Host "? Login failed" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 500) {
        Write-Host "? Registration failed with Internal Server Error" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. Database permissions not set" -ForegroundColor Yellow
        Write-Host "  2. Users table doesn't exist" -ForegroundColor Yellow
        Write-Host "  3. SQL connection failed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See: docs/Auth/SQL-SETUP-STEP-BY-STEP.md" -ForegroundColor Cyan
        
    } elseif ($statusCode -eq 409) {
        Write-Host "??  Email already registered (this is expected if testing multiple times)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To test again, delete the user or use a different email" -ForegroundColor Yellow
        
    } else {
        Write-Host "? Registration failed with status: $statusCode" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

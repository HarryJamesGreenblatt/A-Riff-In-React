#!/bin/bash

# Test Registration Flow
# This script tests the registration endpoint to verify it's working

API_URL="https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io"

echo "========================================="
echo "Testing Registration Flow"
echo "========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo "? Health check passed!"
  echo "Response: $BODY"
else
  echo "? Health check failed with status: $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

echo ""
echo "========================================="
echo ""

# Test 2: Register New User
echo "2. Testing Registration Endpoint..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@example.com"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"TestPass123!\",\"name\":\"Test User ${TIMESTAMP}\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

echo "Status Code: $HTTP_CODE"
echo "Response: $BODY"
echo ""

if [ "$HTTP_CODE" == "201" ]; then
  echo "? Registration successful!"
  echo ""
  
  # Extract user ID from response (requires jq)
  if command -v jq &> /dev/null; then
    USER_EMAIL=$(echo "$BODY" | jq -r '.user.email')
    USER_NAME=$(echo "$BODY" | jq -r '.user.name')
    echo "Created user:"
    echo "  Email: $USER_EMAIL"
    echo "  Name: $USER_NAME"
  fi
  
  echo ""
  echo "========================================="
  echo ""
  
  # Test 3: Login with Created User
  echo "3. Testing Login with Created User..."
  LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"TestPass123!\"}")
  
  HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
  BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
  
  echo "Status Code: $HTTP_CODE"
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "? Login successful!"
    
    if command -v jq &> /dev/null; then
      TOKEN=$(echo "$BODY" | jq -r '.token')
      echo "JWT Token: ${TOKEN:0:50}..."
      
      echo ""
      echo "========================================="
      echo ""
      
      # Test 4: Access Protected Route
      echo "4. Testing Protected Route (/api/auth/me)..."
      ME_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X GET "${API_URL}/api/auth/me" \
        -H "Authorization: Bearer ${TOKEN}")
      
      HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
      BODY=$(echo "$ME_RESPONSE" | sed '$d')
      
      echo "Status Code: $HTTP_CODE"
      echo "Response: $BODY"
      
      if [ "$HTTP_CODE" == "200" ]; then
        echo "? Protected route access successful!"
      else
        echo "? Protected route access failed"
      fi
    fi
  else
    echo "? Login failed"
    echo "Response: $BODY"
  fi
  
elif [ "$HTTP_CODE" == "500" ]; then
  echo "? Registration failed with Internal Server Error"
  echo ""
  echo "Possible causes:"
  echo "  1. Database permissions not set"
  echo "  2. Users table doesn't exist"
  echo "  3. SQL connection failed"
  echo ""
  echo "See: docs/Auth/SQL-SETUP-STEP-BY-STEP.md"
  
elif [ "$HTTP_CODE" == "409" ]; then
  echo "??  Email already registered (this is expected if testing multiple times)"
  echo ""
  echo "To test again, delete the user or use a different email"
  
else
  echo "? Registration failed with status: $HTTP_CODE"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="

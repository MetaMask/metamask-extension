#!/bin/bash

# Playwright CI Setup Script
# Run this once to set up Playwright for local testing

set -e

echo "🎭 Setting up Playwright for MetaMask Extension..."

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Check Playwright version
echo "📦 Checking Playwright version..."
PLAYWRIGHT_VERSION=$(npx playwright --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
echo "   Playwright version: $PLAYWRIGHT_VERSION"

# Check what browsers are already installed
echo "🔍 Checking installed browsers..."
npx playwright install --dry-run

# Install only missing browsers
echo "⬇️  Installing missing browsers..."
npx playwright install chromium firefox

# Verify installation
echo "✅ Verifying installation..."
if npx playwright test --list > /dev/null 2>&1; then
    echo "   ✅ Playwright configuration is valid"
else
    echo "   ❌ Playwright configuration has issues"
    npx playwright test --list
    exit 1
fi

# Test basic functionality
echo "🧪 Running configuration test..."
npx playwright test --project=chrome-global --list | head -5

echo ""
echo "🎉 Playwright setup complete!"
echo ""
echo "📚 Available commands:"
echo "   yarn test:e2e:pw:chrome    # Run Chrome tests"
echo "   yarn test:e2e:pw:firefox   # Run Firefox tests"
echo "   yarn test:e2e:pw:all       # Run all tests"
echo "   yarn test:e2e:pw:report    # View reports"
echo ""
echo "🔧 Local testing:"
echo "   npx playwright test --ui               # Interactive mode"
echo "   npx playwright test --headed           # See browser"
echo "   npx playwright test --project=chrome-global --headed"
echo ""
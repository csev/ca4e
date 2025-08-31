#!/bin/bash

echo "🧪 Running E6B Wind Triangle Calculator Tests with Deno"
echo "========================================================"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first:"
    echo "   curl -fsSL https://deno.land/x/install/install.sh | sh"
    exit 1
fi

# Run the tests
deno test --allow-all test-runner.js 
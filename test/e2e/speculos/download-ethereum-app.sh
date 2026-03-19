#!/bin/bash
set -e

# Download Ethereum app from Ledger releases
VERSION="1.9.19"
APP_URL="https://github.com/LedgerHQ/app-ethereum/releases/download/${VERSION}/ethereum_nanosp.elf"

mkdir -p apps
echo "Downloading Ethereum app v${VERSION}..."

if [ ! -f "apps/ethereum.elf" ]; then
    curl -L -o apps/ethereum.elf "$APP_URL"
    chmod +x apps/ethereum.elf
    echo "Downloaded: apps/ethereum.elf"
else
    echo "Ethereum app already exists"
fi

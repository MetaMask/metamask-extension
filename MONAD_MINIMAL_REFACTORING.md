# Monad Minimal Wallet Refactoring

## Overview
This branch reduces MetaMask extension to a minimal wallet with only essential features:
- **Core**: Send/Receive transactions
- **Swap**: Token swapping functionality
- **Networks**: Monad Testnet & Mainnet only
- **Removed**: Perps, Staking, Telemetry, and all unnecessary features

## Scope of Changes

### ✂️ REMOVAL - Dependencies to Remove

#### 1. **Perps/Trading Controllers**
- `@metamask/perps-controller` (line 430 in package.json)
- All perps-related UI components in `ui/pages/`
- Perp market data services

#### 2. **Telemetry & Analytics**
- `@segment/analytics-node` (line 476)
- Segment integration code in `app/scripts/lib/setupSegment.js`
- MetaMetrics events tracking
- Sentry integration (keep minimal error logging only)
- `SEGMENT_WRITE_KEY` environment variable
- All telemetry configuration files

#### 3. **Staking Controllers**
- Staking-related UI pages and components
- Staking rewards tracking

#### 4. **Multi-Chain & Extra Networks**
- Bitcoin Snap (`@metamask/bitcoin-wallet-snap`)
- Solana Snap (`@metamask/solana-wallet-snap`)
- Tron Snap (`@metamask/tron-wallet-snap`)
- All bridge controllers
- Cross-chain transaction support
- Network controller support for non-Monad chains

#### 5. **Other Unnecessary Features**
- Ramps/On-ramps controller (`@metamask/ramps-controller`)
- Smart transactions
- Institutional wallet snap
- Multichain account service
- Profile sync
- Subscription controller
- Geolocation controller
- Shield/security features (PPOM validator)

#### 6. **DEV Dependencies for Removed Features**
- Test dapps for Bitcoin, Solana, Tron
- Multi-chain related test utilities
- BitCoin regtest, Java Tron utils

### ✅ KEEP - Essential Dependencies

#### Controllers
- `@metamask/transaction-controller` - Send/Receive
- `@metamask/accounts-controller` - Account management
- `@metamask/address-book-controller` - Address book
- `@metamask/network-controller` - Network management (Monad only)
- `@metamask/keyring-controller` - Key management
- `@metamask/permission-controller` - Permissions
- `@metamask/signature-controller` - Message signing
- `@metamask/assets-controller` - Token/NFT management
- `@metamask/gas-fee-controller` - Gas estimation
- `@metamask/eth-json-rpc-middleware` - JSON-RPC
- Snap controllers (basic framework only)

#### UI/UX
- React, Redux ecosystem
- Material UI
- Tailwind CSS
- Storybook (optional)

#### Swaps
- All swap-related logic and APIs
- Swap UI components and pages
- Integration with swap providers (0x, etc.)

#### Core Infrastructure
- Base controllers
- Storage
- State management
- Message signing
- Encryption/Cryptography

### 📝 Files to Modify

#### 1. **package.json**
- Remove perps, staking, bitcoin, solana, tron, ramps dependencies
- Remove telemetry dependencies
- Remove unused dev dependencies
- Update scripts to remove multi-chain build targets
- Keep swap-related packages

#### 2. **app/scripts/metamask-controller.js**
- Remove perps controller initialization
- Remove telemetry/segment setup
- Remove staking controller
- Remove bridge/multichain controllers
- Remove geolocation controller
- Simplify network controller initialization (Monad only)

#### 3. **app/scripts/background.js**
- Remove telemetry listeners
- Simplify port message handlers (remove perps, staking, etc.)
- Keep transaction, send, receive handlers

#### 4. **ui/pages/**
- Remove `/perps` directory
- Remove `/staking` directory
- Remove `/institutional` directory
- Keep: `/send`, `/receive`, `/swap`, `/account`, `/settings`

#### 5. **ui/components/**
- Remove perps-related components
- Remove staking-related components
- Keep swap, send, receive, account components

#### 6. **.metamaskrc.dist**
- Remove `SEGMENT_WRITE_KEY`, `SENTRY_DSN*`
- Keep `INFURA_PROJECT_ID`, `PASSWORD` (for testing)
- Add Monad RPC endpoint if needed

#### 7. **Development Build Config**
- Remove build types: beta, flask, experimental
- Keep only main build type
- Simplify build scripts
- Remove multi-chain build targets

#### 8. **app/scripts/constants/**
- Update network list to only Monad Testnet & Mainnet
- Remove chain configurations for other networks

### 🔄 Architecture Changes

#### Network Management
```
Before: Supports 100+ networks
After:  Hardcoded to Monad Testnet (chain ID: 10143) and Monad Mainnet (chain ID: 10143)
```

#### Transaction Flow (Simplified)
```
Send Transaction
  → Validate (Monad network only)
  → Sign (Keyring)
  → Submit to Monad RPC
  → Track status
  → Notify user
```

#### Swap Flow (Keep existing)
```
User requests quote
  ��� Fetch from swap provider
  → Display rate
  → Sign & submit
  → Track swap transaction
```

### 🧪 Testing Strategy

1. **Unit Tests**: Update tests to remove perps/staking/telemetry references
2. **Integration Tests**: Test send/receive/swap flows only
3. **E2E Tests**: Test Monad network operations
4. **Manual Testing**: Verify extension loads without errors

### 📦 Bundle Size Impact

**Expected Reductions:**
- Remove perps: ~500KB
- Remove staking: ~300KB
- Remove telemetry: ~200KB
- Remove multi-chain: ~800KB
- Remove unnecessary snaps: ~1.5MB

**Total Expected Reduction:** ~3-4MB (assuming ~15MB original)

### ⚠️ Breaking Changes

- Extension only works with Monad Testnet & Mainnet
- No cross-chain support
- No perps/staking features
- No advanced institutional features
- All external analytics disabled

### 🎯 Migration Guide

For users switching from standard MetaMask:
1. New accounts must be added to Monad
2. No automatic network switching
3. Existing seed phrases work but show only Monad accounts
4. All external integrations removed

## Implementation Steps

1. ✅ Create branch: `feature/monad-minimal`
2. ⬜ Update package.json
3. ⬜ Remove controller initializations
4. ⬜ Remove UI pages/components
5. ⬜ Update network configurations
6. ⬜ Clean up build configuration
7. ⬜ Update tests
8. ⬜ Build and test


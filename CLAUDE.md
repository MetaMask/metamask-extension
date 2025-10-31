# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building

- `yarn start` - Start development build with file watching (MV3, no LavaMoat)
- `yarn start:mv2` - Start development build for Firefox (MV2)
- `yarn start:flask` - Start development build with Flask features (experimental)
- `yarn dist` - Production build for Chromium browsers (MV3)
- `yarn dist:mv2` - Production build for Firefox (MV2)
- `yarn build:test` - Create test build for e2e testing

### Testing

- `yarn test` - Run linting and unit tests
- `yarn test:unit` - Run Jest unit tests only
- `yarn test:e2e:chrome` - Run e2e tests in Chrome
- `yarn test:e2e:firefox` - Run e2e tests in Firefox
- `yarn test:e2e:single <test-file>` - Run single e2e test

### Linting & Code Quality

- `yarn lint` - Run all linting (ESLint, TypeScript, Stylelint, Prettier)
- `yarn lint:fix` - Auto-fix linting issues where possible
- `yarn lint:tsc` - TypeScript compiler checks
- `yarn lint:eslint` - ESLint checks only

### Development Tools

- `yarn storybook` - Start Storybook for component development
- `yarn dapp` - Start test dapp server for testing MetaMask integration

## High-Level Architecture

### Core Structure

- **`app/`** - Browser extension core functionality
  - `scripts/background.js` - Main background script (service worker in MV3)
  - `scripts/contentscript.js` - Content script injected into web pages
  - `scripts/inpage.js` - Provider API injected into page context
  - `scripts/metamask-controller.js` - Main controller orchestrating all functionality
  - `scripts/controllers/` - Individual controllers (preferences, transactions, etc.)

- **`ui/`** - React-based user interface
  - `pages/` - Main UI screens (home, settings, confirmations, etc.)
  - `components/` - Reusable React components
  - `hooks/` - Custom React hooks
  - `ducks/` - Redux state management (actions, reducers, selectors)
  - `selectors/` - Redux state selectors

- **`shared/`** - Code shared between background and UI
  - `constants/` - Application constants and enums
  - `lib/` - Utility libraries and helpers
  - `modules/` - Business logic modules
  - `types/` - TypeScript type definitions

### Build System

- Uses Gulp + Browserify build system (not Webpack by default)
- Support for multiple build types: main, beta, flask (experimental features)
- LavaMoat security for production builds (disabled in development for speed)
- Supports both Manifest V2 (Firefox) and V3 (Chromium) extension formats

### Key Controllers

- **MetaMaskController** - Main orchestrator controller
- **PreferencesController** - User preferences and settings
- **TransactionController** - Transaction lifecycle and history
- **NetworkController** - Network/chain management
- **AssetsController** - Token and NFT management
- **PermissionController** - dApp permissions and connections
- **SnapController** - MetaMask Snaps (plugins) management

### Testing Strategy

- **Unit tests**: Jest for individual component/function testing
- **Integration tests**: Testing controller interactions
- **E2E tests**: Selenium WebDriver tests simulating user workflows
- **Storybook**: Component documentation and visual testing

### Configuration

- **`.metamaskrc`** - Local development configuration (copy from `.metamaskrc.dist`)
- **`builds.yml`** - Build configuration for different build types and features
- **Environment variables** required: `INFURA_PROJECT_ID` for blockchain RPC access

### Extension Architecture Flow

1. **Inpage Script** - Provides `window.ethereum` API to web pages
2. **Content Script** - Bridges communication between page and extension
3. **Background Script** - Handles blockchain interactions, state management
4. **UI Scripts** - React interface for user interactions (popup, full screen)

### MetaMask Snaps Integration

- Supports extending MetaMask functionality via Snaps (plugins)
- Snaps run in isolated execution environments
- Account management snaps, signing snaps, and notification snaps supported

### Multi-chain Support

- Built-in support for Ethereum and EVM-compatible networks
- Bitcoin wallet snap integration
- Solana wallet snap integration
- Account abstraction and delegation features

# Provider Injection System

## Overview
The provider injection system safely injects the Web3 provider into web pages, enabling dApp interactions with MetaMask.

## Key Files and Directories
- `shared/modules/provider-injection.js` - Core provider injection logic
- `app/scripts/` - Extension script injection
- `shared/modules/bridge-utils/` - Communication bridge utilities
- `app/manifest/` - Extension manifest configurations
- `shared/constants/provider.ts` - Provider constants and types

## Provider Injection Rules

### URL Validation (`shared/modules/provider-injection.js`)
```javascript
function checkURLForProviderInjection(url: URL): boolean
```
- Validates URL suffixes (blocks .xml, .pdf, etc.)
- Checks against blocked domains
- Ensures secure injection contexts

### Document Validation (`shared/modules/provider-injection.js`)
```javascript
function checkDocumentForProviderInjection(): boolean
```
- Verifies document readiness
- Checks for existing providers
- Validates injection context

## Injection Process

### 1. Pre-injection Checks (`shared/modules/provider-injection.js`)
- URL validation
- Document state verification
- Security context validation

### 2. Provider Setup (`app/scripts/metamask-inpage.js`)
- Creates isolated provider instance
- Configures provider capabilities
- Sets up secure communication channels

### 3. Injection (`app/scripts/contentscript.js`)
- Injects provider into window object
- Sets up event listeners
- Initializes communication bridge

## Communication Bridge (`shared/modules/bridge-utils/`)
- `bridge.js` - Core bridge implementation
- `messages.js` - Message type definitions
- `stream.js` - Stream management utilities

### Message Flow
```
Web Page <-> Content Script <-> Background Script
     ↑          ↑                ↑
     └──────────┴────────────────┘
         Bridge Communication
```

## Error Handling
Located in `shared/modules/provider-injection.js`:
- Injection failures
- Communication errors
- Security violations
- Provider conflicts

## Development Guidelines

### Adding New Provider Capabilities
1. Update provider interface (`shared/modules/provider-injection.js`)
2. Implement bridge handlers (`shared/modules/bridge-utils/`)
3. Add security checks (`app/scripts/metamask-inpage.js`)
4. Update tests

### Testing Requirements
Located in `test/e2e/`:
- `provider-injection.spec.js` - Injection tests
- `dapp-interactions.spec.js` - dApp interaction tests
- `provider-api.spec.js` - Provider API tests

## Related Documentation
- See `docs/SECURITY.md` for security model
- See `docs/STATE_MANAGEMENT.md` for state handling
- Extension manifest documentation in `app/manifest/README.md`
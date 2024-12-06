# MetaMask Extension Architecture

## Overview

MetaMask is a browser extension wallet that enables interaction with Ethereum and other blockchain networks. The architecture is designed to handle secure key management, transaction signing, dApp interactions, and network communication.

## System Components

### 1. Extension Architecture

The extension follows a multi-process architecture:

- **Background Process** (`app/scripts/background.ts`)
  - Core wallet functionality
  - State management (see `STATE_MANAGEMENT.md`)
  - Cryptographic operations
  - Network communication
  - Transaction processing (see `TRANSACTION_ARCHITECTURE.md`)

- **UI Process** (`ui/`)
  - React/Redux based interface
  - User interaction handling
  - State visualization
  - Transaction confirmations (see `CONFIRMATION_SYSTEM.md`)
  - Responsive design system

- **Content Scripts** (`app/scripts/contentscript/`)
  - Web3 provider injection (see `PROVIDER_INJECTION.md`)
  - dApp communication bridge
  - Security boundary enforcement
  - Message validation system

### 2. Core Services

#### Security Services (`app/scripts/lib/security/`)
- Vault management
- Key encryption
- Permission system
- See `SECURITY.md` for details

#### Network Services (`app/scripts/controllers/network/`)
- Multi-chain support
- RPC management
- Network switching
- Connection monitoring

#### Transaction Services (`app/scripts/controllers/transactions/`)
- Transaction queue management
- Gas estimation
- Nonce tracking
- See `TRANSACTION_ARCHITECTURE.md`

#### State Services (`app/scripts/controllers/state/`)
- State persistence
- State synchronization
- Migration handling
- See `STATE_MANAGEMENT.md`

### 3. Build System

See `BUILD_SYSTEM.md` for detailed information about:
- Build pipeline
- Development workflow
- Production deployment
- Testing infrastructure

## Data Flow Architecture

### 1. External Interactions
```
dApp → Content Script → Background Process → Network
 ↑          ↑                    ↑              ↑
 └──────────┴────────────────────┴──────────────┘
            Security Boundary
```

### 2. Internal Communication
```
UI Layer → Controllers → Storage Layer
   ↑           ↑             ↑
   └───────────┴─────────────┘
      Event System (pub/sub)
```

### 3. State Flow
```
User Action → Action Creator → Reducer → State Update → UI Update
     ↑             ↑             ↑           ↑            ↑
     └─────────────┴─────────────┴───────────┴────────────┘
                  Redux Data Flow
```

## Security Architecture

### 1. Security Boundaries
- Process isolation
- Content Security Policy
- Permission system
- See `SECURITY.md`

### 2. Data Protection
- Encrypted storage
- Secure communication
- Key management
- See `SECURITY.md`

## Development Guidelines

### 1. Code Organization
- Feature-based directory structure
- Clear separation of concerns
- Type safety with TypeScript
- Comprehensive testing

### 2. State Management
- Centralized state management
- Atomic updates
- Migration support
- See `STATE_MANAGEMENT.md`

### 3. Security Practices
- Input validation
- Output encoding
- Error handling
- See `SECURITY.md`

## Testing Architecture

### 1. Test Types
- Unit tests (`test/unit/`)
- Integration tests (`test/integration/`)
- E2E tests (`test/e2e/`)
- Security tests (`test/security/`)

### 2. Test Infrastructure
- Jest for unit testing
- Playwright for E2E
- Custom security test suite
- See `BUILD_SYSTEM.md`

## Performance Considerations

### 1. Runtime Performance
- Lazy loading
- Code splitting
- Memory management
- Background processing

### 2. Build Performance
- Efficient bundling
- Development mode optimizations
- See `BUILD_SYSTEM.md`

## Related Documentation

- `BUILD_SYSTEM.md`: Build pipeline and tooling
- `CONFIRMATION_SYSTEM.md`: Transaction confirmation flow
- `PROVIDER_INJECTION.md`: Web3 provider system
- `SECURITY.md`: Security architecture
- `STATE_MANAGEMENT.md`: State management system
- `TRANSACTION_ARCHITECTURE.md`: Transaction processing

## Directory Structure

```
app/
├── scripts/           # Core extension code
│   ├── background/    # Background process
│   ├── contentscript/ # Content scripts
│   └── controllers/   # Core controllers
├── ui/               # User interface
│   ├── components/   # React components
│   ├── pages/        # UI pages
│   └── store/        # Redux store
└── shared/           # Shared utilities
    ├── constants/    # Constants and types
    └── modules/      # Shared modules
```
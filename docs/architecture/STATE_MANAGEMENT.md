# State Management

## Overview
MetaMask's state management system handles wallet data, user preferences, and application state across multiple contexts while maintaining security and consistency.

## Key Files and Directories
- `app/scripts/controllers/` - Core state controllers
- `app/scripts/lib/storage/` - Storage implementations
- `shared/modules/state/` - State utilities
- `ui/store/` - UI state management
- `shared/constants/app-state.ts` - State constants

## State Architecture

### Core State Types

#### 1. Persistent State (`app/scripts/lib/storage/`)
- `wallet-storage.ts` - Wallet data storage
- `preferences-storage.ts` - User preferences
- `network-storage.ts` - Network configurations

#### 2. Transient State (`app/scripts/controllers/`)
- `transactions/` - Active transaction state
- `network/` - Network status
- `app/` - Application state

#### 3. Secure State (`app/scripts/lib/security/`)
- `vault.ts` - Private key storage
- `sensitive-data.ts` - Protected data
- `auth-state.ts` - Authentication state

## State Flow

### Component Interaction
```
UI Layer (React/Redux) <-> Controllers <-> Storage Layer
            ↑                   ↑              ↑
            └───────────────────┴──────────────┘
                 Event System (pub/sub)
```

### State Management Components

#### 1. Background State (`app/scripts/controllers/`)
- `state.ts` - Core state controller
- `persistence.ts` - State persistence
- `updates.ts` - State update handling

#### 2. UI State (`ui/store/`)
- `actions/` - State actions
- `reducers/` - State reducers
- `selectors/` - State selectors

#### 3. Shared State (`shared/modules/state/`)
- `shared-state.ts` - Cross-context state
- `state-sync.ts` - State synchronization
- `state-migration.ts` - State version management

## State Operations

### 1. State Updates
Located in `app/scripts/controllers/state/`:
```typescript
interface StateUpdate {
  type: StateUpdateType;
  payload: unknown;
  origin: StateOrigin;
}
```

### 2. State Persistence (`app/scripts/lib/storage/`)
- `persistence-manager.ts` - Storage management
- `state-migrations/` - Version migrations
- `backup.ts` - State backup utilities

### 3. State Synchronization (`shared/modules/state/`)
- Cross-context synchronization
- Real-time updates
- Conflict resolution

## Development Guidelines

### 1. State Management Best Practices
- Use controllers for business logic
- Implement proper validation
- Handle state transitions atomically
- Maintain data consistency

### 2. Adding New State
1. Define types in `shared/constants/`
2. Create controller in `app/scripts/controllers/`
3. Add storage handling if needed
4. Update UI components

### 3. State Migration
Located in `app/scripts/lib/storage/migrations/`:
- Version management
- Data transformation
- Backward compatibility

## Testing Requirements

### State Tests
Located in `test/state/`:
- `controllers.test.js` - Controller tests
- `persistence.test.js` - Storage tests
- `migration.test.js` - Migration tests
- `sync.test.js` - Synchronization tests

### Integration Tests
- Controller interaction tests
- UI state integration
- Storage system tests

## Related Documentation
- See `docs/SECURITY.md` for state security
- See `docs/PROVIDER_INJECTION.md` for provider state
- State migration guide in `app/scripts/lib/storage/migrations/README.md`
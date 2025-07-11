# Backend Platform Integration

This document describes the integration of WebSocketService and AccountActivityService from the `@metamask/backend-platform` package into the MetaMask extension.

## Overview

The backend platform services provide real-time connectivity and account activity monitoring capabilities:

- **WebSocketService**: Manages WebSocket connections with automatic reconnection, circuit breaker patterns, and JSON-RPC 2.0 compliance
- **AccountActivityService**: Monitors account transactions and balance changes using the WebSocketService as transport

## Architecture

### Service Initialization

Both services are initialized using MetaMask's modular controller initialization pattern:

1. **Messenger Configuration** (`controller-init/messengers/backend-platform/`)
   - `websocket-service-messenger.ts`: Configures restricted messenger for WebSocketService
   - `account-activity-service-messenger.ts`: Configures restricted messenger for AccountActivityService

2. **Initialization Functions** (`controller-init/backend-platform/`)
   - `websocket-service-init.ts`: Initializes WebSocketService with configuration
   - `account-activity-service-init.ts`: Initializes AccountActivityService with WebSocketService dependency

3. **Controller Registration** (`controller-init/`)
   - Added to `controller-list.ts` type definitions
   - Added to `messengers/index.ts` messenger configuration
   - Added to `utils.ts` initialization types
   - Registered in `metamask-controller.js`

### Service Configuration

#### WebSocketService Configuration

```typescript
const controller = new WebSocketService({
  messenger: controllerMessenger,
  url: process.env.BACKEND_WEBSOCKET_URL || 'wss://api.metamask.io/websocket',
  timeout: 10000,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  requestTimeout: 30000,
  policy: {
    maxFailures: 5,
    failureThreshold: 60000,
    resetTimeout: 300000,
  },
});
```

#### AccountActivityService Configuration

```typescript
const controller = new AccountActivityService({
  messenger: controllerMessenger,
  webSocketService: getController('WebSocketService'),
  maxAddressesPerSubscription: 50,
  maxActiveSubscriptions: 20,
  processAllTransactions: true,
});
```

## Key Features

### WebSocketService

- **JSON-RPC 2.0 Compliance**: Full support for request/response and notification patterns
- **Automatic Reconnection**: Exponential backoff with configurable limits
- **Circuit Breaker**: Service degradation protection with failure thresholds
- **Message Correlation**: Request/response matching with timeout handling
- **Subscription Management**: High-level subscription API with cleanup

### AccountActivityService

- **Account Monitoring**: Subscribe to transaction and balance updates for multiple addresses
- **Unified Message Format**: Uses `TransactionWithKeyringBalanceUpdate` from keyring-api
- **Automatic Resubscription**: Handles reconnection scenarios
- **Event Publishing**: Publishes events through messenger system

## Integration Points

### Controller Access

Services are accessible through the MetaMask controller:

```javascript
// In MetamaskController
this.webSocketService = controllersByName.WebSocketService;
this.accountActivityService = controllersByName.AccountActivityService;
```

### Event Handling

Services publish events through the messenger system:

```typescript
// AccountActivityService events
'AccountActivityService:accountSubscribed'
'AccountActivityService:accountUnsubscribed'
'AccountActivityService:transactionUpdated'
'AccountActivityService:balanceUpdated'
'AccountActivityService:subscriptionError'
```

### Transaction Controller Integration

The PendingTransactionTracker can consume AccountActivityService events for external transaction status updates:

```typescript
this.#messenger.subscribe(
  'AccountActivityService:transactionUpdated',
  (tx: Transaction) => this.#handleAccountActivityTransactionUpdate(tx),
);
```

## Environment Variables

- `BACKEND_WEBSOCKET_URL`: WebSocket endpoint URL (defaults to 'wss://api.metamask.io/websocket')

## Testing

Each component includes comprehensive test coverage:

- Unit tests for messenger configurations
- Integration tests for initialization functions
- Mock implementations for service dependencies

## Usage Examples

### Subscribing to Account Activity

```typescript
await accountActivityService.subscribeAccounts({
  addresses: ['0x1234...', '0x5678...'],
});
```

### WebSocket Communication

```typescript
// Send a request
const response = await webSocketService.sendRequest({
  method: 'get_balance',
  params: { address: '0x1234...' }
});

// Subscribe to notifications
const subscription = await webSocketService.subscribe({
  method: 'account_activity',
  params: { address: '0x1234...' },
  onNotification: (notification) => {
    console.log('Activity update:', notification.params);
  }
});
```

## Migration Notes

This integration replaces the previous WebSocketService from `@metamask/snaps-controllers` with the new backend-platform implementation, providing enhanced functionality and better integration with MetaMask's account management system.
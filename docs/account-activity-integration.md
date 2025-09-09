# AccountActivity Service Integration in MetaMask Extension

## Overview

The MetaMask extension integrates with the `@metamask/backend-platform` package to provide real-time account activity monitoring through WebSocket connections. This document outlines the extension-specific integration details.

> 📖 **For comprehensive service documentation, see the core package docs:**
> - [**WebSocketService Documentation**](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/websocket-service.md)
> - [**AccountActivityService Documentation**](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/account-activity-service.md)
> - [**Integration Guide**](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/integration-guide.md)

## Extension-Specific Implementation

### Service Initialization Locations

#### WebSocketService
- **Init File**: `app/scripts/controller-init/backend-platform/backend-websocket-service-init.ts`
- **Messenger**: `app/scripts/controller-init/messengers/backend-platform/websocket-service-messenger.ts`

#### AccountActivityService
- **Init File**: `app/scripts/controller-init/backend-platform/account-activity-service-init.ts`
- **Messenger**: `app/scripts/controller-init/messengers/backend-platform/account-activity-service-messenger.ts`

### Extension Configuration

#### WebSocketService Configuration
```typescript
// Extension-optimized configuration
{
  url: process.env.METAMASK_WEBSOCKET_URL || 'wss://api.metamask.io/ws',
  timeout: 15000,          // 15s connection timeout
  reconnectDelay: 1000,    // 1s initial reconnect delay
  maxReconnectDelay: 30000, // 30s max reconnect delay
  requestTimeout: 20000,   // 20s request timeout
}
```

#### AccountActivityService Configuration
```typescript
// Using defaults from @metamask/backend-platform
// Future extensions can be added when backend-platform supports:
{
  maxConcurrentSubscriptions: 50,           // Conservative limit for extension
  subscriptionNamespace: 'account-activity.v1', // Default namespace
}
```

## Integration with Extension Controllers

### TokenBalancesController Integration

The extension's `TokenBalancesController` subscribes to real-time balance updates:

```javascript
// In metamask-controller.js
const tokenBalancesMessenger = this.controllerMessenger.getRestricted({
  name: 'TokenBalancesController',
  allowedEvents: [
    // ... other events
    'AccountActivityService:balanceUpdated', // Real-time balance updates
  ],
});
```

### Messenger Configuration

```typescript
// Account Activity Service messenger allows these actions/events:
allowedActions: [
  'AccountsController:getAccountByAddress',
  'AccountsController:getSelectedAccount',
  'TokenBalancesController:updateChainPollingConfigs',
  'TokenBalancesController:getDefaultPollingInterval',
  'AccountActivityService:subscribeAccounts',
  'AccountActivityService:unsubscribeAccounts',
],
allowedEvents: [
  'AccountsController:accountAdded',
  'AccountsController:accountRemoved',
  'AccountsController:selectedAccountChange',
  'BackendWebSocketService:connectionStateChanged',
  'AccountActivityService:accountSubscribed',
  'AccountActivityService:accountUnsubscribed',
  'AccountActivityService:transactionUpdated',
  'AccountActivityService:balanceUpdated',
  'AccountActivityService:subscriptionError',
]
```

## Runtime Behavior

### Initialization Flow
1. **BackendWebSocketService** initialized first during controller setup
2. **AccountActivityService** initialized with WebSocketService dependency
3. **TokenBalancesController** subscribes to AccountActivityService events
4. Services automatically handle account selection changes

### Account Management
- **Automatic Subscription**: Service subscribes to currently selected account on startup
- **Selection Changes**: Automatically switches subscriptions when user changes account
- **Account Lifecycle**: Handles account addition/removal events from AccountsController

### Fallback Coordination
- **WebSocket Connected**: Sets 10-minute backup polling intervals
- **WebSocket Disconnected**: Falls back to default TokenBalancesController polling
- **Real-time Updates**: Balance updates bypass polling when WebSocket is active

## Environment Configuration

### Development Environment
```bash
# .env files or environment variables
METAMASK_WEBSOCKET_URL=wss://gateway.dev-api.cx.metamask.io/v1
```

### Production Environment
Uses default production URL: `wss://api.metamask.io/ws`

## Monitoring Extension Integration

### Connection Health
Monitor WebSocket connection state in extension:
```typescript
// Available through controllerMessenger events
'BackendWebSocketService:connectionStateChanged'
```

### Account Activity Events
Track real-time updates:
```typescript
'AccountActivityService:transactionUpdated'    // New transactions
'AccountActivityService:balanceUpdated'        // Balance changes
'AccountActivityService:subscriptionError'     // Subscription issues
```

### Performance Metrics
Monitor these extension-specific metrics:
- Account subscription/unsubscription frequency
- Balance update processing latency
- WebSocket reconnection patterns
- Integration with TokenBalancesController polling

## Extension-Specific Features

### Background/Foreground Optimization
- Services remain active in background for real-time updates
- Automatic reconnection when extension wakes up
- Coordination with existing polling mechanisms

### Memory Management
- Automatic cleanup on extension shutdown
- Proper subscription management to prevent leaks
- Integration with extension's controller lifecycle

### Error Handling
- Extension-specific error reporting
- Graceful degradation to polling when WebSocket fails
- User-friendly connection status indicators

## Recent Implementation Improvements

### Simplified Architecture
- ✅ Removed unnecessary account caching
- ✅ Streamlined subscription management
- ✅ Optimized for extension environment constraints

### Enhanced Reliability
- ✅ Request timeout triggers automatic reconnection
- ✅ Improved bulk subscription error handling
- ✅ Better resource cleanup and management

### Performance Optimizations
- ✅ Direct callback routing for messages
- ✅ Controlled concurrency for subscriptions
- ✅ Minimal state duplication between services

## Testing Extension Integration

### Unit Tests
Located in:
- `app/scripts/controller-init/messengers/backend-platform/account-activity-service-messenger.test.ts`
- Integration test coverage for messenger configuration

### Integration Testing
- End-to-end account subscription flow
- TokenBalancesController coordination
- WebSocket connection lifecycle testing

## Future Considerations

### Extension-Specific Enhancements
- **Background/Foreground**: Consider pausing subscriptions when extension is inactive
- **Performance Metrics**: Add MetaMetrics integration for service monitoring
- **User Preferences**: Allow users to disable real-time features if needed
- **Error Recovery**: Implement user-visible connection status and retry controls

### Configuration Management
- Move WebSocket URL to PreferencesController if user configuration is needed
- Add extension settings for connection timeout preferences
- Allow per-network WebSocket endpoint configuration

## Troubleshooting Extension Issues

### Common Extension-Specific Issues

#### Service Not Starting
- **Check**: Controller initialization order in `controller-list.ts`
- **Check**: Messenger configuration in messenger files
- **Solution**: Ensure BackendWebSocketService is initialized before AccountActivityService

#### Missing Real-time Updates
- **Check**: TokenBalancesController event subscriptions
- **Check**: Account selection in AccountsController
- **Solution**: Verify messenger event allowlist includes required events

#### High Resource Usage
- **Check**: Subscription cleanup on account changes
- **Check**: WebSocket connection pooling
- **Solution**: Monitor subscription count and connection state

### Debug Extension Integration
```javascript
// Check service status in extension console
console.log('WebSocket State:', controllerStore.BackendWebSocketService.getConnectionState());
console.log('Subscribed Account:', controllerStore.AccountActivityService.getCurrentSubscribedAccount());

// Monitor events
controllerMessenger.subscribe('AccountActivityService:balanceUpdated', console.log);
```

## Related Documentation

- 📖 [Core WebSocketService Docs](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/websocket-service.md)
- 📖 [Core AccountActivityService Docs](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/account-activity-service.md)
- 📖 [Integration Guide](https://github.com/MetaMask/core/blob/main/packages/backend-platform/docs/integration-guide.md)
- 📖 [Controller Guidelines](https://github.com/MetaMask/core/blob/main/docs/controller-guidelines.md)

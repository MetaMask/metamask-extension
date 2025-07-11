# Account Activity Service - Subscribing All Accounts

The MetaMask extension includes an Account Activity Service that allows you to subscribe to real-time transaction and balance updates for accounts. This document explains how to subscribe all your accounts to this service.

## Overview

The Account Activity Service monitors account transactions and balance changes across multiple networks, providing real-time updates through WebSocket connections. This is useful for:

- Real-time transaction status updates
- Balance change notifications
- Account activity monitoring
- External transaction detection

## API Methods

### `subscribeAllAccountsToActivityService()`

Subscribes all internal accounts to the account activity service.

```javascript
// Subscribe all accounts
const result = await window.ethereum.request({
  method: 'subscribeAllAccountsToActivityService'
});

console.log('Subscription result:', result);
// Output: { success: true, subscribedAccounts: ['0x123...', '0x456...'] }
```

### `unsubscribeAllAccountsFromActivityService()`

Unsubscribes all internal accounts from the account activity service.

```javascript
// Unsubscribe all accounts
const result = await window.ethereum.request({
  method: 'unsubscribeAllAccountsFromActivityService'
});

console.log('Unsubscription result:', result);
// Output: { success: true, unsubscribedAccounts: ['0x123...', '0x456...'] }
```

### `getAccountActivitySubscriptions()`

Gets the current account activity service subscriptions.

```javascript
// Get current subscriptions
const subscriptions = await window.ethereum.request({
  method: 'getAccountActivitySubscriptions'
});

console.log('Current subscriptions:', subscriptions);
// Output: { '0x123...': 'sub_id_1', '0x456...': 'sub_id_2' }
```

## Usage Examples

### Complete Setup Example

```javascript
async function setupAccountActivityMonitoring() {
  try {
    // Subscribe all accounts to activity service
    const subscribeResult = await window.ethereum.request({
      method: 'subscribeAllAccountsToActivityService'
    });

    console.log(`Successfully subscribed ${subscribeResult.subscribedAccounts.length} accounts`);

    // Check current subscriptions
    const subscriptions = await window.ethereum.request({
      method: 'getAccountActivitySubscriptions'
    });

    console.log('Active subscriptions:', subscriptions);

    return subscriptions;
  } catch (error) {
    console.error('Failed to setup account activity monitoring:', error);
    throw error;
  }
}

// Call the setup function
setupAccountActivityMonitoring();
```

### Event Handling

The Account Activity Service publishes events through the messenger system:

```javascript
// Listen for account activity events (this would be in extension context)
messenger.subscribe(
  'AccountActivityService:transactionUpdated',
  (transaction) => {
    console.log('Transaction updated:', transaction);
  }
);

messenger.subscribe(
  'AccountActivityService:balanceUpdated',
  (balanceUpdate) => {
    console.log('Balance updated:', balanceUpdate);
  }
);

messenger.subscribe(
  'AccountActivityService:subscriptionError',
  (error) => {
    console.error('Subscription error:', error);
  }
);
```

## Automatic Account Subscription

New accounts are automatically subscribed to the activity service when they are added to MetaMask. This ensures that all accounts receive real-time updates without manual intervention.

## Configuration

The Account Activity Service is configured with the following default limits:

- **maxAddressesPerSubscription**: 50 addresses per subscription
- **maxActiveSubscriptions**: 20 active subscriptions
- **processAllTransactions**: true (processes all transaction types)

## Error Handling

All methods include comprehensive error handling:

```javascript
try {
  await window.ethereum.request({
    method: 'subscribeAllAccountsToActivityService'
  });
} catch (error) {
  if (error.message.includes('Cannot subscribe to more than')) {
    console.error('Subscription limit reached');
  } else if (error.message.includes('WebSocket connection failed')) {
    console.error('Network connectivity issue');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Troubleshooting

### Common Issues

1. **No accounts found**: Ensure MetaMask is unlocked and has accounts
2. **Subscription limit reached**: The service has limits on concurrent subscriptions
3. **WebSocket connection issues**: Check network connectivity
4. **Permission errors**: Ensure the dApp has proper permissions

### Debugging

Check the browser console for detailed logs when using these methods. The service logs successful operations and detailed error information.

## Technical Details

- Uses WebSocket connections for real-time updates
- Supports automatic reconnection with exponential backoff
- Includes circuit breaker pattern for service degradation protection
- Publishes events through MetaMask's messenger system
- Integrates with the PendingTransactionTracker for external transaction status updates

## Architecture

The account subscription functionality is organized as follows:

### Core Implementation
- **`account-activity-service-init.ts`**: Contains the core subscription logic
  - `subscribeAllAccountsToActivityService()`
  - `unsubscribeAllAccountsFromActivityService()`
  - `getAccountActivitySubscriptions()`
  - `subscribeAccountToActivityService()` (for auto-subscribing new accounts)

### Integration
- **`metamask-controller.js`**: Exposes the functions through the API and sets up event listeners
- Uses the `AccountsController:listAccounts` messenger action to get account data
- Automatically subscribes new accounts when they're added via the `accountAdded` event

### Benefits of This Architecture
- **Separation of Concerns**: Account activity logic is isolated in its dedicated init file
- **Reusability**: Functions can be imported and used by other parts of the extension
- **Maintainability**: Easier to test and modify the subscription logic independently
- **Consistency**: Uses the proper controller messaging system throughout
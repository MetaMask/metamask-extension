# Stop Network Polling When MetaMask UI Is Closed

## Feature Description

This test scenario ensures that after closing the MetaMask UI, the extension stops sending network requests, including `etherscan`, `eth_call`, `eth_getBalance`, `eth_blockNumber`, and `eth_getBlockByNumber`, to Infura or any other RPC provider. This behavior is crucial for preventing unnecessary network traffic and ensuring privacy and efficiency.

## Test Scenario

### Background

- **Given** the user has installed the MetaMask extension
- **And** the user has onboarded successfully

### Scenario: Verify no network requests are made after MetaMask UI is closed

1. **Given** the user opens the MetaMask extension
2. **And** the user navigates to the service worker dev console's network tab
3. **When** the user observes "etherscan", "eth_call", "eth_getBalance", "eth_blockNumber" and "eth_getBlockByNumber" network requests
4. **And** then closes the MetaMask UI while leaves the dev console open
5. **Then** no new network requests should occur after the UI is closed

## Expected Outcome

After the MetaMask UI is closed, the extension should cease all network polling activities, including but not limited to `etherscan`, `eth_call`, `eth_getBalance`, `eth_blockNumber`, and `eth_getBlockByNumber` requests. This ensures that the extension does not perform any unnecessary network requests when it is not in use by the user.

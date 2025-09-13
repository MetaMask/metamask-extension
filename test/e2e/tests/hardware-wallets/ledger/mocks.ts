import { MockttpServer } from 'mockttp';
import {
  mockEthDaiTrade,
  mockExternalAccountsAPI,
  mockIcon,
  mockPriceAPIs,
  mockSuggestedGasFees,
  mockSwapAggregatorMetadata,
  mockSwapFeatureFlags,
  mockSwapGasPrices,
  mockSwapNetworkInfo,
  mockSwapTokens,
  mockSwapTopAssets,
  mockTransactionRequestsBase,
} from '../swap-mocks';

export async function mockLedgerTransactionRequests(mockServer: MockttpServer) {
  await mockTransactionRequestsBase(mockServer);

  await mockEthDaiTrade(mockServer);

  // Mock essential swap API endpoints
  await mockSwapNetworkInfo(mockServer);
  // Using mockSwapTokens instead of complex mockTokenInfo
  // Removed mockTransactionFees - not needed for basic swap test

  // Mock critical swap API endpoints that are missing
  await mockSwapFeatureFlags(mockServer);
  await mockSwapTokens(mockServer);
  await mockSwapTopAssets(mockServer);
  await mockSwapAggregatorMetadata(mockServer);
  await mockSwapGasPrices(mockServer);
  await mockSuggestedGasFees(mockServer);
  // Using mockLedgerEthDaiTrade instead of complex mockSwapTrades

  // Mock price APIs - critical for swap functionality
  await mockPriceAPIs(mockServer);

  // Mock Ledger iframe bridge - minimal mock to prevent catch-all redirect
  await mockLedgerIframeBridge(mockServer);

  // Note: Smart Transaction APIs are NOT mocked because Smart Transactions are disabled in the test

  // Mock external accounts API for activity list - CRITICAL for activity list display
  await mockExternalAccountsAPI(mockServer);

  await mockIcon(mockServer);
}

// Minimal Ledger iframe bridge mock - just to prevent catch-all redirect
// The actual signing is handled by FakeLedgerBridge in background.js
async function mockLedgerIframeBridge(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://metamask.github.io/ledger-iframe-bridge/9.0.1/')
    .thenCallback(() => ({
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ledger Bridge Mock</title>
        </head>
        <body>
          <script>
            // Minimal mock - just signal ready
            // Actual transaction signing is handled by FakeLedgerBridge
            window.parent.postMessage({
              type: 'ledger-bridge-ready'
            }, '*');
          </script>
        </body>
        </html>
      `,
    }));
}

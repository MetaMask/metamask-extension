import { DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS } from '../../flask/solana-wallet-standard/testHelpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';
import { mockSendRedesignFeatureFlag } from './common';

describe('Send Solana', function () {
  it('it should be possible to send SOL', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        mockGetTransactionSuccess: true,
        withCustomMocks: mockSendRedesignFeatureFlag,
      },
      async (driver) => {
        await driver.clickElement('[data-testid="coin-overview-send"]');

        await driver.clickElement(
          '[data-testid="token-asset-solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-SOL"]',
        );

        await driver.fill(
          'input[placeholder="Enter or paste a valid address"]',
          '7bYxDqvLQ4P8p6Vq3J6t1wczVwLk9h4Q9M5rjqvN1sVg',
        );

        await driver.fill('input[placeholder="0"]', '1');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement(
          '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]',
        );

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);
      },
    );
  });
});

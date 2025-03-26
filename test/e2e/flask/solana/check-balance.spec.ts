import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  // Temporarily disabled on Mar 26, 2025 because of CI failures.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('0', 'SOL');
      },
    );
  });
  // Temporarily disabled on Mar 26, 2025 because of CI failures.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('$0.00', 'USD');
      },
    );
  });
  // Temporarily disabled on Mar 26, 2025 because of CI failures.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('For a non 0 balance account - USD balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('$9,921.00', 'USD');
      },
    );
  });
  // Temporarily disabled on Mar 26, 2025 because of CI failures.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('For a non 0 balance account - SOL balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('50', 'SOL');
      },
    );
  });
});

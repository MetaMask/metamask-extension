import { Suite } from 'mocha';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { buildSolanaTestSpecificMock } from './common-solana';
import { buildSolanaPositiveBalanceFixture } from './unified-solana-assets';

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({ balance: 0 }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '0 SOL',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({ balance: 0 }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '$0',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: buildSolanaPositiveBalanceFixture({
          showNativeTokenAsMainBalanceDisabled: true,
        }),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '$5,643.50',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withFixtures(
      {
        fixtures: buildSolanaPositiveBalanceFixture(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '50 SOL',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
});

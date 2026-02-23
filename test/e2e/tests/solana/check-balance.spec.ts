import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { buildSolanaTestSpecificMock } from './common-solana';
import { switchToNetworkFromNetworkSelect } from 'test/e2e/page-objects/flows/network.flow';

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainNetworkControllerOnSolana()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockZeroBalance: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        // TODO: Use fixtures V2 with Solana network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '0 SOL' });
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainNetworkControllerOnSolana()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockZeroBalance: true,
        }),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        // TODO: Use fixtures V2 with Solana network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '$0' });
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainNetworkControllerOnSolana()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockZeroBalance: false,
        }),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        // TODO: Use fixtures V2 with Solana network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '$5,643.50' });
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainNetworkControllerOnSolana()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        // TODO: Use fixtures V2 with Solana network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '50 SOL' });
      },
    );
  });
});

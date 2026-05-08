import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
import { TronNode } from '../../seeder/tron/node';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
} from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';
import { TRON_ACCOUNT_ADDRESS } from './mocks/common-tron';

describe('Check balance', function (this: Suite) {
  this.timeout(180_000);

  it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await selectTronNetwork(driver);

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const nonEvmHomePage = new NonEvmHomepage(driver);
        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX * $0.29469 = ~$1.79
        // Total Fiat = TRX $1.79, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $10.18
        await nonEvmHomePage.checkPageIsLoaded({ amount: '$10.18' });
      },
    );
  });

  it('For a non 0 balance account - TRX balance', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await selectTronNetwork(driver);

        const nonEvmHomePage = new NonEvmHomepage(driver);
        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
      },
    );
  });

  it('Freezes TRX balance v2 and exposes it on /wallet/getaccount', async function () {
    const node = new TronNode();
    await node.start({
      initialBalances: { [TRON_ACCOUNT_ADDRESS]: 50_000_000 },
      stakedTrxBalances: { [TRON_ACCOUNT_ADDRESS]: '20000000' },
    });
    try {
      const response = await fetch(`${node.baseUrl}/wallet/getaccount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: TRON_ACCOUNT_ADDRESS, visible: true }),
      });
      const account = (await response.json()) as {
        frozenV2?: { amount?: number; type?: string }[];
      };
      const energyEntry = account.frozenV2?.find((e) => e.type === 'ENERGY');
      assert.strictEqual(energyEntry?.amount, 20_000_000);
      assert.strictEqual(
        node.getStakedTrxBalance(TRON_ACCOUNT_ADDRESS),
        '20000000',
      );
      assert.strictEqual(node.getStakedTrxBalance('TUnknownAddress'), '0');
    } finally {
      await node.quit();
    }
  });
});

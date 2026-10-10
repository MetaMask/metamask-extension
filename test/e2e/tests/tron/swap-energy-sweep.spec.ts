/* eslint-disable @typescript-eslint/naming-convention */
/**
 * TEMPORARY diagnostic spec — not intended to be merged.
 *
 * Sweeps the Energy burn a Tron swap is quoted for and reports the CTA label
 * and network fee row for each value. The point is to separate two candidate
 * causes of the "Insufficient funds" CTA: a genuine shortfall, where the Energy
 * priced in TRX exceeds the balance and the CTA should only block once the fee
 * passes the balance; or a missing normalized fee, where
 * `getTotalNetworkFee(...).normalizedAmount` is undefined so
 * `isNetworkFeeUnavailable` blocks the CTA no matter how small the fee is.
 * A CTA that blocks even at a trivial Energy burn points at the second.
 */
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { mockTronSwapApis } from './mocks/common-tron';

const MOCK_TRON_BLOCK_TIMESTAMP_NOW_PLUS_A_YEAR = Date.now() + 31536000000;

/**
 * Energy is billed at 420 SUN each, so the TRX cost is `energy * 0.00042`.
 * The fixture account holds ~106 TRX, so the shortfall boundary sits a little
 * above 250,000 Energy.
 */
const ENERGY_SWEEP = [
  { energy: 1_000, approxTrx: '0.42' },
  { energy: 50_000, approxTrx: '21' },
  { energy: 150_000, approxTrx: '63' },
  { energy: 400_000, approxTrx: '168' },
];

/**
 * Builds a mock set that quotes a specific Energy burn.
 *
 * @param energyUsed - The Energy the constant-contract call reports.
 * @returns A mock registration function for `withFixtures`.
 */
function mockTronSwapApisWithEnergy(energyUsed: number) {
  return async (mockServer: Mockttp) => {
    const estimate = await mockServer
      .forPost(/\/wallet\/triggerconstantcontract($|\?)/u)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          result: { result: true },
          energy_used: energyUsed,
          energy_penalty: 0,
          constant_result: [
            '0000000000000000000000000000000000000000000000000000000000000001',
          ],
          transaction: {
            ret: [{}],
            visible: false,
            txID: 'mock_trigger_constant_txid',
            raw_data: {
              contract: [],
              ref_block_bytes: 'f733',
              ref_block_hash: 'ff89d72ddc1ce1ea',
              expiration: MOCK_TRON_BLOCK_TIMESTAMP_NOW_PLUS_A_YEAR,
              timestamp: MOCK_TRON_BLOCK_TIMESTAMP_NOW_PLUS_A_YEAR,
            },
            raw_data_hex: '',
          },
        },
      }));

    return [estimate, ...(await mockTronSwapApis(mockServer))];
  };
}

/**
 * Reads the CTA label and network fee row.
 *
 * @param driver - The webdriver instance.
 * @returns The observed CTA and fee text.
 */
async function readCtaAndFee(driver: Driver) {
  return (await driver.executeScript(
    `const b = document.querySelector('[data-testid="bridge-cta-button"]');
     const f = document.querySelector('[data-testid="network-fees"]');
     return {
       cta: b ? b.textContent : 'CTA NOT FOUND',
       fee: f ? f.textContent : 'FEE ROW NOT RENDERED',
       disabled: b ? b.disabled : null,
     };`,
  )) as { cta: string; fee: string; disabled: boolean | null };
}

describe('Tron swap CTA across Energy burn sizes', function () {
  ENERGY_SWEEP.forEach(({ energy, approxTrx }) => {
    it(`reports CTA at ${energy} Energy (~${approxTrx} TRX of a ~106 TRX balance)`, async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockTronSwapApisWithEnergy(energy),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          await switchToNetworkFromNetworkSelect(driver, 'Tron');

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('106.07');

          const swapPage = new SwapPage(driver);
          await homePage.clickOnSwapButton();
          await swapPage.createSwap({
            amount: 1,
            swapTo: 'USDT',
            swapFrom: 'TRX',
            network: 'Tron',
          });

          await driver.delay(8000);
          const { cta, fee, disabled } = await readCtaAndFee(driver);
          console.log(
            `\n>>> ENERGY=${energy} (~${approxTrx} TRX) | CTA="${cta}" disabled=${disabled} | FEE="${fee}"\n`,
          );
        },
      );
    });
  });
});

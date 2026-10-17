/* eslint-disable @typescript-eslint/naming-convention */
/**
 * TEMPORARY diagnostic spec — not intended to be merged.
 *
 * Reproduces the "Insufficient funds" CTA on the Tron swap/bridge flow when the
 * account has (almost) no Energy, so the snap prices the whole Energy burn in
 * TRX. The shipped `swap.spec.ts` mocks `energy_used: 1000`, which yields a
 * ~0.42 TRX fee and therefore cannot surface this condition.
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
 * Energy a real Tron router/bridge contract call consumes. The fixture account
 * has `EnergyLimit: 189`, so effectively all of this is a shortfall that gets
 * priced in TRX at `getEnergyFee` (420 SUN each).
 */
const REALISTIC_ENERGY_USED = 400_000;

/**
 * Registers a `triggerconstantcontract` mock returning a realistic energy
 * estimate. Registered before `mockTronSwapApis` so mockttp matches it first.
 *
 * @param mockServer - The mockttp server for the test.
 */
async function mockTronSwapApisHighEnergy(mockServer: Mockttp) {
  const highEnergyEstimate = await mockServer
    .forPost(/\/wallet\/triggerconstantcontract($|\?)/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        result: { result: true },
        energy_used: REALISTIC_ENERGY_USED,
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

  return [highEnergyEstimate, ...(await mockTronSwapApis(mockServer))];
}

/**
 * Logs whatever the CTA/fee row settled on, so the run reports the observed
 * state instead of only pass/fail.
 *
 * @param driver - The webdriver instance.
 */
async function reportCtaAndFee(driver: Driver) {
  const ctaText = await driver.executeScript(
    `const b = document.querySelector('[data-testid="bridge-cta-button"]');
     return b ? b.textContent : 'CTA NOT FOUND';`,
  );
  const feeText = await driver.executeScript(
    `const f = document.querySelector('[data-testid="network-fees"]');
     return f ? f.textContent : 'NETWORK FEE ROW NOT RENDERED';`,
  );
  console.log(`\n>>> OBSERVED CTA:         ${ctaText}`);
  console.log(`>>> OBSERVED NETWORK FEE: ${feeText}\n`);
  return { ctaText, feeText };
}

describe('Swap on Tron with no Energy', function () {
  it('reports CTA + fee when the Energy burn is realistic (1 TRX in)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisHighEnergy,
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
        await reportCtaAndFee(driver);
      },
    );
  });

  it('reports CTA + fee when swapping most of the TRX balance (80 TRX in)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisHighEnergy,
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
          amount: 80,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        await driver.delay(8000);
        await reportCtaAndFee(driver);
      },
    );
  });
});

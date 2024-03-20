import { By } from "selenium-webdriver";
import FixtureBuilder from "../../fixture-builder";
import { unlockWallet, withFixtures, openActionMenuAndStartSendFlow, createDappTransaction } from "../../helpers";
import { Driver } from '../../webdriver/driver';
import { RECIPIENT_ADDRESS_MOCK } from "./simulation-details.mocks";

const walletAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const prepareSendTransactionSimulation = async (driver: Driver, recipientAddress: string, quantity: string) => {
  await openActionMenuAndStartSendFlow(driver);
  await driver.fill('[data-testid="ens-input"]', recipientAddress);
  await driver.fill('.unit-input__input', quantity);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
};

async function withFixturesForSimulationDetails(
  { title }: { title?: string; },
  test: (driver: Driver) => Promise<void>
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title,
      dapp: true,
      ganacheOptions: {
        hardfork: 'london',
      },
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);
      await test(driver);
    }
  );
}

async function expectBalanceChange(driver: Driver, displayAmount: string, assetName: string) {
  await driver.findElement(By.xpath(`
      //div[@data-testid="simulation-details-balance-change-row" and contains(., '${displayAmount}') and contains(., '${assetName}')]
    `));
}

describe('Simulation Details', () => {
  it('displays native currency balance change', async function (this: Mocha.Context) {
    // TODO: Update Test when Multichain Send Flow is added
    if (process.env.MULTICHAIN) {
      return;
    }

    await withFixturesForSimulationDetails({ title: this.test?.fullTitle() }, async (driver) => {
      await prepareSendTransactionSimulation(driver, RECIPIENT_ADDRESS_MOCK, '0.001');
      await expectBalanceChange(driver, '- 0.001', 'ETH');
    });
  });

  it.only('displays native and token balance changes', async function (this: Mocha.Context) {
    await withFixturesForSimulationDetails({ title: this.test?.fullTitle() }, async (driver) => {
      // Swap ETH for DAI
      await createDappTransaction(driver, {
        "data": "0x5ae401dc0000000000000000000000000000000000000000000000000000000065fadb5f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000124b858183f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000228a77554072ee25bab4b7c04f357ec0922c219700000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000003045a473a85c22040000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000646b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "from": walletAddress,
        "maxFeePerGas": "0x0",
        "maxPriorityFeePerGas": "0x0",
        "to": "0x13f4ea83d0bd40e75c8222255bc855a974568dd4",
        "value": "0x38d7ea4c68000"
      });

      await driver.delay(100000000);
    });
  });
});

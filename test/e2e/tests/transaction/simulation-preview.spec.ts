import { By } from "selenium-webdriver";
import FixtureBuilder from "../../fixture-builder";
import { unlockWallet, withFixtures } from "../../helpers";
import { Driver } from '../../webdriver/driver';
import { MOCK_RECIPIENT_ADDRESS } from "./simulation-preview.mocks";
const { openActionMenuAndStartSendFlow } = require('../../helpers');

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

async function withFixturesForSimulationPreview(
  { title, paymaster }: { title?: string; paymaster?: string },
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
      //div[@data-testid="simulation-preview-balance-change-row" and contains(., '${displayAmount}') and contains(., '${assetName}')]
    `));
}

describe('Simulation Preview', () => {
  it('display native currency balance change', async function (this: Mocha.Context) {
      // TODO: Update Test when Multichain Send Flow is added
    if (process.env.MULTICHAIN) {
      return;
    }

    await withFixturesForSimulationPreview({ title: this.test?.fullTitle() }, async (driver) => {
      await prepareSendTransactionSimulation(driver, MOCK_RECIPIENT_ADDRESS, '0.001');
      await expectBalanceChange(driver, '- 0.001', 'ETH');
    });
  });
});

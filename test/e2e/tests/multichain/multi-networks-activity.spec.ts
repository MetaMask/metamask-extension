import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { Driver } from '../../webdriver/driver';

const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deployAndMintNFT(driver: Driver, contract: any) {
  await openDapp(driver, contract);
  await driver.findClickableElement('#deployButton');

  await driver.fill('#mintAmountInput', '5');
  await driver.clickElement({ text: 'Mint', tag: 'button' });

  await confirmTransaction(driver, 'Deposit');
  await viewActivity(driver, 'Deposit');
}

async function confirmTransaction(driver: Driver, actionText: string) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector({
    css: '.confirm-page-container-summary__action__name',
    text: actionText,
  });
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
}

async function viewActivity(driver: Driver, actionText: string) {
  await driver.clickElement('[data-testid="account-overview__activity-tab"]');
  await driver.waitForSelector({
    css: '[data-testid="activity-list-item-action"]',
    text: actionText,
  });
}

async function verifyActivityForCurrentNetwork(driver: Driver) {
  await driver.clickElement('[data-testid="sort-by-popover-toggle"]');
  await driver.clickElement({ text: 'Current Network' });
  await driver.findElement({ text: 'Deposit', tag: 'p' });
}

// Helper function to switch network
async function switchNetwork(driver: Driver, networkName: string) {
  await driver.clickElement('[data-testid="network-display"]');
  await driver.clickElement({ text: networkName, tag: 'p' });
}

async function processSendOperation(driver: Driver, address: string) {
  await driver.clickElement('[data-testid="eth-overview-send"]');
  await driver.fill(
    'input[placeholder="Enter public address (0x) or domain name"]',
    address,
  );
  await driver.fill('input[placeholder="0"]', '1');
  await driver.clickElement({ text: 'Continue', tag: 'button' });
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  await driver.findElement({ text: 'Send', tag: 'p' });
}

async function verifyActivityForAllNetworks(driver: Driver) {
  await driver.clickElement('[data-testid="sort-by-popover-toggle"]');
  await driver.clickElement({ text: 'All Networks' });
  await driver.findElement({ text: 'Deposit', tag: 'p' });
}

describe('Multichain activity feature', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('should display activity for current and all networks', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port: 8546,
              chainId: 1338,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        smartContract,
        title: this.test?.fullTitle(),
      },
      // @ts-expect-error TS2339: Property '_' does not exist on type 'Fixtures'.
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await unlockWallet(driver);

        await deployAndMintNFT(driver, contract);
        await verifyActivityForCurrentNetwork(driver);

        await switchNetwork(driver, 'Localhost 8546');
        await processSendOperation(driver, recipientAddress);

        await verifyActivityForAllNetworks(driver);
      },
    );
  });
});

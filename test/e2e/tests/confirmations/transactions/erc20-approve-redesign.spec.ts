/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  confirmApproveTransaction,
  mocked4BytesApprove,
  openDAppWithContract,
  TestSuiteArguments,
  toggleAdvancedDetails,
} from './shared';

const { withFixtures } = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.HST;

  describe('Submit an Approve transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await openDAppWithContract(
            driver,
            contractRegistry,
            smartContract,
            localNodes?.[0],
          );

          await importTST(driver);

          await createERC20ApproveTransaction(driver);

          await assertApproveDetails(driver);

          await confirmApproveTransaction(driver);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await openDAppWithContract(
            driver,
            contractRegistry,
            smartContract,
            localNodes?.[0],
          );

          await importTST(driver);

          await createERC20ApproveTransaction(driver);

          await assertApproveDetails(driver);

          await confirmApproveTransaction(driver);
        },
      );
    });
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesApprove(server)];
}

async function importTST(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement(
    '[data-testid="asset-list-control-bar-action-button"]',
  );
  await driver.clickElement('[data-testid="importTokens"]');

  await driver.waitForSelector({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });
  await driver.clickElement({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });

  await driver.clickElement(
    '[data-testid="test-import-tokens-drop-down-custom-import"]',
  );

  await driver.clickElement('[data-testid="select-network-item-0x539"]');

  await driver.fill(
    '[data-testid="import-tokens-modal-custom-address"]',
    '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
  );
  await driver.clickElementAndWaitToDisappear({
    css: '[data-testid="import-tokens-button-next"]',
    text: 'Next',
  });

  await driver.clickElement({
    css: '[data-testid="import-tokens-modal-import-button"]',
    text: 'Import',
  });
}

async function createERC20ApproveTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#approveTokens');
}

async function assertApproveDetails(driver: Driver) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Spending cap request',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'This site wants permission to withdraw your tokens',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Estimated changes',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Spending cap',
  });

  await driver.waitForSelector({
    css: 'p',
    text: '7',
  });

  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Spender',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Request from',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Interacting with',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Method',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Spending cap',
  });
}

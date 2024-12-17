import _ from 'lodash';
import * as path from 'path';
import { By } from 'selenium-webdriver';
import {
  DAPP_URL,
  largeDelayMs,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

import FixtureBuilder from '../../fixture-builder';

const OPTIONS = {
  dapp: true,
  dappPaths: [
    path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-multichain',
      'build',
    ),
  ],
  fixtures: new FixtureBuilder().withPopularNetworks().build(),
};

async function openDappAndConnectWallet(
  driver: Driver,
  extensionId: string,
): Promise<void> {
  await unlockWallet(driver);

  await openDapp(driver, undefined, DAPP_URL);

  await driver.fill('[placeholder="Enter extension ID"]', extensionId);
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.delay(largeDelayMs);
}

describe('Multichain API', function () {
  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_getSession` with no session created:', function () {
    it('should successfully receive empty session scopes', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          ...OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          await openDappAndConnectWallet(driver, extensionId);

          await driver.clickElement('#get-session-btn');

          const notificationList = await driver.findElements(
            '.notification-container',
          );
          const sessionResultSummary = notificationList[0];
          await sessionResultSummary.click();

          const completeRawResult = await driver.findElement(
            '#session-method-result-0',
          );
          const parsedResult = JSON.parse(await completeRawResult.getText());

          if (!_.isEmpty(parsedResult.sessionScopes)) {
            throw new Error('Should receive empty session scopes');
          }
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_getSession` with multiple sessions created:', function () {
    it('should successfully receive result that specifies its permitted session scopes for selected chains', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          ...OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          await openDappAndConnectWallet(driver, extensionId);
          const sessionScopes = ['eip155:1', 'eip155:59144', 'eip155:42161'];

          for (const scope of sessionScopes) {
            await driver.clickElement(`input[name="${scope}"]`);
          }

          await driver.clickElement('#create-session-btn');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.delay(largeDelayMs);

          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[1].click();

          await driver.delay(largeDelayMs);

          const networkListItems = await driver.findElements(
            '.multichain-network-list-item',
          );

          let foundEthereum = false;
          let foundLinea = false;
          let foundArbitrum = false;

          for (const item of networkListItems) {
            const text = await item.getText();
            const checkbox = await item.findElement(
              By.css('input[type="checkbox"]'),
            );
            const isChecked = await checkbox.isSelected();

            if (text.includes('Ethereum Mainnet') && isChecked) {
              foundEthereum = true;
            }

            if (text.includes('Linea Mainnet') && isChecked) {
              foundLinea = true;
            }

            if (text.includes('Arbitrum One') && isChecked) {
              foundArbitrum = true;
            }
          }

          if (!foundEthereum) {
            throw new Error('Expected Ethereum Mainnet to be selected');
          }

          if (!foundLinea) {
            throw new Error('Expected Linea Mainnet to be selected');
          }

          if (!foundArbitrum) {
            throw new Error('Expected Arbitrum One to be selected');
          }

          await driver.clickElement(
            '[data-testid="connect-more-chains-button"]',
          );

          await driver.clickElement({ text: 'Connect', tag: 'button' });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          await driver.clickElement('#get-session-btn');

          const notificationList = await driver.findElements(
            '.notification-container',
          );

          const sessionResultSummary = notificationList[0];
          await sessionResultSummary.click();

          const completeRawResult = await driver.findElement(
            '#session-method-result-0',
          );
          const parsedResult = JSON.parse(await completeRawResult.getText());

          for (const scope of sessionScopes) {
            if (!parsedResult.sessionScopes[scope]) {
              throw new Error(
                `Should receive result that specifies session scopes for ${scope}`,
              );
            }
          }
        },
      );
    });
  });
});

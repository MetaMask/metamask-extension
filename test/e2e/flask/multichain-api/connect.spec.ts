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

describe('Multichain API', function () {
  it('should connect the wallet to the multichain test dapp via `externally_connectable` and successfully create a session with the requested chains', async function () {
    await withFixtures(
      {
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
        title: this.test?.fullTitle(),
      },
      async ({ driver, extensionId }: { driver: Driver, extensionId: string }) => {
        await unlockWallet(driver);

        await openDapp(driver, undefined, DAPP_URL);

        await driver.fill(
          '[placeholder="Enter extension ID"]',
          extensionId,
        );
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.delay(largeDelayMs);

        await driver.clickElement('input[name="eip155:1"]');
        await driver.clickElement('input[name="eip155:10"]');
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
        let foundOP = false;

        for (const item of networkListItems) {
          const text = await item.getText();
          const checkbox = await item.findElement(
            By.css('input[type="checkbox"]'),
          );
          const isChecked = await checkbox.isSelected();

          if (text.includes('Ethereum Mainnet') && isChecked) {
            foundEthereum = true;
          }
          if (text.includes('OP Mainnet') && isChecked) {
            foundOP = true;
          }
        }

        if (!foundEthereum) {
          throw new Error('Expected Ethereum Mainnet to be selected');
        }
        if (!foundOP) {
          throw new Error('Expected OP Mainnet to be selected');
        }

        await driver.clickElement('[data-testid="connect-more-chains-button"]');

        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        const connectionLists = await driver.findElements('.connection-list');
        const connectedChains = await connectionLists[1].getText();
        if (!connectedChains.includes('eip155:1')) {
          throw new Error('Ethereum Mainnet not found in connected chains');
        }
        if (!connectedChains.includes('eip155:10')) {
          throw new Error('OP Mainnet not found in connected chains');
        }
      },
    );
  });
});

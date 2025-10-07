import { Mockttp } from 'mockttp';

import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockLookupSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { mockSendRedesignFeatureFlag } from './common';
import { CHAIN_IDS } from '../../../../shared/constants/network';

describe('Send ETH', function () {
  it('it should be possible to send ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0x539-ETH"]');

        await driver.fill(
          'input[placeholder="Enter or paste a valid address"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        await driver.fill('input[placeholder="0"]', '1000');

        await driver.findElement({
          text: 'Insufficient funds',
        });

        await driver.press('input[placeholder="0"]', driver.Key.BACK_SPACE);
        await driver.press('input[placeholder="0"]', driver.Key.BACK_SPACE);
        await driver.press('input[placeholder="0"]', driver.Key.BACK_SPACE);

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1 ETH',
        });
      },
    );
  });

  it('it should be possible to send Max ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0x539-ETH"]');

        await driver.fill(
          'input[placeholder="Enter or paste a valid address"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        await driver.clickElement({ text: 'Max', tag: 'button' });

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);
      },
    );
  });

  it('it should be possible to send to address book entry', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0x539-ETH"]');

        await driver.clickElement('[data-testid="open-recipient-modal-btn"]');

        await driver.clickElement({ text: 'Test Name 1' });

        await driver.fill('input[placeholder="0"]', '1');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1 ETH',
        });
      },
    );
  });

  it('it should be possible to send to name lookup address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          inputChainId: CHAIN_IDS.MAINNET,
        }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => {
          mockSendRedesignFeatureFlag(mockServer);
          mockLookupSnap(mockServer);
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0x1-ETH"]');

        await driver.fill(
          'input[placeholder="Enter or paste a valid address"]',
          'test.eth',
        );

        await driver.fill('input[placeholder="0"]', '1');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);
      },
    );
  });
});

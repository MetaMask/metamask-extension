import FixtureBuilder from '../../fixture-builder';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { mockSendRedesignFeatureFlag } from './common';

const getERC20Fixtures = () => {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
      },
    })
    .withTokensController({
      tokenList: [],
      tokensChainsCache: {
        '0x1': {
          data: {
            '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267': {
              name: 'Entropy',
              aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
              address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
              decimals: 18,
              iconUrl:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267.png',
              occurrences: 3,
              symbol: 'ERP',
            },
          },
        },
      },
    })
    .build();
};

describe('Send ERC20', function () {
  it('it should be possible to send ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: getERC20Fixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0xe708-ETH"]');

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
      },
    );
  });

  it('it should be possible to send Max token value', async function () {
    await withFixtures(
      {
        fixtures: getERC20Fixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.clickElement('[data-testid="token-asset-0xe708-ETH"]');

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
});

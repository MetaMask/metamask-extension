const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Hide token', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('hides the token when clicked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTokensController({
            allTokens: {
              '0x539': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.waitForSelector({
          css: '.asset-list-item__token-button',
          text: '0 TST',
        });

        let assets = await driver.findElements('.asset-list-item');
        assert.equal(assets.length, 2);

        await driver.clickElement({ text: 'Assets', tag: 'button' });

        await driver.clickElement({ text: 'TST', tag: 'span' });

        await driver.clickElement('[data-testid="asset-options__button"]');

        await driver.clickElement('[data-testid="asset-options__hide"]');
        // wait for confirm hide modal to be visible
        const confirmHideModal = await driver.findVisibleElement('span .modal');

        await driver.clickElement(
          '[data-testid="hide-token-confirmation__hide"]',
        );

        // wait for confirm hide modal to be removed from DOM.
        await confirmHideModal.waitForElementState('hidden');

        assets = await driver.findElements('.asset-list-item');
        assert.equal(assets.length, 1);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Add existing token using search', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('renders the balance for the chosen token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({ useTokenDetection: true })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement({ text: 'import tokens', tag: 'a' });
        await driver.fill('#search-tokens', 'BAT');
        await driver.clickElement({
          text: 'BAT',
          tag: 'span',
        });
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Import tokens', tag: 'button' });

        await driver.waitForSelector({
          css: '.token-overview__primary-balance',
          text: '0 BAT',
        });
      },
    );
  });
});

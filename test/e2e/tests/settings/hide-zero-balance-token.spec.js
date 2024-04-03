// const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

const toggleOnHideZeroBalance = async (driver) => {
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement({ text: 'Settings', tag: 'div' });
  await driver.clickElement('[id="toggle-zero-balance"] .toggle-button');
  await driver.clickElement(
    '.settings-page__header__title-container__close-button',
  );
};

describe('Hide token with zero-balance', function () {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // This script tests the "hide zero-balance tokens" feature in wallet settings, ensuring that tokens with zero        //
  // balances are correctly hidden from the tokens list tab when corresponding toggle is enabled.                       //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('user can activate hide token with zero-balance feature via settings', async function () {
    const smartContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTokensController({
            allTokens: {
              [toHex(1337)]: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                  {
                    address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945948',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST2',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945948',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST2',
              },
              {
                address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Verify that both zero-balance tokens and non-zero-balance tokens are displayed by default
        // Navigate to settings and enable the "hide zero-balance tokens" feature by toggling it on
        // Check that tokens with zero balances are hidden, tokens with non-zero balances remain visible

      },
    );
  });
});

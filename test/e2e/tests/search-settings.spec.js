const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Search settings page', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should successfully search settings page', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // goes to settings page
        await driver.clickElement('.account-menu__icon');
        const settingsButton = await driver.findClickableElement({
          tag: 'div',
          text: 'Settings',
        });
        assert.equal(await settingsButton.getText(), 'Settings');
        await settingsButton.click();

        const inputSearch = await driver.findElement(
          '#search-settings',
        );

        // enters expected search
        await driver.fill('#search-settings', 'adv');

        const searchResult = await driver.findElements(
            '.settings-page__header__search__list__item',
          );
          const firstSearchResult = searchResult[0];
          
          await firstSearchResult.click();
          await driver.waitForSelector({
            tag: 'span',
            text: 'Advanced gas controls',
          });
      },
    );
  });

  it('should search settings page with no matching results', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },

      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        const settingsButton = await driver.findClickableElement({
          tag: 'div',
          text: 'Settings',
        });

        // goes to settings page
        assert.equal(await settingsButton.getText(), 'Settings');
        await settingsButton.click();

        const inputSearch = await driver.findElement(
          '#search-settings',
        );

        // enters unexpected search
        await driver.fill('#search-settings', 'xyz');

        const searchResult = await driver.findElements(
            '.settings-page__header__search__list__item',
          );

        assert.equal(await searchResult[0].getText(), 'No matching results found');
          
        await driver.waitForSelector({
              tag: 'a',
              text: 'Request here'
          });

      },
    );
});

});

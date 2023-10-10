const { strict: assert } = require('assert');
const { Key } = require('selenium-webdriver');

const { withFixtures } = require('../helpers');

describe('Swaps', function () {
  specify(
    'Merely choosing a destination token should not result in duplicate copies of the same token getting added to the token list',
    async function () {
      await withFixtures(
        { fixtures: 'basic' },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          // select network
          await driver.clickElement({ text: 'Localhost 8545' });
          await driver.clickElement({ text: 'Ethereum Mainnet' });
          await driver.waitForSelector({
            css: '[data-testid="current-network"]',
            text: 'Ethereum Mainnet',
          });

          // wait for network to be switched (otherwise we get a weird React error)
          await driver.waitForSelector({
            css: '[data-testid="wallet-overview"]',
            text: '$0.00 USD',
          });
          await driver.delay(2000);

          // go to swaps
          await driver.clickElement({
            css: '.wallet-overview button',
            text: 'Swap',
          });

          // select source token
          await driver.clickElement(
            '.dropdown-input-pair:nth-child(2) .dropdown-search-list__selector-closed',
          );
          await driver.clickElement({
            css:
              '.dropdown-input-pair:nth-child(2) .searchable-item-list__item',
            text: 'ETH',
          });
          await driver.fill(
            '.dropdown-input-pair:nth-child(2) input[type="text"]',
            '1',
          );

          // select destination token
          await driver.clickElement(
            '.dropdown-input-pair:nth-of-type(6) .dropdown-search-list__selector-closed',
          );
          // delay for a bit to wait until the dropdown to be filled, otherwise
          // when we re-request this below in assertions the token list won't
          // match
          await driver.delay(250);
          const firstDestinationToken = await driver.findElement(
            '.dropdown-input-pair:nth-of-type(6) .searchable-item-list__item:nth-child(1)',
          );
          const firstDestinationTokenContent = await firstDestinationToken.getText();
          firstDestinationToken.click();

          // wait a second for the token to be added, then reopen menu
          await driver.delay(2000);
          await driver.clickElement(
            '.dropdown-input-pair:nth-of-type(6) .dropdown-search-list__selector-closed',
          );

          // make sure token list hasn't changed
          let tokenElements = await driver.findElements(
            '.dropdown-input-pair:nth-of-type(6) .searchable-item-list__item',
          );
          assert.equal(
            await tokenElements[0].getText(),
            firstDestinationTokenContent,
          );
          assert.notEqual(
            await tokenElements[1].getText(),
            firstDestinationTokenContent,
          );

          // go to review swaps
          await driver.fill(
            '.dropdown-input-pair:nth-of-type(6) input',
            Key.ESCAPE,
          );
          await driver.clickElement({ text: 'Review Swap' });

          // go back
          await driver.waitForSelector('.main-quote-summary', 7000);
          await driver.clickElement({ text: 'Back' });

          // reopen destination token menu
          await driver.clickElement(
            '.dropdown-input-pair:nth-of-type(6) .dropdown-search-list__selector-closed',
          );

          // make sure token list hasn't changed
          tokenElements = await driver.findElements(
            '.dropdown-input-pair:nth-of-type(6) .searchable-item-list__item',
          );
          assert.equal(
            await tokenElements[0].getText(),
            firstDestinationTokenContent,
          );
          assert.notEqual(
            await tokenElements[1].getText(),
            firstDestinationTokenContent,
          );
        },
        this,
      );
    },
  );

  specify.only(
    'Merely choosing a destination token should add it to Assets',
    async function () {
      await withFixtures(
        { fixtures: 'basic' },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          // select network
          await driver.clickElement({ text: 'Localhost 8545' });
          await driver.clickElement({ text: 'Ethereum Mainnet' });
          await driver.waitForSelector({
            css: '[data-testid="current-network"]',
            text: 'Ethereum Mainnet',
          });

          // wait for network to be switched (otherwise we get a weird React error)
          await driver.delay(1000);

          // go to swaps
          await driver.clickElement({
            css: '.wallet-overview button',
            text: 'Swap',
          });

          // select source token
          await driver.clickElement(
            '.dropdown-input-pair:nth-child(2) .dropdown-search-list__selector-closed',
          );
          await driver.clickElement({
            css:
              '.dropdown-input-pair:nth-child(2) .searchable-item-list__item',
            text: 'ETH',
          });
          await driver.fill(
            '.dropdown-input-pair:nth-child(2) input[type="text"]',
            '1',
          );

          // select destination token
          await driver.clickElement(
            '.dropdown-input-pair:nth-of-type(6) .dropdown-search-list__selector-closed',
          );
          await driver.clickElement(
            '.dropdown-input-pair:nth-of-type(6) .searchable-item-list__item:nth-child(1)',
          );
          // wait a sec for token to be added
          await driver.delay(1000);
          const destinationTokenName = await (
            await driver.findElement(
              '.dropdown-input-pair:nth-of-type(6) .dropdown-search-list__selector-closed',
            )
          ).getText();

          // see that token is added
          await driver.clickElement({ text: 'Cancel' });
          let assetListItems;
          await driver.wait(async () => {
            assetListItems = await driver.findElements('.asset-list-item');
            return assetListItems.length === 2;
          }, 5000);
          assert.equal(await assetListItems[0].getText(), '0\nETH\n$0.00 USD');
          assert.equal(
            await assetListItems[1].getText(),
            `0\n${destinationTokenName}\n$0.00 USD`,
          );
        },
        this,
      );
    },
  );
});

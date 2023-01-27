const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Custom network', function () {
  const chainID = 42161;
  const networkURL = 'https://arbitrum-mainnet.infura.io';
  const networkNAME = 'Arbitrum One';
  const currencySYMBOL = 'ETH';
  const blockExplorerURL = 'https://explorer.arbitrum.io';
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('add custom network and switch the network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ tag: 'div', text: 'Settings' });

        await driver.clickElement('.network-display');
        await driver.clickElement({ tag: 'button', text: 'Add network' });

        await driver.clickElement({
          tag: 'button',
          text: 'Add',
        });
        // verify network details
        const title = await driver.findElement({
          tag: 'h6',
          text: 'Arbitrum One',
        });
        assert.equal(
          await title.getText(),
          'Arbitrum One',
          'Title of popup should be selected network',
        );

        const [networkName, networkUrl, chainIdElement, currencySymbol] =
          await driver.findElements('.definition-list dd');

        assert.equal(
          await networkName.getText(),
          networkNAME,
          'Network name is not correct displayed',
        );
        assert.equal(
          await networkUrl.getText(),
          networkURL,
          'Network Url is not correct displayed',
        );
        assert.equal(
          await chainIdElement.getText(),
          chainID.toString(),
          'Chain Id is not correct displayed',
        );
        assert.equal(
          await currencySymbol.getText(),
          currencySYMBOL,
          'Currency symbol is not correct displayed',
        );

        await driver.clickElement({ tag: 'a', text: 'View all details' });

        const networkDetailsLabels = await driver.findElements('dd');
        assert.equal(
          await networkDetailsLabels[8].getText(),
          blockExplorerURL,
          'Block Explorer URL is not correct',
        );

        await driver.clickElement({ tag: 'button', text: 'Close' });
        await driver.clickElement({ tag: 'button', text: 'Approve' });

        await driver.clickElement({
          tag: 'h6',
          text: 'Switch to Arbitrum One',
        });
        // verify network switched
        const networkDisplayed = await driver.findElement({
          tag: 'span',
          text: 'Arbitrum One',
        });
        assert.equal(
          await networkDisplayed.getText(),
          'Arbitrum One',
          'You have not switched to Arbitrum Network',
        );
      },
    );
  });

  it('add custom network and not switch the network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ tag: 'div', text: 'Settings' });

        await driver.clickElement('.network-display');
        await driver.clickElement({ tag: 'button', text: 'Add network' });

        // had to put all Add elements in list since list is changing and networks are not always in same order
        await driver.clickElement({
          tag: 'button',
          text: 'Add',
        });

        await driver.clickElement({ tag: 'button', text: 'Approve' });

        await driver.clickElement({
          tag: 'h6',
          text: 'Dismiss',
        });

        // verify if added network is in list of networks
        const networkDisplay = await driver.findElement('.network-display');
        await networkDisplay.click();

        const arbitrumNetwork = await driver.findElements({
          text: `Arbitrum One`,
          tag: 'span',
        });
        assert.ok(arbitrumNetwork.length, 1);
      },
    );
  });
  it('Add a custom network and then delete that same network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            frequentRpcListDetail: [
              {
                rpcUrl: networkURL,
                chainId: chainID,
                ticker: currencySYMBOL,
                nickname: networkNAME,
                rpcPrefs: {},
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

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Networks', tag: 'div' });

        const arbitrumNetwork = await driver.clickElement({
          text: `Arbitrum One`,
          tag: 'div',
        });

        await driver.clickElement({
          tag: 'button',
          text: 'Delete',
        });

        await driver.findElement('.modal-container__footer');
        // should be deleted from the modal shown again to complete  deletion custom network
        await driver.clickElement({
          tag: 'button',
          text: 'Delete',
        });

        // it checks if custom network is delete
        const existNetwork = await driver.isElementPresent(arbitrumNetwork);
        assert.equal(existNetwork, false, 'Network is not deleted');
      },
    );
  });
});

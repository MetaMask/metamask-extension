const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  regularDelayMs,
} = require('../helpers');

describe('Custom network', function () {
  const chainID = '42161';
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

  it('should show warning when adding chainId 0x1(ethereum) and be followed by an wrong chainId error', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);
        await driver.executeScript(`
          var params = [{
            chainId: "0x1",
            chainName: "Fake Ethereum Network",
            nativeCurrency: {
              name: "",
              symbol: "ETH",
              decimals: 18
            },
            rpcUrls: ["https://customnetwork.com/api/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
        const windowHandles = await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        const warningTxt =
          'You are adding a new RPC provider for Ethereum Mainnet';

        await driver.findElement({
          tag: 'h4',
          text: warningTxt,
        });

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        const errMsg =
          'Chain ID returned by the custom network does not match the submitted chain ID.';
        await driver.findElement({
          tag: 'span',
          text: errMsg,
        });

        const approveBtn = await driver.findElement({
          tag: 'button',
          text: 'Approve',
        });

        assert.equal(await approveBtn.isEnabled(), false);
        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });
      },
    );
  });

  it('don’t add bad rpc custom network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);
        await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://customnetwork.com/api/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
        const windowHandles = await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const errMsg1 = 'verify the network details';
        await driver.findElement({
          tag: 'a',
          text: errMsg1,
        });

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        const errMsg2 =
          'Chain ID returned by the custom network does not match the submitted chain ID.';
        await driver.findElement({
          tag: 'span',
          text: errMsg2,
        });

        const approveBtn = await driver.findElement({
          tag: 'button',
          text: 'Approve',
        });

        assert.equal(await approveBtn.isEnabled(), false);
        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });
      },
    );
  });

  it('don’t add unreachable custom network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);
        await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://doesntexist.abc/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
        const windowHandles = await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        await driver.findElement({
          tag: 'span',
          text: 'Error while connecting to the custom network.',
        });

        const approveBtn = await driver.findElement({
          tag: 'button',
          text: 'Approve',
        });

        assert.equal(await approveBtn.isEnabled(), false);
        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });
      },
    );
  });

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

        // Avoid a stale element error
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="network-display"]');

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
          'Network name is not correctly displayed',
        );
        assert.equal(
          await networkUrl.getText(),
          networkURL,
          'Network Url is not correctly displayed',
        );
        assert.equal(
          await chainIdElement.getText(),
          chainID.toString(),
          'Chain Id is not correctly displayed',
        );
        assert.equal(
          await currencySymbol.getText(),
          currencySYMBOL,
          'Currency symbol is not correctly displayed',
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
          tag: 'p',
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

        // Avoid a stale element error
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="network-display"]');
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
        const networkDisplay = await driver.findElement(
          '[data-testid="network-display"]',
        );
        await networkDisplay.click();

        const arbitrumNetwork = await driver.findElements({
          text: 'Arbitrum One',
          tag: 'span',
        });
        assert.ok(arbitrumNetwork.length, 1);
      },
    );
  });

  it('Delete the Arbitrum network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: networkURL,
                chainId: chainID,
                nickname: networkNAME,
                ticker: currencySYMBOL,
                rpcPrefs: {},
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Networks', tag: 'div' });

        const arbitrumNetwork = await driver.clickElement({
          text: 'Arbitrum One',
          tag: 'div',
        });

        // Click first Delete button
        await driver.clickElement('button.btn-danger');

        // Click modal Delete button
        await driver.clickElement('button.btn-danger-primary');

        // Checks if Arbitrum is deleted
        const existNetwork = await driver.isElementPresent(arbitrumNetwork);
        assert.equal(existNetwork, false, 'Network is not deleted');
      },
    );
  });
});

const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

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
        fixtures: 'custom-token',
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
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement({ text: 'import tokens', tag: 'a' });
        await driver.fill('#search-tokens', 'BAT');
        await driver.clickElement({ text: 'BAT', tag: 'span' });
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Import Tokens', tag: 'button' });

        await driver.waitForSelector({
          css: '.token-overview__primary-balance',
          text: '0 BAT',
        });
      },
    );
  });
});

describe('Token Details', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };
  it('check token details', async function () {
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

        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        await driver.closeAllWindowHandlesExcept([extension]);
        await driver.clickElement('.app-header__logo-container');

        // connects the dapp
        await driver.openNewPage('https://metamask.github.io/test-dapp/');
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        popup = windowHandles.find(
          (handle) => handle !== extension && handle !== dapp,
        );
        await driver.switchToWindow(popup);
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);

        //create token from test dapp
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await driver.delay(2000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.delay(3000);
       
       // await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);
        const tokenAddress = await driver.waitForSelector('#tokenAddress');

        await driver.delay(2000);
        const tokenAddressText = await tokenAddress.getText();

       //add token to wallet
       const addTokenToWallet = await driver.findClickableElement(
        { text: 'Add Token to Wallet', tag: 'button' }
      );

      await driver.scrollToElement(addTokenToWallet);
      await addTokenToWallet.click();

        await driver.delay(2000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add Token', tag: 'button' });
        await driver.delay(3000);

        //await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);


        await driver.clickElement({ text: 'Assets', tag: 'button' });

        await driver.clickElement({ text: 'TST', tag: 'span' });
        
        await driver.clickElement('[data-testid="asset-options__button"]');
       
        await driver.clickElement('[data-testid="asset-options__token-details"]');

        const asset = await driver.findElement('h4');
        assert.equal(await asset.isDisplayed(), true, "Asset not shown");

        const icon = await driver.findElement('img');
        assert.equal(await icon.isDisplayed(), true, "Icon not shown");

        const labelTokenContractAddress = await driver.findElement({ text: 'Token Contract Address', tag: 'h6'});
        assert.equal(await labelTokenContractAddress.isDisplayed(), true, "Label Token Contract Address is not shown");

        const tokenContractAddress = await driver.findElement({ text: await tokenAddressText, tag: 'h6'});
        assert.equal(await tokenContractAddress.isDisplayed(), true, "Token contract address is not correct");

        const copyButton = await driver.findClickableElement('.token-details__copyIcon');
        assert.equal(await copyButton.isDisplayed(), true, "Copy button is not clickable");

        const labelTokenDecimal = await driver.findElement({ text: 'Token Decimal:', tag: 'h6'});
        assert.equal(await labelTokenDecimal.isDisplayed(), true, "Label Token Decimal is not shown");

        const tokenDecimal = await driver.findElement({text: '4', tag: 'h6'});
        assert.equal(await tokenDecimal.isDisplayed(), true, "Token Decimal is not correct");

        const labelNetwork = await driver.findElement({text: 'Network:', tag: 'h6'});
        assert.equal(await labelNetwork.isDisplayed(), true, "Label Token decimal is not shown");

        const network = await driver.findElement({text: 'Localhost 8545', tag: 'h6'});
        assert.equal(await network.isDisplayed(), true, "Network is not correct");
        
        const hideTokenButton = await driver.findClickableElement('.token-details__hide-token-button');
        assert.equal(await hideTokenButton.isDisplayed(), true, "Hide token button is not displayed");

        const closeButton = await driver.findClickableElement('.token-details__closeButton');
        closeButton.click();
      },
    );
  });
});

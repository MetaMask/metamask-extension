import { strict as assert } from 'assert';
import { Context } from 'mocha';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { Driver } from '../../../webdriver/driver';
import { CHAIN_IDS } from '../../../../../shared/constants/network';

describe('Add popular network', function () {
  const chainIdMainnet = CHAIN_IDS.MAINNET;
  const chainID = '42161';
  const networkURL = 'https://arbitrum-mainnet.infura.io';
  const networkNAME = 'Arbitrum One';
  const currencySYMBOL = 'ETH';
  const blockExplorerURL = 'https://explorer.arbitrum.io';

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainIdMainnet }).build(),
    ganacheOptions: {
      ...defaultGanacheOptions,
      chainId: parseInt(chainIdMainnet, 16),
    },
  };

  it('add popular network', async function () {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('[data-testid="test-add-button-0"]');

        await driver.findElement({
          text: 'Want to add this network?',
        });

        // verify network details
        const title = await driver.findElement({
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
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

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

  it('search for network', async function () {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');

        // Search for Arbitrum
        const searchInputField = await driver.waitForSelector(
          '[data-testid="network-redesign-modal-search-input"]',
        );
        await searchInputField.sendKeys('Arbitrum');

        // verify searched network
        const networkDisplayed = await driver.findElement({
          tag: 'p',
          text: 'Arbitrum One',
        });
        assert.equal(await networkDisplayed.getText(), 'Arbitrum One');
        // should filter popular network
        assert.notEqual(await networkDisplayed.getText(), 'BNB');
        // should filter enabled network
        assert.notEqual(await networkDisplayed.getText(), 'Ethereum');
        // should filter testnet
        assert.notEqual(await networkDisplayed.getText(), 'Sepolia');
      },
    );
  });
});

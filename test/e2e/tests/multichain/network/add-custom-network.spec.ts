import { strict as assert } from 'assert';
import { Context } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import { Mockttp } from 'mockttp';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { Driver } from '../../../webdriver/driver';

const TEST_CHAIN_ID = toHex(100);

const selectors = {
  suggestedTickerForXDAI: {
    css: '[data-testid="network-form-ticker-suggestion"]',
    text: 'Suggested ticker symbol:\nXDAI',
  },
  suggestedNameForXDAI: {
    css: '[data-testid="network-form-name-suggestion"]',
    text: 'Suggested name:\nGnosis',
  },
  networkNameInputField: '[data-testid="network-form-network-name"]',
  rpcUrlInputField: '[data-testid="network-form-rpc-url"]',
  chainIdInputField: '[data-testid="network-form-chain-id"]',
  tickerInputField: '[data-testid="network-form-ticker-input"]',
  explorerInputField: '[data-testid="network-form-block-explorer-url"]',
};

describe('Add custom network', function () {
  const networkURL = 'https://responsive-rpc.test';
  const networkNAME = 'Ethereum Mainnet';
  const currencySYMBOL = 'ETH';
  const blockExplorerURL = 'https://bscscan.com';

  it('should add custom network', async () => {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({ useSafeChainsListValidation: false })
          .build(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('[data-testid="add-custom-network"]');

        // fill the add network form
        const networkNameInputField = await driver.waitForSelector(
          '[data-testid="network-form-network-name"]',
        );
        await networkNameInputField.sendKeys(networkNAME);

        const rpcUrlInputField = await driver.waitForSelector(
          '[data-testid="network-form-rpc-url"]',
        );
        await rpcUrlInputField.sendKeys(networkURL);

        const chainIdInputField = await driver.waitForSelector(
          '[data-testid="network-form-chain-id"]',
        );
        await chainIdInputField.sendKeys('100');

        const symbolInputField = await driver.waitForSelector(
          '[data-testid="network-form-ticker-input"]',
        );
        await symbolInputField.sendKeys(currencySYMBOL);

        const blockExplorerInputField = await driver.waitForSelector(
          '[data-testid="network-form-block-explorer-url"]',
        );
        await blockExplorerInputField.sendKeys(blockExplorerURL);

        await driver.clickElement({ tag: 'button', text: 'Next' });

        // verify network details
        const title = await driver.findElement({
          text: 'Ethereum Mainnet',
        });
        assert.equal(
          await title.getText(),
          'Ethereum Mainnet',
          'Title of popup should be selected network',
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
          text: 'Ethereum Mainnet',
        });
        assert.equal(
          await networkDisplayed.getText(),
          'Ethereum Mainnet',
          'You have not switched to Arbitrum Network',
        );
      },
    );
  });

  it('should show suggestion name and symbol', async function () {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('[data-testid="add-custom-network"]');

        await driver.fill(selectors.networkNameInputField, 'Ethereum mainnet');
        await driver.fill(
          selectors.rpcUrlInputField,
          'https://responsive-rpc.test',
        );
        await driver.fill(selectors.chainIdInputField, TEST_CHAIN_ID);
        await driver.fill(selectors.tickerInputField, 'XDAI2');
        await driver.fill(selectors.explorerInputField, 'https://test.com');

        const suggestedName = await driver.findElement(
          selectors.suggestedNameForXDAI.css,
        );

        const suggestedTicker = await driver.findElement(
          selectors.suggestedTickerForXDAI.css,
        );

        const suggestedNameText = await suggestedName.getText();
        const suggestedTickerText = await suggestedTicker.getText();

        assert.equal(suggestedNameText, selectors.suggestedNameForXDAI.text);
        assert.equal(
          suggestedTickerText,
          selectors.suggestedTickerForXDAI.text,
        );
      },
    );
  });

  it('should throw error for invalid RPC URL', async function () {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('[data-testid="add-custom-network"]');

        await driver.fill(selectors.networkNameInputField, 'Ethereum mainnet');
        await driver.fill(selectors.rpcUrlInputField, 'test');
        await driver.fill(selectors.chainIdInputField, TEST_CHAIN_ID);
        await driver.fill(selectors.tickerInputField, 'XDAI2');

        const rpcUrlError = await driver.findElement(
          '[data-testid="network-form-rpc-url-error"]',
        );

        const rpcUrlErrorText = await rpcUrlError.getText();

        assert.equal(
          rpcUrlErrorText,
          'URLs require the appropriate HTTP/HTTPS prefix.',
        );
      },
    );
  });

  it('rpc url should not be associated with another network and should match with chainID', async function () {
    if (!process.env.ENABLE_NETWORK_UI_REDESIGN) {
      return;
    }
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('[data-testid="add-custom-network"]');

        await driver.fill(selectors.networkNameInputField, 'Ethereum mainnet');
        await driver.fill(selectors.rpcUrlInputField, 'http://localhost:8545');
        await driver.fill(selectors.chainIdInputField, TEST_CHAIN_ID);
        await driver.fill(selectors.tickerInputField, 'XDAI');

        const rpcUrlError = await driver.findElement(
          '[data-testid="network-form-rpc-url-error"]',
        );

        const chainIdError = await driver.findElement(
          '[data-testid="network-form-chain-id-error"]',
        );

        const rpcUrlErrorText = await rpcUrlError.getText();
        const chainIdErrorText = await chainIdError.getText();

        assert.equal(
          rpcUrlErrorText,
          'This URL is associated with another chain ID.',
        );

        assert.equal(
          chainIdErrorText,
          'This chain ID doesn’t match the network name.',
        );
      },
    );
  });
});

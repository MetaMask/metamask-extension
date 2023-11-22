const {
  convertToHexValue,
  withFixtures,
  openActionMenuAndStartSendFlow,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('ENS', function () {
  const sampleAddress = '1111111111111111111111111111111111111111';
  const sampleEnsDomain = 'test.eth';
  const infuraUrl =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';

  async function mockInfura(mockServer) {
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x1',
          },
        };
      });

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x1',
          },
        };
      });

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: {},
          },
        };
      });

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_call' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: `0x000000000000000000000000${sampleAddress}`,
          },
        };
      });
  }
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.waitForElementNotPresent('.loading-overlay');

        await openActionMenuAndStartSendFlow(driver);
        // TODO: Update Test when Multichain Send Flow is added
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.pasteIntoField(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          sampleEnsDomain,
        );

        await driver.clickElement(
          '.send__select-recipient-wrapper__group-item__title',
        );

        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: 'test.eth',
        });

        await driver.findElement({
          css: '.ens-input__selected-input__subtitle',
          text: `0x${sampleAddress}`,
        });
      },
    );
  });
});

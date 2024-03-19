const {
  defaultGanacheOptions,
  withFixtures,
  openActionMenuAndStartSendFlow,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

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

  it('domain resolves to a correct address', async function () {
    // TODO: Update Test when Multichain Send Flow is added
    if (process.env.MULTICHAIN) {
      return;
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');

        await openActionMenuAndStartSendFlow(driver);
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

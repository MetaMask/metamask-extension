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
          '.ens-input__wrapper__input',
          sampleEnsDomain,
        );

        await driver.waitForSelector({
          text: sampleEnsDomain,
          css: '[data-testid="multichain-send-page__recipient__item__title"]',
        });

        await driver.clickElement('.multichain-send-page__recipient__item');

        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: 'test.eth',
        });

        await driver.findElement({
          text: '0x11111...11111',
        });
      },
    );
  });
});

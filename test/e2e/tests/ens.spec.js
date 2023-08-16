const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
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
        fixtures: new FixtureBuilder()
          .withNetworkController({
            providerConfig: {
              chainId: '0x1',
              nickname: '',
              rpcUrl: '',
              type: 'mainnet',
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockInfura,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.waitForElementNotPresent('.loading-overlay');

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.pasteIntoField(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          sampleEnsDomain,
        );

        await driver.clickElement(
          '.send__select-recipient-wrapper__group-item__title',
        );

        const currentEnsDomain = await driver.findElement(
          '.ens-input__selected-input__title',
        );

        assert.equal(
          await currentEnsDomain.getText(),
          'test.eth',
          'Domain name not correct',
        );

        const resolvedAddress = await driver.findElement(
          '.ens-input__selected-input__subtitle',
        );

        assert.equal(
          await resolvedAddress.getText(),
          `0x${sampleAddress}`,
          'Resolved address not correct',
        );
      },
    );
  });
});

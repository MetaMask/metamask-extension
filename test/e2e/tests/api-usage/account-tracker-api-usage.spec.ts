import { strict as assert } from 'assert';
import { CompletedRequest } from 'mockttp';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';

async function mockInfura(mockServer: Mockttp): Promise<void[]> {
  const blockNumber = { value: 0 };

  return [
    await mockServer
      .forPost(/infura/u)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .times(50)
      .thenCallback(() => {
        blockNumber.value += 1;

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: blockNumber.value.toString(16),
          },
        };
      }),
    await mockServer.forPost(/infura/u).thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x1',
        },
      };
    }),
    await mockServer.forGet(/infura/u).thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x0',
        },
      };
    }),
  ];
}

async function getAllInfuraJsonRpcRequests(
  mockedEndpoint: Mockttp[],
): Promise<CompletedRequest[]> {
  const allInfuraJsonRpcRequests: CompletedRequest[] = [];
  let seenRequests;
  let seenProviderRequests;

  for (const m of mockedEndpoint) {
    seenRequests = await m.getSeenRequests();
    seenProviderRequests = seenRequests.filter((request) =>
      request.url.match('infura'),
    );

    for (const r of seenProviderRequests) {
      const json = await r.body.getJson();
      allInfuraJsonRpcRequests.push(json);
    }
  }

  return allInfuraJsonRpcRequests;
}

describe('Account Tracker API Usage', function () {
  it('should not make eth_call or eth_getBalance requests before the UI is opened and should make those requests after the UI is opened', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: Mockttp;
      }) => {
        await driver.delay(3000);
        let allInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );
        let ethCallAndGetBalanceRequests = allInfuraJsonRpcRequests.filter(
          ({ method }) => method === 'eth_getBalance' || method === 'eth_call',
        );

        assert.ok(
          ethCallAndGetBalanceRequests.length === 0,
          'An eth_call or eth_getBalance request has been made to infura before opening the UI',
        );

        await unlockWallet(driver);
        await driver.delay(3000);

        allInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );
        ethCallAndGetBalanceRequests = allInfuraJsonRpcRequests.filter(
          ({ method }) => method === 'eth_getBalance' || method === 'eth_call',
        );

        assert.ok(
          ethCallAndGetBalanceRequests.length > 0,
          'No eth_call or eth_getBalance request has been made to infura since opening the UI',
        );
      },
    );
  });

  it('should not make eth_call or eth_getBalance requests after the UI is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: Mockttp;
      }) => {
        await unlockWallet(driver);
        await driver.delay(3000);
        const initialInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );

        await driver.openNewURL('chrome://extensions');
        await driver.delay(20000);

        const currentInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );
        const initialEthCallAndGetBalanceRequests =
          initialInfuraJsonRpcRequests.filter(
            ({ method }) =>
              method === 'eth_getBalance' || method === 'eth_call',
          );
        const currentEthCallAndGetBalanceRequests =
          currentInfuraJsonRpcRequests.filter(
            ({ method }) =>
              method === 'eth_getBalance' || method === 'eth_call',
          );

        assert.ok(
          initialEthCallAndGetBalanceRequests.length ===
            currentEthCallAndGetBalanceRequests.length,
          'An eth_call or eth_getBalance request has been made to infura after closing the UI',
        );
      },
    );
  });
});

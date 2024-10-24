import { strict as assert } from 'assert';
import { JsonRpcRequest } from '@metamask/utils';
import { MockedEndpoint } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  veryLargeDelayMs,
  withFixtures,
} from '../../helpers';
import { Mockttp } from '../../mock-e2e';

async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  const blockNumber = { value: 0 };

  return [
    await mockServer
      .forPost(/infura/u)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .times(50)
      .thenCallback(() => {
        // We need to ensure the mocked block number keeps increasing,
        // as this results in block tracker listeners firing, which is
        // needed for the potential account tracker network requests being
        // tested against here.
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
  mockedEndpoint: MockedEndpoint[],
): Promise<JsonRpcRequest[]> {
  const allInfuraJsonRpcRequests: JsonRpcRequest[] = [];
  let seenRequests;
  let seenProviderRequests;

  for (const m of mockedEndpoint) {
    seenRequests = await m.getSeenRequests();
    seenProviderRequests = seenRequests.filter((request) =>
      request.url.match('infura'),
    );

    for (const r of seenProviderRequests) {
      const json = (await r.body.getJson()) as JsonRpcRequest | undefined;
      if (json !== undefined) {
        allInfuraJsonRpcRequests.push(json);
      }
    }
  }

  return allInfuraJsonRpcRequests;
}

function getSpecifiedJsonRpcRequests(
  jsonRpcRequestArray: JsonRpcRequest[],
  methodsToGet: string[],
) {
  return jsonRpcRequestArray.filter(({ method }) =>
    methodsToGet.includes(method),
  );
}

describe('Account Tracker API Usage', function () {
  it('should not make eth_call or eth_getBalance requests before the UI is opened and should make those requests after the UI is opened', async function () {
    // Note: we are not testing that eth_getBlockByNumber is not called before the UI
    // is opened because there is a known bug that results in it being called if the
    // user is already onboarded: https://github.com/MetaMask/MetaMask-planning/issues/2151
    // Once that issue is resolved, we can add eth_getBlockByNumber to the below array.
    const RPC_METHODS_TO_TEST = ['eth_call', 'eth_getBalance'];

    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint }) => {
        await driver.delay(veryLargeDelayMs);
        let allInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );
        let rpcMethodsToTestRequests = getSpecifiedJsonRpcRequests(
          allInfuraJsonRpcRequests,
          RPC_METHODS_TO_TEST,
        );

        assert.ok(
          rpcMethodsToTestRequests.length === 0,
          `An ${RPC_METHODS_TO_TEST.join(
            ' or ',
          )} request has been made to infura before opening the UI`,
        );

        await unlockWallet(driver);
        await driver.delay(veryLargeDelayMs);

        allInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );
        rpcMethodsToTestRequests = getSpecifiedJsonRpcRequests(
          allInfuraJsonRpcRequests,
          RPC_METHODS_TO_TEST,
        );

        assert.ok(
          rpcMethodsToTestRequests.length > 0,
          `No ${RPC_METHODS_TO_TEST.join(
            ' or ',
          )} request has been made to infura since opening the UI`,
        );
      },
    );
  });

  it('should not make eth_call or eth_getBalance or eth_getBlockByNumber requests after the UI is closed', async function () {
    const RPC_METHODS_TO_TEST = [
      'eth_getBlockByNumber',
      'eth_call',
      'eth_getBalance',
    ];

    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await driver.delay(veryLargeDelayMs);
        const initialInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );

        await driver.openNewURL('about:blank');
        // The delay is intentionally 20000, to ensure we cover at least 1 polling
        // loop of time for the block tracker.
        await driver.delay(20000);

        const currentInfuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );

        const initialRpcMethodsToTestRequests = getSpecifiedJsonRpcRequests(
          initialInfuraJsonRpcRequests,
          RPC_METHODS_TO_TEST,
        );

        const currentRpcMethodsToTestRequests = getSpecifiedJsonRpcRequests(
          currentInfuraJsonRpcRequests,
          RPC_METHODS_TO_TEST,
        );

        assert.ok(
          initialRpcMethodsToTestRequests.length ===
            currentRpcMethodsToTestRequests.length,
          `An ${RPC_METHODS_TO_TEST.join(
            ' or ',
          )} request has been made to infura after closing the UI`,
        );
      },
    );
  });
});

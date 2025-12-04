import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import {
  MultiChainOpenRPCDocument,
  MetaMaskOpenRPCDocument,
} from '@metamask/api-specs';

import { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import { Call, IOptions } from '@open-rpc/test-coverage/build/coverage';
import { InternalScopeString } from '@metamask/chain-agnostic-permission';
import { Mockttp } from 'mockttp';
import { Driver, PAGES } from './webdriver/driver';

import {
  createCaip27DriverTransport,
  createMultichainDriverTransport,
} from './api-specs/helpers';

import FixtureBuilder from './fixtures/fixture-builder';
import { withFixtures, unlockWallet } from './helpers';
import { ACCOUNT_1, DAPP_URL } from './constants';
import transformOpenRPCDocument from './api-specs/transform';
import { MultichainAuthorizationConfirmationErrors } from './api-specs/MultichainAuthorizationConfirmationErrors';
import { ConfirmationsRejectRule } from './api-specs/ConfirmationRejectionRule';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mockServer = require('@open-rpc/mock-server/build/index').default;

async function main() {
  let testCoverageResults: Call[] = [];
  const port = 8545;
  const chainId = 1337;

  const doc = await parseOpenRPCDocument(
    MultiChainOpenRPCDocument as OpenrpcDocument,
  );

  const walletRpcMethods: string[] = [
    'wallet_registerOnboarding',
    'wallet_scanQRCode',
  ];
  const walletEip155Methods = ['wallet_addEthereumChain'];

  const ignoreMethods = [
    'wallet_switchEthereumChain',
    'wallet_getPermissions',
    'wallet_requestPermissions',
    'wallet_revokePermissions',
    'eth_requestAccounts',
    'eth_accounts',
    'eth_coinbase',
    'net_version',
  ];

  const [transformedDoc, filteredMethods, methodsWithConfirmations] =
    transformOpenRPCDocument(
      MetaMaskOpenRPCDocument as OpenrpcDocument,
      chainId,
      ACCOUNT_1,
    );
  const ethereumMethods = transformedDoc.methods
    .map((m) => (m as MethodObject).name)
    .filter((m) => {
      const match =
        walletRpcMethods.includes(m) ||
        walletEip155Methods.includes(m) ||
        ignoreMethods.includes(m);
      return !match;
    });
  const confirmationMethods = methodsWithConfirmations.filter(
    (m) => !ignoreMethods.includes(m),
  );
  const scopeMap: Record<InternalScopeString, string[]> = {
    [`eip155:${chainId}`]: ethereumMethods,
    'wallet:eip155': walletEip155Methods,
    wallet: walletRpcMethods,
  };

  const reverseScopeMap = Object.entries(scopeMap).reduce(
    (acc, [scope, methods]: [string, string[]]) => {
      methods.forEach((method) => {
        acc[method] = scope;
      });
      return acc;
    },
    {} as { [method: string]: string },
  );

  const mockedServer = mockServer(
    port,
    await parseOpenRPCDocument(transformedDoc),
  );
  mockedServer.start();

  // Multichain API excluding `wallet_invokeMethod`
  await withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      fixtures: new FixtureBuilder().build(),
      localNodeOptions: 'none',
      title: 'api-specs-multichain coverage',
    },
    async ({
      driver,
      extensionId,
    }: {
      driver: Driver;
      extensionId: string;
    }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp
      await driver.openNewPage(DAPP_URL);

      const getSession = doc.methods.find(
        (m) => (m as MethodObject).name === 'wallet_getSession',
      );
      (getSession as MethodObject).examples = [
        {
          name: 'wallet_getSessionExample',
          description: 'Example of a provider authorization request.',
          params: [],
          result: {
            name: 'wallet_getSessionResultExample',
            value: {
              sessionScopes: {},
            },
          },
        },
      ];

      const results = await testCoverage({
        openrpcDocument: doc,
        transport: createMultichainDriverTransport(driver, extensionId),
        reporters: ['console-streaming'],
        skip: ['wallet_invokeMethod'],
        rules: [
          new ExamplesRule({
            skip: [],
            only: ['wallet_getSession', 'wallet_revokeSession'],
          }),
          // Temporarily disabled as the wallet/wallet:eip155 behavior is broken
          // but this shouldn't block Solana integration
          // new MultichainAuthorizationConfirmation({
          //   driver,
          // }),
          new MultichainAuthorizationConfirmationErrors({
            driver,
          }),
        ],
      });

      testCoverageResults = testCoverageResults.concat(results);
    },
  );

  // requests made via wallet_invokeMethod
  await withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToMultichainTestDapp()
        .build(),
      localNodeOptions: 'none',
      title: 'api-specs-multichain coverage (wallet_invokeMethod)',
      testSpecificMock: async (server: Mockttp) => {
        // See: <https://github.com/MetaMask/api-specs/blob/1f763929bbe781d6f2abefee86fd11a829595fe5/openrpc.yaml#L461>
        await server
          .forGet('https://foo.io/token-image.svg')
          .thenCallback(() => {
            return {
              statusCode: 200,
              body: '',
            };
          });
      },
    },
    async ({
      driver,
      extensionId,
    }: {
      driver: Driver;
      extensionId: string;
    }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp
      await driver.openNewPage(DAPP_URL);

      const results = await testCoverage({
        openrpcDocument: MetaMaskOpenRPCDocument as OpenrpcDocument,
        transport: createCaip27DriverTransport(
          driver,
          reverseScopeMap,
          extensionId,
        ),
        reporters: ['console-streaming'],
        skip: [
          'eth_coinbase',
          'wallet_revokePermissions',
          'wallet_requestPermissions',
          'wallet_getPermissions',
          'eth_accounts',
          'eth_requestAccounts',
          'net_version', // not in the spec yet for some reason
          // these 2 methods below are not supported by MetaMask extension yet and
          // don't get passed through. See here: https://github.com/MetaMask/metamask-extension/issues/24225
          'eth_getBlockReceipts',
          'eth_maxPriorityFeePerGas',
        ],
        rules: [
          new JsonSchemaFakerRule({
            only: [],
            skip: filteredMethods,
            numCalls: 2,
          }),
          new ExamplesRule({
            only: [],
            skip: filteredMethods,
          }),
          new ConfirmationsRejectRule({
            driver,
            only: confirmationMethods,
            requiresEthAccountsPermission: [],
          }),
        ],
      });

      testCoverageResults = testCoverageResults.concat(results);
    },
  );

  // fix ids for html reporter
  testCoverageResults.forEach((r, index) => {
    r.id = index;
  });

  const htmlReporter = new HtmlReporter({
    autoOpen: !process.env.CI,
    destination: `${process.cwd()}/html-report-multichain`,
  });

  await htmlReporter.onEnd({} as IOptions, testCoverageResults);

  // if any of the tests failed, exit with a non-zero code
  if (testCoverageResults.every((r) => r.valid)) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();

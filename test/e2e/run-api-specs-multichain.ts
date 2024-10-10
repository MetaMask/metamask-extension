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
import { IOptions } from '@open-rpc/test-coverage/build/coverage';
import { ScopeString } from '../../app/scripts/lib/multichain-api/scope';
import { Driver, PAGES } from './webdriver/driver';

import {
  createCaip27DriverTransport,
  createMultichainDriverTransport,
} from './api-specs/helpers';

import FixtureBuilder from './fixture-builder';
import {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  ACCOUNT_1,
} from './helpers';
import { MultichainAuthorizationConfirmation } from './api-specs/MultichainAuthorizationConfirmation';
import transformOpenRPCDocument from './api-specs/transform';
import { MultichainAuthorizationConfirmationErrors } from './api-specs/MultichainAuthorizationConfirmationErrors';
import { ConfirmationsRejectRule } from './api-specs/ConfirmationRejectionRule';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mockServer = require('@open-rpc/mock-server/build/index').default;

async function main() {
  const port = 8545;
  const chainId = 1337;
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder().build(),
      disableGanache: true,
      title: 'api-specs coverage',
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
      await openDapp(driver, undefined, DAPP_URL);

      const doc = await parseOpenRPCDocument(
        MultiChainOpenRPCDocument as OpenrpcDocument,
      );
      const providerAuthorize = doc.methods.find(
        (m) => (m as MethodObject).name === 'wallet_createSession',
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

      const transport = createMultichainDriverTransport(driver, extensionId);
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
      const scopeMap: Record<ScopeString, string[]> = {
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

      // fix the example for wallet_createSession
      (providerAuthorize as MethodObject).examples = [
        {
          name: 'wallet_createSessionExample',
          description: 'Example of a provider authorization request.',
          params: [
            {
              name: 'requiredScopes',
              value: {
                eip155: {
                  references: ['1337'],
                  methods: ethereumMethods,
                  notifications: ['eth_subscription'],
                },
                'wallet:eip155': {
                  methods: walletEip155Methods,
                  notifications: [],
                },
                wallet: {
                  methods: walletRpcMethods,
                  notifications: [],
                },
              },
            },
          ],
          result: {
            name: 'wallet_createSessionResultExample',
            value: {
              sessionScopes: {
                [`eip155:${chainId}`]: {
                  accounts: [`eip155:${chainId}:${ACCOUNT_1}`],
                  methods: ethereumMethods,
                  notifications: ['eth_subscription'],
                },
                'wallet:eip155': {
                  accounts: [`wallet:eip155:${ACCOUNT_1}`],
                  methods: walletEip155Methods,
                  notifications: [],
                },
                wallet: {
                  accounts: [`wallet:eip155:${ACCOUNT_1}`],
                  methods: walletRpcMethods,
                  notifications: [],
                },
              },
            },
          },
        },
      ];

      const server = mockServer(
        port,
        await parseOpenRPCDocument(transformedDoc),
      );
      server.start();

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

      const testCoverageResults = await testCoverage({
        openrpcDocument: doc,
        transport,
        reporters: ['console-streaming'],
        skip: ['wallet_invokeMethod'],
        rules: [
          new ExamplesRule({
            skip: [],
            only: ['wallet_getSession', 'wallet_revokeSession'],
          }),
          new MultichainAuthorizationConfirmation({
            driver,
          }),
          new MultichainAuthorizationConfirmationErrors({
            driver,
          }),
        ],
      });

      const testCoverageResultsCaip27 = await testCoverage({
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
          }),
        ],
      });

      const joinedResults = testCoverageResults.concat(
        testCoverageResultsCaip27,
      );

      // fix ids for html reporter
      joinedResults.forEach((r, index) => {
        r.id = index;
      });

      const htmlReporter = new HtmlReporter({
        autoOpen: !process.env.CI,
        destination: `${process.cwd()}/html-report-multichain`,
      });

      await htmlReporter.onEnd({} as IOptions, joinedResults);

      await driver.quit();

      // if any of the tests failed, exit with a non-zero code
      if (joinedResults.every((r) => r.valid)) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    },
  );
}

main();

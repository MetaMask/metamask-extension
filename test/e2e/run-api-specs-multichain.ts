import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import {
  MultiChainOpenRPCDocument,
  MetaMaskOpenRPCDocument,
} from '@metamask/api-specs';

import { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import { Driver, PAGES } from './webdriver/driver';

import { createMultichainDriverTransport } from './api-specs/helpers';

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
    async ({ driver }: { driver: Driver }) => {
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
                  references: ['1'],
                  methods: ['eth_sendTransaction', 'eth_getBalance'],
                  notifications: [],
                },
              },
            },
            {
              name: 'optionalScopes',
              value: {
                'eip155:1337': {
                  methods: ['eth_sendTransaction', 'eth_getBalance'],
                  notifications: [],
                },
              },
            },
          ],
          result: {
            name: 'wallet_createSessionResultExample',
            value: {
              sessionId: '0xdeadbeef',
              sessionScopes: {
                'eip155:1': {
                  accounts: [`eip155:1:${ACCOUNT_1}`],
                  methods: ['eth_sendTransaction', 'eth_getBalance'],
                  notifications: [],
                },
                [`eip155:${chainId}`]: {
                  accounts: [`eip155:${chainId}:${ACCOUNT_1}`],
                  methods: ['eth_sendTransaction', 'eth_getBalance'],
                  notifications: [],
                },
              },
            },
          },
        },
      ];

      const transport = createMultichainDriverTransport(driver);
      const transformedDoc = transformOpenRPCDocument(
        MetaMaskOpenRPCDocument as OpenrpcDocument,
        chainId,
        ACCOUNT_1,
      );

      const server = mockServer(port, transformedDoc);
      server.start();

      await parseOpenRPCDocument(MetaMaskOpenRPCDocument as never);

      const testCoverageResults = await testCoverage({
        openrpcDocument: doc,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({
            autoOpen: !process.env.CI,
            destination: `${process.cwd()}/html-report-multichain`,
          }),
        ],
        skip: ['wallet_invokeMethod'],
        rules: [
          new MultichainAuthorizationConfirmation({
            driver,
          }),
          new MultichainAuthorizationConfirmationErrors({
            driver,
          }),
        ],
      });

      await driver.quit();

      // if any of the tests failed, exit with a non-zero code
      if (testCoverageResults.every((r) => r.valid)) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    },
  );
}

main();

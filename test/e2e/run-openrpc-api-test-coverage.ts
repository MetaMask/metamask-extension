import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';

import { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import { MetaMaskOpenRPCDocument } from '@metamask/api-specs';
import { ConfirmationsRejectRule } from './api-specs/ConfirmationRejectionRule';

import { Driver, PAGES } from './webdriver/driver';

import { createDriverTransport } from './api-specs/helpers';

import FixtureBuilder from './fixture-builder';
import {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  ACCOUNT_1,
} from './helpers';
import transformOpenRPCDocument from './api-specs/transform';

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

      const transport = createDriverTransport(driver);
      const doc: OpenrpcDocument = transformOpenRPCDocument(
        MetaMaskOpenRPCDocument as unknown as OpenrpcDocument,
        chainId,
        ACCOUNT_1,
      );

      const server = mockServer(port, doc);
      server.start();

      // TODO: move these to a "Confirmation" tag in api-specs
      const methodsWithConfirmations = [
        'wallet_requestPermissions',
        'eth_requestAccounts',
        'wallet_watchAsset',
        'personal_sign', // requires permissions for eth_accounts
        'wallet_addEthereumChain',
        'eth_signTypedData_v4', // requires permissions for eth_accounts
        'wallet_switchEthereumChain',

        // commented out because its not returning 4001 error.
        // see here https://github.com/MetaMask/metamask-extension/issues/24227
        // 'eth_getEncryptionPublicKey', // requires permissions for eth_accounts
      ];
      const filteredMethods = doc.methods
        .filter((_m: unknown) => {
          const m = _m as MethodObject;
          return (
            m.name.includes('snap') ||
            m.name.includes('Snap') ||
            m.name.toLowerCase().includes('account') ||
            m.name.includes('crypt') ||
            m.name.includes('blob') ||
            m.name.includes('sendTransaction') ||
            m.name.startsWith('wallet_scanQRCode') ||
            methodsWithConfirmations.includes(m.name) ||
            // filters are currently 0 prefixed for odd length on
            // extension which doesn't pass spec
            // see here: https://github.com/MetaMask/eth-json-rpc-filters/issues/152
            m.name.includes('filter') ||
            m.name.includes('Filter')
          );
        })
        .map((m) => (m as MethodObject).name);

      const testCoverageResults = await testCoverage({
        openrpcDocument: await parseOpenRPCDocument(doc),
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        skip: [
          'eth_coinbase',
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
            only: methodsWithConfirmations,
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

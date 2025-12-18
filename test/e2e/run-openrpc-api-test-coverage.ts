import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';

import { OpenrpcDocument } from '@open-rpc/meta-schema';
import { MetaMaskOpenRPCDocument } from '@metamask/api-specs';
import { ConfirmationsRejectRule } from './api-specs/ConfirmationRejectionRule';

import { Driver, PAGES } from './webdriver/driver';

import { createDriverTransport } from './api-specs/helpers';

import FixtureBuilder from './fixtures/fixture-builder';
import { withFixtures, unlockWallet } from './helpers';
import { DAPP_URL, ACCOUNT_1 } from './constants';
import transformOpenRPCDocument from './api-specs/transform';
import HomePage from './page-objects/pages/home/homepage';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mockServer = require('@open-rpc/mock-server/build/index').default;

async function main() {
  const port = 8545;
  const chainId = 1337;
  await withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      fixtures: new FixtureBuilder().build(),
      localNodeOptions: 'none',
      title: 'api-specs coverage',
    },
    async ({ driver }: { driver: Driver }) => {
      const transport = createDriverTransport(driver);
      const [doc, filteredMethods, methodsWithConfirmations] =
        transformOpenRPCDocument(
          MetaMaskOpenRPCDocument as unknown as OpenrpcDocument,
          chainId,
          ACCOUNT_1,
        );
      const parsedDoc = await parseOpenRPCDocument(doc);

      const server = mockServer(port, parsedDoc);
      server.start();

      await unlockWallet(driver);
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      // We don't have balance so we expect to see Fund Your Wallet
      await homePage.checkExpectedBalanceIsDisplayed('0', 'ETH');

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp
      await driver.openNewPage(DAPP_URL);

      const testCoverageResults = await testCoverage({
        openrpcDocument: parsedDoc,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        skip: [
          'eth_coinbase',
          // these methods below are not supported by MetaMask extension yet and
          // don't get passed through. See here: https://github.com/MetaMask/metamask-extension/issues/24225
          'eth_getBlockReceipts',
          'eth_maxPriorityFeePerGas',
          'wallet_swapAsset',
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
            requiresEthAccountsPermission: [
              'personal_sign',
              'eth_signTypedData_v4',
              'eth_getEncryptionPublicKey',
            ],
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

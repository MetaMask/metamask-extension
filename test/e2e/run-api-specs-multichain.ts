import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';
import { MultiChainOpenRPCDocument } from '@metamask/api-specs';

import { Driver, PAGES } from './webdriver/driver';

import { createMulichainDriverTransport } from './api-specs/helpers';

import FixtureBuilder from './fixture-builder';
import {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  ACCOUNT_1,
} from './helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
// const mockServer = require('@open-rpc/mock-server/build/index').default;

async function main() {
  // const port = 8545;
  // const chainId = 1337;
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder().build(),
      title: 'api-specs coverage',
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp
      await openDapp(driver, undefined, DAPP_URL);

      const transport = createMulichainDriverTransport(driver);

      const testCoverageResults = await testCoverage({
        openrpcDocument: (await parseOpenRPCDocument(
          MultiChainOpenRPCDocument as never,
        )) as never,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        skip: [
          'provider_request'
        ],
        rules: [
          new JsonSchemaFakerRule({
            only: [],
            skip: [],
            numCalls: 2,
          }),
          new ExamplesRule({
            only: [],
            skip: [],
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

import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../development/lib/exit-with-error';
import { getFirstParentDirectoryThatExists, isWritable } from '../helpers/file';
import FixtureBuilder from './fixture-builder';
import { Mockttp } from 'mockttp';
import HomePage from './page-objects/pages/home/homepage';
import { mockFeatureFlag } from './tests/bridge/bridge-test-utils';
import BridgeQuotePage from './page-objects/pages/bridge/quote-page';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './tests/bridge/constants';
import {
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  unlockWallet,
  withFixtures,
} from './helpers';
import { Driver } from './webdriver/driver';

async function loadNewAccount(): Promise<number> {
  let loadingTimes: number = 0;

  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      localNodeOptions: 'ganache',
      disableServerMochaToBackground: true,
      title: 'benchmark-userActions-loadNewAccount',
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);

      await driver.clickElement('[data-testid="account-menu-icon"]');
      await driver.clickElement(
        '[data-testid="multichain-account-menu-popover-action-button"]',
      );
      const timestampBeforeAction = new Date();
      await driver.clickElement(
        '[data-testid="multichain-account-menu-popover-add-account"]',
      );
      await driver.fill('[placeholder="Account 2"]', '2nd account');
      await driver.clickElement({ text: 'Add account', tag: 'button' });
      await driver.waitForSelector({
        css: '.currency-display-component__text',
        text: '0',
      });
      const timestampAfterAction = new Date();
      loadingTimes =
        timestampAfterAction.getTime() - timestampBeforeAction.getTime();
    },
  );
  return loadingTimes;
}

async function confirmTx(): Promise<number> {
  let loadingTimes: number = 0;
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      localNodeOptions: 'ganache',
      disableServerMochaToBackground: true,
      title: 'benchmark-userActions-confirmTx',
    },
    async ({ driver }: { driver: Driver }) => {
      await logInWithBalanceValidation(driver);

      await openActionMenuAndStartSendFlow(driver);

      await driver.fill(
        'input[placeholder="Enter public address (0x) or domain name"]',
        '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      );

      await driver.fill('.unit-input__input', '1');

      await driver.waitForSelector({ text: 'Continue', tag: 'button' });
      await driver.clickElement({ text: 'Continue', tag: 'button' });

      const timestampBeforeAction = new Date();

      await driver.waitForSelector({ text: 'Confirm', tag: 'button' });
      await driver.clickElement({ text: 'Confirm', tag: 'button' });

      await driver.clickElement(
        '[data-testid="account-overview__activity-tab"]',
      );
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 1;
      }, 10000);

      await driver.waitForSelector('.transaction-status-label--confirmed');
      const timestampAfterAction = new Date();
      loadingTimes =
        timestampAfterAction.getTime() - timestampBeforeAction.getTime();
    },
  );
  return loadingTimes;
}

async function bridgeUserActions(): Promise<any> {
  let loadPage: number = 0;
  let loadAssetPicker: number = 0;
  let searchToken: number = 0;

  const fixtureBuilder = new FixtureBuilder().withNetworkControllerOnMainnet();

  await withFixtures(
    {
      fixtures: fixtureBuilder.build(),
      disableServerMochaToBackground: true,
      localNodeOptions: 'ganache',
      title: 'benchmark-userActions-bridgeUserActions',
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockFeatureFlag(mockServer, {
          'extension-config': {
            ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
            support: true,
          },
        }),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await logInWithBalanceValidation(driver);
      const homePage = new HomePage(driver);
      const quotePage = new BridgeQuotePage(driver);

      const timestampBeforeLoadPage = new Date();
      await homePage.startBridgeFlow();
      const timestampAfterLoadPage = new Date();

      loadPage =
        timestampAfterLoadPage.getTime() - timestampBeforeLoadPage.getTime();

      const timestampBeforeClickAssetPicker = new Date();
      await driver.clickElement(quotePage.sourceAssetPickerButton);
      const timestampAfterClickAssetPicker = new Date();

      loadAssetPicker =
        timestampAfterClickAssetPicker.getTime() -
        timestampBeforeClickAssetPicker.getTime();

      const tokenToSearch = 'FXS';
      const timestampBeforeTokenSearch = new Date();
      await driver.fill(quotePage.assetPrickerSearchInput, tokenToSearch);
      await driver.waitForSelector({
        text: tokenToSearch,
        css: quotePage.tokenButton,
      });
      const timestampAferTokenSearch = new Date();

      searchToken =
        timestampAferTokenSearch.getTime() -
        timestampBeforeTokenSearch.getTime();
    },
  );
  return { loadPage, loadAssetPicker, searchToken };
}

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run a page load benchmark',
    (_yargs) =>
      _yargs.option('out', {
        description:
          'Output filename. Output printed to STDOUT of this is omitted.',
        type: 'string',
        normalize: true,
      }),
  );

  const results: Record<string, number> = {};
  results.loadNewAccount = await loadNewAccount();
  results.confirmTx = await confirmTx();
  const bridgeResults = await bridgeUserActions();
  results.bridge = bridgeResults;
  const { out } = argv as { out?: string };

  if (out) {
    const outputDirectory = path.dirname(out);
    const existingParentDirectory = await getFirstParentDirectoryThatExists(
      outputDirectory,
    );
    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }
    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }
    await fs.writeFile(out, JSON.stringify(results, null, 2));
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});

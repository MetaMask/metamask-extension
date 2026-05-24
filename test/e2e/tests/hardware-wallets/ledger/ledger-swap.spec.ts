import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import { checkActivityTransaction } from '../../swaps/shared';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { mockLedgerTransactionRequests } from './mocks';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x1158e460913d00000' },
];

function approveLedgerBlindSigning(
  interaction: import('../../../speculos/device-interaction').DeviceInteraction,
  apduBridge: import('../../../speculos/apdu-bridge').ApduBridge,
  scrollCount?: number,
) {
  return apduBridge.waitForSigningApduAndApproveBlindSigning(
    interaction,
    90000,
    scrollCount,
  );
}

// Swap test requires significant mock infrastructure updates to match the
// current MetaMask swap UI redesign. The token picker, trade API, and
// confirmation flow have all changed. Tracked separately.
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Ledger Swap @speculos', function (this: Suite) {
  this.timeout(180000);

  let shared: SharedSpeculosContext;

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('swaps ETH to DAI', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSmartTransactionsOptedOut()
          .withSpeculosLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        localNodeOptions: {
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerTransactionRequests,
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
      },
      async ({
        driver,
        interaction,
        apduBridge,
      }) => {
        await login(driver, {
          expectedBalance: '25',
          waitForNonEvmAccounts: false,
        });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const homePage = new HomePage(driver);
        await homePage.checkIfSwapButtonIsClickable();

        await homePage.startSwapFlow();

        if (isFirefox) {
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.closeWindow();
        }

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();

        await swapPage.selectSourceToken('TESTETH');

        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');

        await swapPage.dismissManualTokenWarning();
        await swapPage.checkSwapButtonIsEnabled();
        await driver.delay(5000);

        const ledgerDone = approveLedgerBlindSigning(interaction, apduBridge);

        await swapPage.submitSwap();
        await swapPage.waitForTransactionToComplete();

        await ledgerDone;

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { cleanupSpeculosEnvironment } from '../../../speculos/cleanup';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import { WINDOW_TITLES } from '../../../constants';

describe('Ledger Personal Sign Debug @speculos', function () {
  this.timeout(180000);

  it('traces personal sign ensureDeviceReady', async function () {
    await cleanupSpeculosEnvironment();
    const shared = await startSharedSpeculos();
    try {
      await withSpeculosAutoApprove(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withLedgerAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: SPECULOS_LEDGER_ADDRESS,
            })
            .build(),
          title: this.test?.fullTitle(),
          sharedContext: shared,
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await testDappPage.personalSign();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Wait for confirmation page
          await driver.delay(5000);

          const step1 = await driver.executeScript(
            `return {
              url: window.location.href,
              hasReconnectBtn: !!document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'),
              hasConfirmBtn: !!document.querySelector('[data-testid="confirm-footer-button"]'),
              confirmDisabled: (() => { const b = document.querySelector('[data-testid="confirm-footer-button"]'); return b ? b.disabled : null; })(),
              body: document.body?.innerText?.substring(0, 400),
            }`,
          );
          console.log('[TRACE] Step 1 - Confirm page:', JSON.stringify(step1));

          // Try clicking reconnect if present
          const confirmation = new Confirmation(driver);
          try {
            await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
            console.log('[TRACE] Step 2 - Confirm clicked');
          } catch (e) {
            console.log('[TRACE] Step 2 - Confirm failed:', (e as Error).message);
            const step2 = await driver.executeScript(
              `return {
                url: window.location.href,
                hasReconnectBtn: !!document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'),
                hasConfirmBtn: !!document.querySelector('[data-testid="confirm-footer-button"]'),
                confirmDisabled: (() => { const b = document.querySelector('[data-testid="confirm-footer-button"]'); return b ? b.disabled : null; })(),
                body: document.body?.innerText?.substring(0, 400),
              }`,
            );
            console.log('[TRACE] Step 2b - State after failure:', JSON.stringify(step2));
          }
        },
      );
    } finally {
      await stopSharedSpeculos(shared);
    }
  });
});

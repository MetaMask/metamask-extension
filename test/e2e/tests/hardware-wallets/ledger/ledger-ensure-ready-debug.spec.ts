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
import { createInternalTransaction } from '../../../page-objects/flows/transaction';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Ledger EnsureDeviceReady Debug @speculos', function () {
  this.timeout(180000);

  it('traces the ensureDeviceReady flow', async function () {
    await cleanupSpeculosEnvironment();
    const shared = await startSharedSpeculos();
    try {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          sharedContext: shared,
          seedBalances: [
            {
              address: SPECULOS_LEDGER_ADDRESS,
              balance: '0x100000000000000000000',
            },
          ],
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          // Create a send transaction to get to confirmation page
          await createInternalTransaction({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });

          // Wait for confirmation page to render
          await driver.delay(5000);

          // Step 1: Check what's on the page
          const step1 = await driver.executeScript(
            `return {
              url: window.location.href,
              hasReconnectBtn: !!document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'),
              hasConfirmBtn: !!document.querySelector('[data-testid="confirm-footer-button"]'),
              reconnectText: (() => { const b = document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'); return b ? b.textContent : null; })(),
              confirmDisabled: (() => { const b = document.querySelector('[data-testid="confirm-footer-button"]'); return b ? b.disabled : null; })(),
            }`,
          );
          console.log('[TRACE] Step 1 - Page state:', JSON.stringify(step1));

          // Step 2: Check navigator.hid mock state
          const step2 = await driver.executeScript(
            `return {
              hasMock: typeof navigator.hid !== 'undefined',
              getDevicesResult: (async () => { try { const d = await navigator.hid.getDevices(); return d.map(x => ({ vid: x.vendorId, pid: x.productId, name: x.productName, opened: x.opened })); } catch(e) { return 'error: ' + e.message; } })(),
              hasSpeculosDevice: !!window.__speculosDevice,
            }`,
          );
          // Resolve the async getDevicesResult
          const step2Devices = await driver.executeScript(
            `return (async () => { try { const d = await navigator.hid.getDevices(); return d.map(x => ({ vid: x.vendorId, pid: x.productId, name: x.productName, opened: x.opened })); } catch(e) { return 'error: ' + e.message; } })()`,
          );
          console.log('[TRACE] Step 2 - HID mock:', JSON.stringify({ hasMock: step2.hasMock, hasSpeculosDevice: step2.hasSpeculosDevice, devices: step2Devices }));

          // Step 3: Click the reconnect button and monitor what happens
          const reconnectBtn = '[data-testid="reconnect-hardware-wallet-button"]';
          try {
            await driver.waitForSelector(reconnectBtn, 5000);
            await driver.clickElement(reconnectBtn);
            console.log('[TRACE] Step 3 - Clicked reconnect button');
          } catch (e) {
            console.log('[TRACE] Step 3 - No reconnect button:', (e as Error).message);
          }

          // Step 4: Wait and check if device became ready
          await driver.delay(10000);
          const step4 = await driver.executeScript(
            `return {
              url: window.location.href,
              hasReconnectBtn: !!document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'),
              hasConfirmBtn: !!document.querySelector('[data-testid="confirm-footer-button"]'),
              confirmDisabled: (() => { const b = document.querySelector('[data-testid="confirm-footer-button"]'); return b ? b.disabled : null; })(),
              body: document.body?.innerText?.substring(0, 300),
            }`,
          );
          console.log('[TRACE] Step 4 - After reconnect click (10s):', JSON.stringify(step4));

          // Step 5: Check extension console errors via CDP
          const step5 = await driver.executeScript(
            `return {
              wsConnected: !!window.__webHIDMockInjected,
              consoleErrors: (window.__consoleErrors || []).slice(-5),
            }`,
          );
          console.log('[TRACE] Step 5 - Mock + errors:', JSON.stringify(step5));
        },
      );
    } finally {
      await stopSharedSpeculos(shared);
    }
  });
});

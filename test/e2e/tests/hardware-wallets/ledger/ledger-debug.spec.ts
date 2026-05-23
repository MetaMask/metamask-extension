import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { cleanupSpeculosEnvironment } from '../../../speculos/cleanup';
import { login } from '../../../page-objects/flows/login.flow';
import { connectLedgerDevice } from '../../../page-objects/flows/account-list.flow';
import HomePage from '../../../page-objects/pages/home/homepage';

describe('Ledger Debug @speculos', function () {
  this.timeout(120000);

  it('debug: send flow page state', async function () {
    await cleanupSpeculosEnvironment();
    const shared = await startSharedSpeculos();
    try {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2()
            .withPreferencesController({ securityAlertsEnabled: false })
            .build(),
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
          await login(driver);
          await connectLedgerDevice(driver);
          const homePage = new HomePage(driver);
          await homePage.checkExpectedBalanceIsDisplayed('1.21M');

          await driver.delay(2000);
          const beforeSend = await driver.executeScript(
            `return { url: window.location.href, body: document.body?.innerText?.substring(0, 500) }`,
          );
          console.log(
            '[DEBUG] Before startSendFlow:',
            JSON.stringify(beforeSend),
          );

          await homePage.startSendFlow();
          await driver.delay(3000);

          const sendState = await driver.executeScript(
            `return { url: window.location.href, body: document.body?.innerText?.substring(0, 500), hasCurrencyInput: !!document.querySelector('[data-testid="currency-input"]') }`,
          );
          console.log(
            '[DEBUG] After startSendFlow:',
            JSON.stringify(sendState),
          );
        },
      );
    } finally {
      await stopSharedSpeculos(shared);
    }
  });
});

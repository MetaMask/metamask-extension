import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Ledger Send Debug @speculos', function () {
  this.timeout(180000);

  it('debug: send with preloaded Ledger account', async function () {
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

          await sendRedesignedTransactionToAddress({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });
        },
      );
    } finally {
      await stopSharedSpeculos(shared);
    }
  });
});

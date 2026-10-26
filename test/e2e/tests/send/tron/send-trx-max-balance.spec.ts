import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import {
  confirmTronSendAndAssertActivity,
  landOnTronSendScreen,
} from '../../../page-objects/flows/tron-send.flow';
import { TRON_RECIPIENT_ADDRESS } from '../../tron/mocks/common-tron';
import {
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
} from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { formatSunAmount } from './utils/formatSunAmount';

/**
 * Fee buffer (in sun) subtracted from the seeded TRX balance when performing a
 * total-balance send, so the transaction can still pay its bandwidth/energy
 * cost. TRC20 sends do not need this: fees are paid in TRX, not the token.
 */
const TRON_SEND_FEE_BUFFER_IN_SUN = 1_000_000;

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('sends fee-buffered TRX balance via manual full-amount entry', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        const sendAmount = formatSunAmount(
          TRON_PORTFOLIO_TRX_BALANCE_IN_SUN - TRON_SEND_FEE_BUFFER_IN_SUN,
        );
        await sendPage.fillAmount(sendAmount);
        await sendPage.pressContinueButton();

        await confirmTronSendAndAssertActivity({ driver });
      },
    );
  });
});

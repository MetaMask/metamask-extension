import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { landOnTronSendScreen } from '../../../page-objects/flows/tron-send.flow';
import { TRON_RECIPIENT_ADDRESS } from '../../tron/mocks/common-tron';
import { TRON_PORTFOLIO_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks Continue when amount exceeds balance', async function () {
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
        await sendPage.fillAmount('999999');
        await sendPage.checkInsufficientFundsError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });
});

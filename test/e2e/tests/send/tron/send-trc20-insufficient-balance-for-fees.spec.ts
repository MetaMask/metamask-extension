import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { landOnTronSendScreen } from '../../../page-objects/flows/tron-send.flow';
import { TRON_RECIPIENT_ADDRESS } from '../../tron/mocks/common-tron';
import { TRON_LOW_TRX_WITH_USDT_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { getTronTrc20AssetId } from './utils/getTronTrc20AssetId';

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_LOW_TRX_WITH_USDT_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: unknown[];
      }) => {
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
          expectedNativeBalance: null,
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        // With 1 sun TRX, Continue builds the TRC20 tx then fails fee cover.
        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });
});

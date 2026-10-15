import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import {
  confirmTronSendAndAssertActivity,
  landOnTronSendScreen,
} from '../../../page-objects/flows/tron-send.flow';
import { TRON_RECIPIENT_ADDRESS } from '../../tron/mocks/common-tron';
import { TRON_PORTFOLIO_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { getTronTrc20AssetId } from './utils/getTronTrc20AssetId';

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('sends part of USDT balance and shows it pending then confirmed', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
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
          // Homepage rounds 2.804595 → 2.805 (same as assets.spec.ts).
          expectedTokenBalance: '2.805',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.waitForSendAmountBalance();
        await sendPage.pressContinueButton();

        await confirmTronSendAndAssertActivity({
          driver,
          expectedAmount: '-1 USDT',
        });
      },
    );
  });
});

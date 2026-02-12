import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { mockTransactions } from '../../helpers/mock-server';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';

const FROM_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const TO_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const ONE_ETH = '1000000000000000000';

describe('Editing Confirm Transaction', function (this: Suite) {
  it('approves a transaction stuck in approved state on boot', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: { hardfork: 'london' },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockTransactions(mockServer, [
            {
              hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              from: FROM_ADDRESS,
              to: TO_ADDRESS,
              value: ONE_ETH,
              gas: 25000,
              gasPrice: 1500000012,
              gasUsed: 21000,
              isError: false,
              nonce: 0,
              blockNumber: 1,
              chainId: 1337,
              methodId: '0x',
              timestamp: new Date().toISOString(),
              transactionType: 'SEND',
              valueTransfers: [
                {
                  from: FROM_ADDRESS,
                  to: TO_ADDRESS,
                  amount: ONE_ETH,
                  decimal: 18,
                  symbol: 'ETH',
                  contractAddress: null,
                },
              ],
            },
          ]);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await new HomePage(driver).goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity();
      },
    );
  });
});

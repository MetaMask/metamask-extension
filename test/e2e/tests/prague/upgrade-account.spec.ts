import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import Eip7704AndSendCalls from '../../page-objects/pages/confirmations/prague/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';

async function mockEip7702FeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              'confirmations_eip_7702': {
                contracts: {
                  '0xaa36a7': [
                    {
                      signature:
                        '0x016cf109489c415ba28e695eb3cb06ac46689c5c49e2aba101d7ec2f68c890282563b324f5c8df5e0536994451825aa235438b7346e8c18b4e64161d990781891c',
                      address: '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454',
                    },
                  ],
                  '0x539': [
                    {
                      address: '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f',
                      signature:
                        '0x4c15775d0c6d5bd37a7aa7aafc62e85597ea705024581b8b5cb0edccc4e6a69e26c495b3ae725815a377c9789bff43bf19e4dd1eaa679e65133e49ceee3ea87f1b',
                    },
                  ],
                },
                supportedChains: ['0xaa36a7', '0x539'],
              },
            },
          ],
        };
      }),
  ];
}

describe('Upgrade Account', function (this: Suite) {
  it('an EOA account can be upgraded when triggering a batch tx from a dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkControllerOnSepolia()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 11155111,
              hardfork: 'prague',
              loadState: './test/e2e/seeder/network-states/withDelegator.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const upgradeAndBatchTxConfirmation = new Eip7704AndSendCalls(driver);
        await upgradeAndBatchTxConfirmation.confirmUpgradeCheckbox();
        await upgradeAndBatchTxConfirmation.confirmUpgradeAndBatchTx();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
      },
    );
  });
});

import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';

async function mockEip7702FeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          'confirmations-eip-7702': {
            supportedChains: ['0x7a69', '0xaa36a7'],
            contractAddresses: {
              '0x7a69': ['0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f'],
              '0xaa36a7': ['0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454'],
            }
          }
        },
      })),
  ];
}

describe('Upgrade Account', function (this: Suite) {
  it('an EOA account can be upgraded when triggering a batch tx from a dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: {
          hardfork: 'prague',
          loadState: './test/e2e/seeder/network-states/withDelegator.json',
        },
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSendCalls();

      },
    );
  });
});
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { WINDOW_TITLES } from '../../../constants';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import ContractDeploymentConfirmation from '../../../page-objects/pages/confirmations/redesign/deploy-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import FixtureBuilder from '../../../fixture-builder';
import { withFixtures } from '../../../helpers';
import { TestSuiteArguments } from './shared';

describe('Confirmation Redesign Contract Deployment Component', function () {
  it(`Sends a contract deployment type 0 transaction (Legacy)`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        // deploy contract
        await testDapp.clickPiggyBankContract();
        const deploymentConfirmation = new ContractDeploymentConfirmation(
          driver,
        );
        await deploymentConfirmation.checkTitle();
        await deploymentConfirmation.checkDeploymentSiteInfo();
        await deploymentConfirmation.clickFooterConfirmButton();

        // check activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAction({ action: 'Contract deployment' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      },
    );
  });

  it(`Sends a contract deployment type 2 transaction (EIP1559)`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);

        // deploy contract
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickPiggyBankContract();
        const deploymentConfirmation = new ContractDeploymentConfirmation(
          driver,
        );
        await deploymentConfirmation.checkTitle();
        await deploymentConfirmation.checkDeploymentSiteInfo();
        await deploymentConfirmation.clickFooterConfirmButton();

        // check activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAction({ action: 'Contract deployment' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      },
    );
  });
});

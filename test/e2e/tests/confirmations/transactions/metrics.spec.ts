/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { strict as assert } from 'assert';
import { MockedEndpoint, MockttpServer } from 'mockttp';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../../../shared/constants/transaction';
import { Driver } from '../../../webdriver/driver';
import { MOCK_META_METRICS_ID, WINDOW_TITLES } from '../../../constants';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractDeploymentConfirmation from '../../../page-objects/pages/confirmations/redesign/deploy-confirmation';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { assertAdvancedGasDetails } from './shared';

const { withFixtures, getEventPayloads } = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');

describe('Metrics', function () {
  it('Sends a contract interaction type 2 transaction (EIP1559) with the right properties in the metric events', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mocks,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint;
      }) => {
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

        // deposit contract
        await testDapp.createDepositTransaction();
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickAdvancedDetailsButton();

        await assertAdvancedGasDetails(driver);
        await transactionConfirmation.clickFooterConfirmButton();

        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.equal(events.length, 16);

        // deployment tx -- no ui_customizations
        assert.equal(
          events[0].event,
          AnonymousTransactionMetaMetricsEvent.added,
        );
        assert.equal(
          events[0].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[0].properties.transaction_advanced_view, undefined);
        assert.equal(events[1].event, TransactionMetaMetricsEvent.added);
        assert.equal(
          events[1].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[1].properties.transaction_advanced_view, undefined);
        assert.equal(
          events[2].event,
          AnonymousTransactionMetaMetricsEvent.submitted,
        );
        assert.equal(
          events[2].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[2].properties.transaction_advanced_view, undefined);
        assert.equal(events[3].event, TransactionMetaMetricsEvent.submitted);
        assert.equal(
          events[3].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[3].properties.transaction_advanced_view, undefined);
        assert.equal(
          events[4].event,
          AnonymousTransactionMetaMetricsEvent.approved,
        );
        assert.equal(
          events[4].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[4].properties.transaction_advanced_view, undefined);
        assert.equal(events[5].event, TransactionMetaMetricsEvent.approved);
        assert.equal(
          events[5].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[5].properties.transaction_advanced_view, undefined);
        assert.equal(
          events[6].event,
          AnonymousTransactionMetaMetricsEvent.finalized,
        );
        assert.equal(
          events[6].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[6].properties.transaction_advanced_view, undefined);
        assert.equal(events[7].event, TransactionMetaMetricsEvent.finalized);
        assert.equal(
          events[7].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[7].properties.transaction_advanced_view, undefined);

        // deposit tx (contract interaction) -- ui_customizations is set
        assert.equal(
          events[8].event,
          AnonymousTransactionMetaMetricsEvent.added,
        );
        assert.equal(
          events[8].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[8].properties.transaction_advanced_view, undefined);
        assert.equal(events[9].event, TransactionMetaMetricsEvent.added);
        assert.equal(
          events[9].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[9].properties.transaction_advanced_view, undefined);
        assert.equal(
          events[10].event,
          AnonymousTransactionMetaMetricsEvent.submitted,
        );
        assert.equal(
          events[10].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[10].properties.transaction_advanced_view, true);
        assert.equal(events[11].event, TransactionMetaMetricsEvent.submitted);
        assert.equal(
          events[11].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[11].properties.transaction_advanced_view, true);
        assert.equal(
          events[12].event,
          AnonymousTransactionMetaMetricsEvent.approved,
        );
        assert.equal(
          events[12].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[12].properties.transaction_advanced_view, true);
        assert.equal(events[13].event, TransactionMetaMetricsEvent.approved);
        assert.equal(
          events[13].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[13].properties.transaction_advanced_view, true);
        assert.equal(
          events[14].event,
          AnonymousTransactionMetaMetricsEvent.finalized,
        );
        assert.equal(
          events[14].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[14].properties.transaction_advanced_view, true);
        assert.equal(events[15].event, TransactionMetaMetricsEvent.finalized);
        assert.equal(
          events[15].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[15].properties.transaction_advanced_view, true);
      },
    );
  });
});

async function mockedTrackedEvent(mockServer: MockttpServer, event: string) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mocks(server: MockttpServer) {
  return [
    // deployment tx
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.added,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.added),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.submitted,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.submitted),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.approved,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.approved),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.finalized,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.finalized),
    // deposit tx
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.added,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.added),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.submitted,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.submitted),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.approved,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.approved),
    await mockedTrackedEvent(
      server,
      AnonymousTransactionMetaMetricsEvent.finalized,
    ),
    await mockedTrackedEvent(server, TransactionMetaMetricsEvent.finalized),
  ];
}

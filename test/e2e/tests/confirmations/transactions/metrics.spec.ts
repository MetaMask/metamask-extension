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

const {
  withFixtures,
  getEventPayloads,
  assertInAnyOrder,
} = require('../../../helpers');

type MetricsEvent = {
  event: string;
  properties: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_type?: string;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ui_customizations?: string[];
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_advanced_view?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
const FixtureBuilder = require('../../../fixture-builder');

describe('Metrics', function () {
  it('Sends a contract interaction type 2 transaction (EIP1559) with the right properties in the metric events', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
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
        // verify UI before clicking advanced details to give time for the Transaction Added event to be emitted without Advanced Details being displayed
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkHeaderAccountNameIsDisplayed(
          'Account 1',
        );
        await transactionConfirmation.checkGasFeeSymbol('ETH');
        await transactionConfirmation.checkGasFee('0.0009');

        // enable the advanced view
        await transactionConfirmation.clickAdvancedDetailsButton();
        await transactionConfirmation.checkNonceSectionIsDisplayed();
        await transactionConfirmation.verifyAdvancedDetailsHexDataIsDisplayed(
          '0xd0e30db0',
        );

        await assertAdvancedGasDetails(driver);
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);

        const events = await getEventPayloads(driver, mockedEndpoints);

        // This is left for debugging purposes
        console.log(events);
        assert.equal(events.length, 16);

        const findEventsByName = (eventType: string) =>
          events.filter((event: MetricsEvent) => event.event === eventType);

        // Separate events by transaction type
        const deploymentEvents = events.filter(
          (event: MetricsEvent) =>
            event.properties.transaction_type === 'contractDeployment',
        );
        const interactionEvents = events.filter(
          (event: MetricsEvent) =>
            event.properties.transaction_type === 'contractInteraction',
        );

        assert.equal(
          deploymentEvents.length,
          8,
          'Should have 8 deployment events',
        );
        assert.equal(
          interactionEvents.length,
          8,
          'Should have 8 interaction events',
        );

        // Assertion predicates for deployment transaction (no advanced view)
        const deploymentTransactionCheck = [
          (event: MetricsEvent) =>
            event.properties.ui_customizations?.[0] ===
            'redesigned_confirmation',
          (event: MetricsEvent) =>
            event.properties.transaction_advanced_view === undefined,
          (event: MetricsEvent) =>
            event.properties.transaction_type === 'contractDeployment',
        ];

        // Assertion predicates for contract interaction transaction (with advanced view)
        const interactionTransactionCheck = [
          (event: MetricsEvent) =>
            event.properties.ui_customizations?.[0] ===
            'redesigned_confirmation',
          (event: MetricsEvent) =>
            event.properties.transaction_type === 'contractInteraction',
        ];

        // Additional check for events that should have advanced view
        const interactionWithAdvancedViewCheck = [
          ...interactionTransactionCheck,
          (event: MetricsEvent) =>
            event.properties.transaction_advanced_view === true,
        ];

        // Additional check for "added" events that don't have advanced view yet
        const interactionAddedEventCheck = [
          ...interactionTransactionCheck,
          (event: MetricsEvent) =>
            event.properties.transaction_advanced_view === undefined,
        ];

        // Test Transaction Added events
        const addedAnonEvents = findEventsByName(
          AnonymousTransactionMetaMetricsEvent.added,
        );
        const addedEvents = findEventsByName(TransactionMetaMetricsEvent.added);

        assert.equal(addedAnonEvents.length, 2);
        assert.equal(addedEvents.length, 2);

        assert.ok(
          assertInAnyOrder(addedAnonEvents, [
            deploymentTransactionCheck,
            interactionAddedEventCheck,
          ]),
        );
        assert.ok(
          assertInAnyOrder(addedEvents, [
            deploymentTransactionCheck,
            interactionAddedEventCheck,
          ]),
        );

        // Test Transaction Submitted events
        const submittedAnonEvents = findEventsByName(
          AnonymousTransactionMetaMetricsEvent.submitted,
        );
        const submittedEvents = findEventsByName(
          TransactionMetaMetricsEvent.submitted,
        );

        assert.equal(submittedAnonEvents.length, 2);
        assert.equal(submittedEvents.length, 2);

        assert.ok(
          assertInAnyOrder(submittedAnonEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );
        assert.ok(
          assertInAnyOrder(submittedEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );

        // Test Transaction Approved events
        const approvedAnonEvents = findEventsByName(
          AnonymousTransactionMetaMetricsEvent.approved,
        );
        const approvedEvents = findEventsByName(
          TransactionMetaMetricsEvent.approved,
        );

        assert.equal(approvedAnonEvents.length, 2);
        assert.equal(approvedEvents.length, 2);

        assert.ok(
          assertInAnyOrder(approvedAnonEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );
        assert.ok(
          assertInAnyOrder(approvedEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );

        // Test Transaction Finalized events
        const finalizedAnonEvents = findEventsByName(
          AnonymousTransactionMetaMetricsEvent.finalized,
        );
        const finalizedEvents = findEventsByName(
          TransactionMetaMetricsEvent.finalized,
        );

        assert.equal(finalizedAnonEvents.length, 2);
        assert.equal(finalizedEvents.length, 2);

        assert.ok(
          assertInAnyOrder(finalizedAnonEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );
        assert.ok(
          assertInAnyOrder(finalizedEvents, [
            deploymentTransactionCheck,
            interactionWithAdvancedViewCheck,
          ]),
        );
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

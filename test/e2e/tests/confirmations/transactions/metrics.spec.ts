/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { strict as assert } from 'assert';
import { MockedEndpoint, MockttpServer } from 'mockttp';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../../../shared/constants/transaction';
import { Driver } from '../../../webdriver/driver';
import {
  confirmContractDeploymentTransaction,
  confirmDepositTransaction,
  createContractDeploymentTransaction,
  createDepositTransaction,
  openDAppWithContract,
  TestSuiteArguments,
} from './shared';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { withRedesignConfirmationFixtures } from '../helpers';

const {
  defaultGanacheOptionsForType2Transactions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
  getEventPayloads,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');

describe('Metrics', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('Sends a contract interaction type 2 transaction (EIP1559) with the right properties in the metric events', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        contractRegistry,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const smartContract = SMART_CONTRACTS.PIGGYBANK;

        await openDAppWithContract(driver, contractRegistry, smartContract);

        await createDepositTransaction(driver);
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmDepositTransaction(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);

        // deployment tx -- no ui_customizations
        assert.equal(
          events[0].event,
          AnonymousTransactionMetaMetricsEvent.added,
        );
        assert.equal(events[0].properties.ui_customizations, null);
        assert.equal(events[1].event, TransactionMetaMetricsEvent.added);
        assert.equal(events[1].properties.ui_customizations, null);
        assert.equal(
          events[2].event,
          AnonymousTransactionMetaMetricsEvent.submitted,
        );
        assert.equal(events[2].properties.ui_customizations, null);
        assert.equal(events[3].event, TransactionMetaMetricsEvent.submitted);
        assert.equal(events[3].properties.ui_customizations, null);
        assert.equal(
          events[4].event,
          AnonymousTransactionMetaMetricsEvent.approved,
        );
        assert.equal(events[4].properties.ui_customizations, null);
        assert.equal(events[5].event, TransactionMetaMetricsEvent.approved);
        assert.equal(events[5].properties.ui_customizations, null);
        assert.equal(
          events[6].event,
          AnonymousTransactionMetaMetricsEvent.finalized,
        );
        assert.equal(events[6].properties.ui_customizations, null);
        assert.equal(events[7].event, TransactionMetaMetricsEvent.finalized);
        assert.equal(events[7].properties.ui_customizations, null);

        // deposit tx (contract interaction) -- ui_customizations is set
        assert.equal(
          events[8].event,
          AnonymousTransactionMetaMetricsEvent.added,
        );
        assert.equal(
          events[8].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[9].event, TransactionMetaMetricsEvent.added);
        assert.equal(
          events[9].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(
          events[10].event,
          AnonymousTransactionMetaMetricsEvent.submitted,
        );
        assert.equal(
          events[10].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[11].event, TransactionMetaMetricsEvent.submitted);
        assert.equal(
          events[11].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(
          events[12].event,
          AnonymousTransactionMetaMetricsEvent.approved,
        );
        assert.equal(
          events[12].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[13].event, TransactionMetaMetricsEvent.approved);
        assert.equal(
          events[13].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(
          events[14].event,
          AnonymousTransactionMetaMetricsEvent.finalized,
        );
        assert.equal(
          events[14].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
        assert.equal(events[15].event, TransactionMetaMetricsEvent.finalized);
        assert.equal(
          events[15].properties.ui_customizations[0],
          'redesigned_confirmation',
        );
      },
      mockOverrides,
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

async function mockOverrides(server: MockttpServer) {
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

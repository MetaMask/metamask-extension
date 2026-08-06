/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionContainerType } from '@metamask/transaction-controller';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getEnforcedSimulationsMetricsProperties } from './enforced-simulations';
import { createBuilderRequest } from './test-utils';

const DEFAULT_PROPERTIES = {
  enforced_simulations_default_enabled: false,
  enforced_simulation_submitted_enabled: false,
  enforced_simulation_toggle_count: 0,
};

describe('enforced simulations builder', () => {
  it('reports baseline properties before transaction containers are configured', async () => {
    const result = await getEnforcedSimulationsMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          containerTypes: undefined,
        } as never,
      }),
    );

    expect(result).toStrictEqual({
      properties: DEFAULT_PROPERTIES,
      sensitiveProperties: {},
    });
  });

  it('reports that enforced simulations are disabled', async () => {
    const result = await getEnforcedSimulationsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.approved,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          containerTypes: [],
        } as never,
      }),
    );

    expect(result).toStrictEqual({
      properties: DEFAULT_PROPERTIES,
      sensitiveProperties: {},
    });
  });

  it('does not report a submitted state on the added event', async () => {
    const result = await getEnforcedSimulationsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.added,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          containerTypes: [TransactionContainerType.EnforcedSimulations],
        } as never,
      }),
    );

    expect(result.properties.enforced_simulation_submitted_enabled).toBe(false);
  });

  for (const eventName of [
    TransactionMetaMetricsEvent.approved,
    TransactionMetaMetricsEvent.submitted,
    TransactionMetaMetricsEvent.finalized,
  ]) {
    it(`reports enabled state on the ${eventName} event`, async () => {
      const result = await getEnforcedSimulationsMetricsProperties(
        createBuilderRequest({
          eventName,
          transactionMeta: {
            ...createBuilderRequest().transactionMeta,
            containerTypes: [TransactionContainerType.EnforcedSimulations],
          } as never,
        }),
      );

      expect(result.properties.enforced_simulation_submitted_enabled).toBe(
        true,
      );
    });
  }
});

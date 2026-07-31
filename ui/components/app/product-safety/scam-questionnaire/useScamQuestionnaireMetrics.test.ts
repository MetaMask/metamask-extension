/* eslint-disable @typescript-eslint/naming-convention -- Assertions mirror the
   snake_case analytics property keys required by segment-schema. */
// The global `it` resolves to Mocha's typings, which lack `each`.
import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { createEventBuilder } from '../../../../../shared/lib/analytics/create-event-builder';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import {
  type BalanceChange,
  type FiatAmount,
} from '../../../../pages/confirmations/components/simulation-details/types';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useBalanceChanges } from '../../../../pages/confirmations/components/simulation-details/useBalanceChanges';
import { useTransactionMetadataRequest } from '../../../../pages/confirmations/hooks/transactions/useTransactionMetadataRequest';
import { Q1_OPTIONS } from './scam-questionnaire.constants';
import { useScamQuestionnaireMetrics } from './useScamQuestionnaireMetrics';

jest.mock('../../../../hooks/useAnalytics');
jest.mock(
  '../../../../pages/confirmations/components/simulation-details/useBalanceChanges',
);
jest.mock(
  '../../../../pages/confirmations/hooks/transactions/useTransactionMetadataRequest',
);

const useAnalyticsMock = jest.mocked(useAnalytics);
const useBalanceChangesMock = jest.mocked(useBalanceChanges);
const useTransactionMetadataRequestMock = jest.mocked(
  useTransactionMetadataRequest,
);

/**
 * A balance change; negative amounts leave the wallet.
 * @param amount
 * @param usdAmount
 */
function buildBalanceChange(amount: number, usdAmount: FiatAmount) {
  return {
    asset: { chainId: '0x1', standard: TokenStandard.none },
    amount: new BigNumber(amount),
    fiatAmount: usdAmount,
    usdAmount,
  } satisfies BalanceChange;
}

const ANSWERS = { q1: Q1_OPTIONS[0] };

// `useBalanceChanges` is mocked, so only the shape matters here.
const TRANSACTION_META = {
  id: 'test-transaction',
  chainId: '0x1',
  networkClientId: 'mainnet',
  status: TransactionStatus.unapproved,
  time: 0,
  txParams: { from: '0x0000000000000000000000000000000000000000' },
  type: TransactionType.simpleSend,
} satisfies TransactionMeta;

/**
 * Renders the hook with the given simulation balance changes and returns both
 * the hook API and the spy on built analytics events.
 *
 * @param balanceChanges - Simulation balance changes to expose to the hook.
 */
function setup(balanceChanges: BalanceChange[] = []) {
  const trackEvent = jest.fn();

  // The real builder, so undefined-property filtering is exercised rather
  // than mocked away.
  useAnalyticsMock.mockReturnValue({ createEventBuilder, trackEvent });
  useBalanceChangesMock.mockReturnValue({
    pending: false,
    value: balanceChanges,
  });
  useTransactionMetadataRequestMock.mockReturnValue(TRANSACTION_META);

  const { result } = renderHook(() => useScamQuestionnaireMetrics());
  return { metrics: result.current, trackEvent };
}

/**
 * Properties of the single event passed to trackEvent.
 *
 * @param trackEvent - The trackEvent spy.
 */
function propertiesOf(trackEvent: jest.Mock) {
  expect(trackEvent).toHaveBeenCalledTimes(1);
  return trackEvent.mock.calls[0][0].properties;
}

describe('useScamQuestionnaireMetrics', () => {
  describe('simulation_sending_assets_total_value', () => {
    it('reports the USD total of assets leaving the wallet', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, 42.5)]);

      metrics.trackViewed(0);

      expect(propertiesOf(trackEvent)).toMatchObject({
        simulation_sending_assets_total_value: 42.5,
      });
    });

    it('sums multiple outgoing assets', () => {
      const { metrics, trackEvent } = setup([
        buildBalanceChange(-1, 10),
        buildBalanceChange(-2, 15.25),
      ]);

      metrics.trackViewed(0);

      expect(propertiesOf(trackEvent)).toMatchObject({
        simulation_sending_assets_total_value: 25.25,
      });
    });

    it('excludes incoming assets from the total', () => {
      const { metrics, trackEvent } = setup([
        buildBalanceChange(-1, 30),
        buildBalanceChange(5, 500),
      ]);

      metrics.trackViewed(0);

      expect(propertiesOf(trackEvent)).toMatchObject({
        simulation_sending_assets_total_value: 30,
      });
    });

    it('reports a positive value even though outgoing amounts are negative', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, -75)]);

      metrics.trackViewed(0);

      expect(
        propertiesOf(trackEvent).simulation_sending_assets_total_value,
      ).toBe(75);
    });

    it('omits the property when simulation produced no balance changes', () => {
      const { metrics, trackEvent } = setup([]);

      metrics.trackViewed(0);

      expect(propertiesOf(trackEvent)).not.toHaveProperty(
        'simulation_sending_assets_total_value',
      );
    });

    it('omits the property when fiat rates are unavailable', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, null)]);

      metrics.trackViewed(0);

      // Sent as absent rather than 0, so downstream sums read as a lower
      // bound instead of counting the send as free.
      expect(propertiesOf(trackEvent)).not.toHaveProperty(
        'simulation_sending_assets_total_value',
      );
    });

    it.each([
      {
        event: 'Viewed',
        fire: (m: ReturnType<typeof setup>['metrics']) => m.trackViewed(0),
      },
      {
        event: 'Warning Displayed',
        fire: (m: ReturnType<typeof setup>['metrics']) =>
          m.trackWarningDisplayed(ANSWERS),
      },
      {
        event: 'Completed',
        fire: (m: ReturnType<typeof setup>['metrics']) =>
          m.trackCompleted({
            status: 'payment_stopped',
            contactSupportClicked: false,
            answers: ANSWERS,
          }),
      },
      {
        event: 'Dismissed',
        fire: (m: ReturnType<typeof setup>['metrics']) =>
          m.trackDismissed({
            furthestStep: 0,
            contactSupportClicked: false,
            answers: ANSWERS,
          }),
      },
    ])(
      'is attached to Scam Questionnaire $event',
      ({ fire }: { fire: (m: ReturnType<typeof setup>['metrics']) => void }) => {
        const { metrics, trackEvent } = setup([buildBalanceChange(-1, 99)]);

        fire(metrics);

        expect(propertiesOf(trackEvent)).toMatchObject({
          simulation_sending_assets_total_value: 99,
          questionnaire_version: '1',
        });
      },
    );
  });

  describe('trackCompleted', () => {
    it('pairs the value with the outcome that stopped the payment', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, 1200)]);

      metrics.trackCompleted({
        status: 'payment_stopped',
        contactSupportClicked: false,
        answers: ANSWERS,
      });

      const [event] = trackEvent.mock.calls[0];
      expect(event.name).toBe(
        MetaMetricsEventName.ScamQuestionnaireCompleted as string,
      );
      expect(event.properties).toMatchObject({
        status: 'payment_stopped',
        simulation_sending_assets_total_value: 1200,
      });
    });
  });
});

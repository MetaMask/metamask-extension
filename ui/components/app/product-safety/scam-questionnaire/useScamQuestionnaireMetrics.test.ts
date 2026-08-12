/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { createEventBuilder } from '../../../../../shared/lib/analytics/create-event-builder';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
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

const ANSWERS = { q1: Q1_OPTIONS[0] };

const TRANSACTION_META = {
  id: 'test-transaction',
  chainId: '0x1',
  networkClientId: 'mainnet',
  status: TransactionStatus.unapproved,
  time: 0,
  txParams: { from: '0x0000000000000000000000000000000000000000' },
  type: TransactionType.simpleSend,
} satisfies TransactionMeta;

function buildBalanceChange(amount: number, usdAmount: FiatAmount) {
  return {
    asset: { chainId: '0x1', standard: TokenStandard.none },
    amount: new BigNumber(amount),
    fiatAmount: usdAmount,
    usdAmount,
  } satisfies BalanceChange;
}

function setup(balanceChanges: BalanceChange[] = []) {
  const trackEvent = jest.fn();

  useAnalyticsMock.mockReturnValue({ createEventBuilder, trackEvent });
  useBalanceChangesMock.mockReturnValue({
    pending: false,
    value: balanceChanges,
  });
  useTransactionMetadataRequestMock.mockReturnValue(TRANSACTION_META);

  const { result } = renderHook(() => useScamQuestionnaireMetrics());
  return { metrics: result.current, trackEvent };
}

function firedEvent(trackEvent: jest.Mock) {
  expect(trackEvent).toHaveBeenCalledTimes(1);
  return trackEvent.mock.calls[0][0];
}

describe('useScamQuestionnaireMetrics', () => {
  describe('trackViewed', () => {
    it('reports the step label', () => {
      const { metrics, trackEvent } = setup();

      metrics.trackViewed(3);

      expect(firedEvent(trackEvent)).toMatchObject({
        name: MetaMetricsEventName.ScamQuestionnaireViewed as string,
        properties: { step: 'warning', questionnaire_version: '1' },
      });
    });
  });

  describe('trackContactSupport', () => {
    it('reports the answers, red flag count and outgoing USD total', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, 99)]);

      metrics.trackContactSupport(ANSWERS);

      expect(firedEvent(trackEvent)).toMatchObject({
        name: MetaMetricsEventName.ScamQuestionnaireSupportContacted as string,
        properties: {
          category: MetaMetricsEventCategory.Confirmations,
          q1_answer: 'q1_yes',
          q2_answer: null,
          q3_answer: null,
          red_flag_count: 1,
          simulation_sending_assets_total_value: 99,
          questionnaire_version: '1',
        },
      });
    });
  });

  describe('trackCompleted', () => {
    it('reports the status, answers and outgoing USD total', () => {
      const { metrics, trackEvent } = setup([
        buildBalanceChange(-1, 10),
        buildBalanceChange(-2, 15.25),
      ]);

      metrics.trackCompleted({
        status: 'payment_stopped',
        answers: ANSWERS,
      });

      expect(firedEvent(trackEvent)).toMatchObject({
        name: MetaMetricsEventName.ScamQuestionnaireCompleted as string,
        properties: {
          status: 'payment_stopped',
          q1_answer: 'q1_yes',
          q2_answer: null,
          q3_answer: null,
          red_flag_count: 1,
          simulation_sending_assets_total_value: 25.25,
        },
      });
    });

    it('excludes incoming assets from the total', () => {
      const { metrics, trackEvent } = setup([
        buildBalanceChange(-1, 30),
        buildBalanceChange(5, 500),
      ]);

      metrics.trackCompleted({ status: 'proceeded', answers: ANSWERS });

      expect(
        firedEvent(trackEvent).properties.simulation_sending_assets_total_value,
      ).toBe(30);
    });

    it('omits the total when fiat rates are unavailable', () => {
      const { metrics, trackEvent } = setup([buildBalanceChange(-1, null)]);

      metrics.trackCompleted({ status: 'clean', answers: ANSWERS });

      expect(firedEvent(trackEvent).properties).not.toHaveProperty(
        'simulation_sending_assets_total_value',
      );
    });

    it('omits the total when simulation produced no balance changes', () => {
      const { metrics, trackEvent } = setup();

      metrics.trackCompleted({ status: 'clean', answers: ANSWERS });

      expect(firedEvent(trackEvent).properties).not.toHaveProperty(
        'simulation_sending_assets_total_value',
      );
    });
  });
});

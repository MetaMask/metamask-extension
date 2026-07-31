/* eslint-disable @typescript-eslint/naming-convention */
import { useMemo } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { type UIMetricsEventPayload } from '../../../../contexts/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useTransactionMetadataRequest } from '../../../../pages/confirmations/hooks/transactions/useTransactionMetadataRequest';
import { useBalanceChanges } from '../../../../pages/confirmations/components/simulation-details/useBalanceChanges';
import { calculateTotalFiat } from '../../../../pages/confirmations/components/simulation-details/fiat-display';
import {
  Answers,
  QUESTIONNAIRE_VERSION,
  getAnswerRecord,
  getRedFlagCount,
  stepLabelFromIndex,
} from './scam-questionnaire.constants';

export type CompletionStatus = 'clean' | 'payment_stopped' | 'proceeded';

/**
 * USD value of the assets leaving the wallet in this confirmation — the funds
 * the questionnaire is standing in front of.
 *
 * Deliberately mirrors the arithmetic behind `simulation_sending_assets_total_value`
 * on transaction events so the two are directly comparable rather than being
 * parallel definitions that drift apart.
 *
 * Returns `undefined` when simulation hasn't produced balance changes or fiat
 * rates are unavailable — Blockaid flagging a recipient doesn't imply a
 * successful simulation. The property is then omitted rather than sent as `0`,
 * so downstream sums read as a lower bound instead of counting free sends.
 *
 * @returns The outgoing USD total, or `undefined` when it can't be determined.
 */
function useValueAtRisk(): number | undefined {
  const transactionMeta = useTransactionMetadataRequest();
  const { value: balanceChanges } = useBalanceChanges({
    chainId: transactionMeta.chainId,
    simulationData: transactionMeta.simulationData,
  });

  return useMemo(() => {
    const sendingAssets = balanceChanges.filter((change) =>
      change.amount.isNegative(),
    );
    const total = calculateTotalFiat(
      sendingAssets.map((change) => change.usdAmount),
    );
    return total ? Math.abs(total) : undefined;
  }, [balanceChanges]);
}

export function useScamQuestionnaireMetrics() {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const valueAtRisk = useValueAtRisk();

  return useMemo(() => {
    const fire = (
      event: MetaMetricsEventName,
      properties: UIMetricsEventPayload['properties'] = {},
    ) => {
      trackEvent(
        createEventBuilder(event)
          .addCategory(MetaMetricsEventCategory.Confirmations)
          .addProperties({
            ...properties,
            questionnaire_version: QUESTIONNAIRE_VERSION,
          })
          .build(),
      );
    };

    return {
      trackViewed: (step: 0 | 1 | 2) =>
        fire(MetaMetricsEventName.ScamQuestionnaireViewed, {
          step: stepLabelFromIndex(step),
        }),

      trackWarningDisplayed: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamQuestionnaireWarningDisplayed, {
          ...getAnswerRecord(answers),
          red_flag_count: getRedFlagCount(answers),
        }),

      trackCompleted: ({
        status,
        answers,
      }: {
        status: CompletionStatus;
        answers: Answers;
      }) =>
        fire(MetaMetricsEventName.ScamQuestionnaireCompleted, {
          status,
          ...getAnswerRecord(answers),
          red_flag_count: getRedFlagCount(answers),
          simulation_sending_assets_total_value: valueAtRisk,
        }),
    };
  }, [createEventBuilder, trackEvent, valueAtRisk]);
}

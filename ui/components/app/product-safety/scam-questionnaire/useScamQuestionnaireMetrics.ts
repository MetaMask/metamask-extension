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
  type Step,
  getAnswerRecord,
  getRedFlagCount,
  stepLabelFromIndex,
} from './scam-questionnaire.constants';

export type CompletionStatus = 'clean' | 'payment_stopped' | 'proceeded';

// Mirrors the arithmetic behind `simulation_sending_assets_total_value` on
// transaction events so the two stay comparable. `undefined` rather than `0`
// when rates are unavailable, so the property is omitted instead of reporting
// the send as free.
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

export function useScamQuestionnaireMetrics(trigger: string) {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const valueAtRisk = useValueAtRisk();

  return useMemo(() => {
    const fire = (
      event: MetaMetricsEventName,
      properties: UIMetricsEventPayload['properties'],
    ) => {
      trackEvent(
        createEventBuilder(event)
          .addCategory(MetaMetricsEventCategory.Confirmations)
          .addProperties({
            ...properties,
            questionnaire_version: QUESTIONNAIRE_VERSION,
            questionnaire_trigger: trigger,
          })
          .build(),
      );
    };

    return {
      // `step: 'warning'` covers the warning screen, so reaching it and never
      // resolving is still visible as a funnel step. Answers live on
      // `Completed` only — here they'd lag a step, since a step's answer isn't
      // committed until the user leaves it.
      trackViewed: (step: Step) =>
        fire(MetaMetricsEventName.ScamQuestionnaireViewed, {
          step: stepLabelFromIndex(step),
        }),

      trackContactSupport: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamQuestionnaireSupportContacted, {
          ...getAnswerRecord(answers),
          red_flag_count: getRedFlagCount(answers),
          simulation_sending_assets_total_value: valueAtRisk,
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
  }, [createEventBuilder, trigger, trackEvent, valueAtRisk]);
}

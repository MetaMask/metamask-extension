/* eslint-disable @typescript-eslint/naming-convention */
import { useContext, useMemo } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  MetaMetricsContext,
  type UIMetricsEventPayload,
} from '../../../../contexts/metametrics';
import {
  Answers,
  QuestionId,
  getRedFlagCount,
  getRedFlagQuestions,
} from './scam-questionnaire.constants';

export function useScamQuestionnaireMetrics() {
  const { trackEvent } = useContext(MetaMetricsContext);

  return useMemo(() => {
    const fire = (
      event: MetaMetricsEventName,
      properties: UIMetricsEventPayload['properties'] = {},
    ) => {
      trackEvent({
        category: MetaMetricsEventCategory.Confirmations,
        event,
        properties,
      });
    };

    return {
      trackStarted: () => fire(MetaMetricsEventName.SecurityCheckStarted),

      trackQuestionAnswered: (
        question: QuestionId,
        answerKey: string,
        isRedFlag: boolean,
      ) =>
        fire(MetaMetricsEventName.SecurityCheckQuestionAnswered, {
          question,
          answer_key: answerKey,
          is_red_flag: isRedFlag,
        }),

      trackCompletedClean: () =>
        fire(MetaMetricsEventName.SecurityCheckCompletedClean, {
          red_flag_count: 0,
        }),

      trackDismissed: (lastStep: number, answers: Answers) =>
        fire(MetaMetricsEventName.SecurityCheckDismissed, {
          last_step: lastStep,
          red_flag_count_so_far: getRedFlagCount(answers),
        }),

      trackWarningShown: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamWarningShown, {
          red_flag_count: getRedFlagCount(answers),
          red_flag_questions: getRedFlagQuestions(answers),
        }),

      trackWarningStopped: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamWarningStopped, {
          red_flag_count: getRedFlagCount(answers),
        }),

      trackWarningContactSupport: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamWarningContactSupport, {
          red_flag_count: getRedFlagCount(answers),
        }),

      trackWarningProceeded: (answers: Answers) =>
        fire(MetaMetricsEventName.ScamWarningProceeded, {
          red_flag_count: getRedFlagCount(answers),
          red_flag_questions: getRedFlagQuestions(answers),
        }),
    };
  }, [trackEvent]);
}

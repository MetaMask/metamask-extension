import { ABTestVariant, type ABTestVariantName } from '../variants';

/**
 * Remote feature flag key for the scam questionnaire staged rollout.
 *
 * This is a staged rollout today, not an A/B test. `useABTest` is used
 * intentionally so a future A/B experiment is a small diff: expand
 * `SCAM_QUESTIONNAIRE_VARIANTS` with additional variants, register an
 * `ABTestAnalyticsMapping`, and remove `{ trackExposure: false }` at the
 * call site. Until then, exposure events are suppressed so
 * `Experiment Viewed` events remain reserved for real experiments.
 */
export const SCAM_QUESTIONNAIRE_FLAG_KEY =
  'productSafetyScamQuestionnaireEnabled';

type ScamQuestionnaireVariantConfig = {
  showQuestionnaire: boolean;
};

export const SCAM_QUESTIONNAIRE_VARIANTS: Record<
  ABTestVariantName,
  ScamQuestionnaireVariantConfig
> = {
  [ABTestVariant.Control]: { showQuestionnaire: false },
  [ABTestVariant.Treatment]: { showQuestionnaire: true },
};

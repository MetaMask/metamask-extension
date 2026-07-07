import { FirstTimeFlowType } from '../../constants/onboarding';
import type { MetaMaskReduxState } from '../../types/background';

/**
 * The earliest install date that qualifies a user for new-user experiments.
 *
 * Set to 4 weeks before the bottom-nav experiment shipped (2026-07-07).
 * This is a fixed constant — it does NOT roll forward — so users who were
 * eligible on ship day remain eligible forever, and users who installed before
 * this date are never enrolled regardless of when they upgrade.
 *
 * Update this constant when launching a new experiment with a different window.
 */
export const NEW_USER_COHORT_ELIGIBILITY_CUTOFF_DATE = new Date(
  '2026-06-09',
).getTime();

/**
 * Evaluates whether a user meets the new-user cohort criteria for an
 * experiment. This is a pure function — call it once and persist the result.
 *
 * Criteria:
 * - Wallet was created (not imported) during onboarding.
 * - MetaMask was first installed on or after the experiment eligibility cutoff.
 *
 * @param params - The evaluation inputs.
 * @param params.firstTimeInfoDate - Timestamp from AppMetadataController.firstTimeInfo.date.
 * @param params.firstTimeFlowType - The onboarding flow type from OnboardingController.
 */
export function evaluateNewUserCohortEligibility({
  firstTimeInfoDate,
  firstTimeFlowType,
}: {
  firstTimeInfoDate: number | undefined;
  firstTimeFlowType: string | null | undefined;
}): boolean {
  const isWalletCreator =
    firstTimeFlowType === FirstTimeFlowType.create ||
    firstTimeFlowType === FirstTimeFlowType.socialCreate;

  const isRecentInstall =
    firstTimeInfoDate !== undefined &&
    firstTimeInfoDate >= NEW_USER_COHORT_ELIGIBILITY_CUTOFF_DATE;

  return isWalletCreator && isRecentInstall;
}

/**
 * Selects the persisted eligibility value for a given experiment flag key.
 * Returns `true` or `false` once recorded, `undefined` when not yet evaluated.
 *
 * @param flagKey - The LaunchDarkly flag key for the experiment.
 */
export const selectNewUserExperimentEligibility =
  (flagKey: string) =>
  (
    state: {
      metamask: Pick<MetaMaskReduxState, 'newUserExperimentEligibility'>;
    },
  ): boolean | undefined =>
    state.metamask.newUserExperimentEligibility?.[flagKey];

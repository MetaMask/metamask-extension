import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import type {
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerRunMigrationsAction,
} from '@metamask/seedless-onboarding-controller';
import type { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller-method-action-types';
import type { OnboardingControllerGetStateAction } from '../../controllers/onboarding';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';

/**
 * The messenger actions required to run the seedless onboarding migrations.
 */
export type RunSeedlessOnboardingMigrationsMessenger = Messenger<
  string,
  | OnboardingControllerGetStateAction
  | SeedlessOnboardingControllerRunMigrationsAction
  | SeedlessOnboardingControllerGetStateAction
  | MetaMetricsControllerTrackEventAction,
  never
>;

/**
 * Run seedless onboarding migrations.
 *
 * Delegates to the `SeedlessOnboardingController:runMigrations` action, which
 * handles version tracking and migration logic. Called before adding new secret
 * data to ensure data type consistency and correct ordering.
 *
 * This is a shared helper so that the success/failure metrics and Sentry error
 * reporting stay consistent across every caller (e.g. the `MetamaskController`
 * and the `LegacyBackgroundApiService`).
 *
 * @param messenger - The messenger used to call the required controller actions.
 * @param options - Migration execution options.
 * @param options.reportToSentry - Whether to capture migration failures in
 * Sentry. Defaults to `true`.
 * @returns A promise that resolves once migrations have run (or been skipped).
 */
export async function runSeedlessOnboardingMigrations(
  messenger: RunSeedlessOnboardingMigrationsMessenger,
): Promise<void> {
  const { completedOnboarding } = messenger.call(
    'OnboardingController:getState',
  );

  if (!completedOnboarding) {
    return;
  }

  try {
    const migrationPerformed = await messenger.call(
      'SeedlessOnboardingController:runMigrations',
    );

    if (migrationPerformed) {
      messenger.call('MetaMetricsController:trackEvent', {
        event: MetaMetricsEventName.SeedlessOnboardingMigrationCompleted,
        category: MetaMetricsEventCategory.Background,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          migration_version: messenger.call(
            'SeedlessOnboardingController:getState',
          ).migrationVersion,
        },
      });
    }
  } catch (error) {
    const isError = error instanceof Error;
    const errorMessage = isError ? error.message : 'Unknown error';
    const migrationError = isError ? error : new Error(errorMessage);

    try {
      messenger.call('MetaMetricsController:trackEvent', {
        event: MetaMetricsEventName.SeedlessOnboardingMigrationFailed,
        category: MetaMetricsEventCategory.Background,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          migration_version: messenger.call(
            'SeedlessOnboardingController:getState',
          ).migrationVersion,
          error: errorMessage,
        },
      });
    } catch (metaMetricsError) {
      log.warn(
        'Failed to track seedless onboarding migration failure',
        metaMetricsError,
      );
    }

    try {
      captureException(migrationError);
    } catch (sentryError) {
      log.warn(
        'Failed to capture seedless onboarding migration failure',
        sentryError,
      );
    }

    throw migrationError;
  }
}

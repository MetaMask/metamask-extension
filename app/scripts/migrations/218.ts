import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 218;

/**
 * Migration 218: update `PreferencesController.advancedGasFee` from
 * chain-scoped values to chain-and-account-scoped values.
 *
 * Migration 092.3 already wiped the original global advanced gas fee values,
 * but it intentionally left any chain-scoped data untouched because that shape
 * did not match the global data being removed. Since the new implementation
 * requires account-scoped data under each chain, this migration defensively
 * discards any remaining chain-scoped values that cannot be safely assigned to
 * a single account.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  try {
    transformState(versionedData.data, changedControllers);
  } catch (error) {
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    return;
  }

  const { PreferencesController } = state;

  if (!hasProperty(PreferencesController, 'advancedGasFee')) {
    return;
  }

  const { advancedGasFee } = PreferencesController;

  if (!isObject(advancedGasFee)) {
    PreferencesController.advancedGasFee = {};
    changedControllers.add('PreferencesController');
    return;
  }

  const migratedAdvancedGasFee: Record<string, Record<string, unknown>> = {};
  let didChange = false;

  for (const [chainId, chainPreferences] of Object.entries(advancedGasFee)) {
    if (
      !isObject(chainPreferences) ||
      isLegacyAdvancedGasFeePreference(chainPreferences)
    ) {
      didChange = true;
      continue;
    }

    const migratedChainPreferences: Record<string, unknown> = {};

    for (const [account, preference] of Object.entries(chainPreferences)) {
      if (!isAdvancedGasFeePreference(preference)) {
        didChange = true;
        continue;
      }

      const normalizedAccount = account.toLowerCase();
      migratedChainPreferences[normalizedAccount] = preference;
      didChange ||= normalizedAccount !== account;
    }

    if (Object.keys(migratedChainPreferences).length > 0) {
      migratedAdvancedGasFee[chainId] = migratedChainPreferences;
    }
  }

  if (!didChange) {
    return;
  }

  PreferencesController.advancedGasFee = migratedAdvancedGasFee;
  changedControllers.add('PreferencesController');
}

function isLegacyAdvancedGasFeePreference(value: Record<string, unknown>) {
  return (
    hasProperty(value, 'maxBaseFee') ||
    hasProperty(value, 'priorityFee') ||
    hasProperty(value, 'gasPrice')
  );
}

function isAdvancedGasFeePreference(value: unknown): boolean {
  if (!isObject(value) || typeof value.userFeeLevel !== 'string') {
    return false;
  }

  return ['maxBaseFee', 'priorityFee', 'gasPrice'].every((key) => {
    const preferenceValue = value[key];
    return preferenceValue === undefined || typeof preferenceValue === 'string';
  });
}

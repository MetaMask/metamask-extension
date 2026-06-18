/* eslint-disable @typescript-eslint/naming-convention */
import { AccountsControllerState } from '@metamask/accounts-controller';
import { NetworkState } from '@metamask/network-controller';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { hasProperty, isObject, Json } from '@metamask/utils';
import { getIsSettingsPageDevOptionsEnabled } from '../../../shared/lib/environment';
import {
  getSplitStateMigrationDeveloperOverrides,
  SPLIT_STATE_MIGRATION_ENABLED_KEY,
  SPLIT_STATE_MIGRATION_MAX_ACCOUNTS_KEY,
  SPLIT_STATE_MIGRATION_MAX_NETWORKS_KEY,
} from '../../../shared/lib/split-state-migration-dev-overrides';

type State = {
  RemoteFeatureFlagController?: RemoteFeatureFlagControllerState;
  AccountsController?: AccountsControllerState;
  NetworkController?: NetworkState;
};

function isFlagValid(flag?: Json): flag is {
  value: {
    enabled: number;
    maxAccounts: number;
    maxNetworks: number;
  };
} {
  return (
    isObject(flag) &&
    hasProperty(flag, 'value') &&
    isObject(flag.value) &&
    hasProperty(flag.value, 'enabled') &&
    typeof flag.value.enabled === 'number' &&
    hasProperty(flag.value, 'maxAccounts') &&
    typeof flag.value.maxAccounts === 'number' &&
    hasProperty(flag.value, 'maxNetworks') &&
    typeof flag.value.maxNetworks === 'number'
  );
}

function isOverrideUnset(value: Json | undefined): boolean {
  return value === undefined || value === null;
}

async function developerOverrides() {
  const splitStateMigrationDeveloperOverrides =
    await getSplitStateMigrationDeveloperOverrides();
  const splitStateMigrationEnabled =
    splitStateMigrationDeveloperOverrides[SPLIT_STATE_MIGRATION_ENABLED_KEY];
  const splitStateMigrationMaxAccounts =
    splitStateMigrationDeveloperOverrides[
      SPLIT_STATE_MIGRATION_MAX_ACCOUNTS_KEY
    ];
  const splitStateMigrationMaxNetworks =
    splitStateMigrationDeveloperOverrides[
      SPLIT_STATE_MIGRATION_MAX_NETWORKS_KEY
    ];

  return {
    enabled: isOverrideUnset(splitStateMigrationEnabled)
      ? null
      : splitStateMigrationEnabled === '1',
    maxAccounts: isOverrideUnset(splitStateMigrationMaxAccounts)
      ? 0
      : Number(splitStateMigrationMaxAccounts),
    maxNetworks: isOverrideUnset(splitStateMigrationMaxNetworks)
      ? 0
      : Number(splitStateMigrationMaxNetworks),
  };
}

/**
 * Get current account and network counts from controller state
 *
 * @param state - The current state
 * @returns The account and network counts
 */
function getCounts(state: State) {
  const accountsState = state.AccountsController;
  const accountCount = Object.keys(
    accountsState?.internalAccounts?.accounts ?? {},
  ).length;

  const networkState = state.NetworkController;
  const networkCount = Object.keys(
    networkState?.networkConfigurationsByChainId ?? {},
  ).length;

  return {
    accountCount,
    networkCount,
  };
}

export async function useSplitStateStorage(state: State): Promise<boolean> {
  if (getIsSettingsPageDevOptionsEnabled() || process.env.IN_TEST) {
    const overrides = await developerOverrides();
    if (overrides.enabled !== null) {
      if (overrides.enabled === false) {
        return false;
      }

      const { accountCount, networkCount } = getCounts(state);

      return (
        accountCount <= overrides.maxAccounts &&
        networkCount <= overrides.maxNetworks
      );
    }
  }

  const remoteFeatureFlagControllerState = state.RemoteFeatureFlagController;
  const flag =
    remoteFeatureFlagControllerState?.remoteFeatureFlags
      ?.platformSplitStateGradualRollout;

  if (!isFlagValid(flag) || flag.value.enabled <= 0) {
    return false;
  }

  const { accountCount, networkCount } = getCounts(state);

  return (
    accountCount <= flag.value.maxAccounts &&
    networkCount <= flag.value.maxNetworks
  );
}

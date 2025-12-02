import { Messenger } from '@metamask/messenger';
import { AccountsControllerGetStateAction } from '@metamask/accounts-controller';
import { NetworkControllerGetStateAction } from '@metamask/network-controller';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import { hasProperty, isObject, Json } from '@metamask/utils';

type SplitStateStorageMessenger = Pick<
  Messenger<
    string,
    | RemoteFeatureFlagControllerGetStateAction
    | AccountsControllerGetStateAction
    | NetworkControllerGetStateAction,
    never
  >,
  'call'
>;

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

export function useSplitStateStorage(
  messenger: SplitStateStorageMessenger,
): boolean {
  const remoteFeatureFlagControllerState: RemoteFeatureFlagControllerState =
    messenger.call('RemoteFeatureFlagController:getState');
  const flag =
    remoteFeatureFlagControllerState.remoteFeatureFlags
      ?.platformSplitStateGradualRollout;

  if (!isFlagValid(flag) || flag.value.enabled <= 0) {
    return false;
  }

  const accountsState = messenger.call('AccountsController:getState');
  const accountCount = Object.keys(
    accountsState?.internalAccounts?.accounts ?? {},
  ).length;

  const networkState = messenger.call('NetworkController:getState');
  const networkCount = Object.keys(
    networkState?.networkConfigurationsByChainId ?? {},
  ).length;

  return (
    accountCount <= flag.value.maxAccounts &&
    networkCount <= flag.value.maxNetworks
  );
}

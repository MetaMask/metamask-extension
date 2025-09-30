import { assert } from '@metamask/utils';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import AccountTrackerController from '../controllers/account-tracker-controller';
import { ControllerInitFunction } from './types';
import {
  AccountTrackerControllerInitMessenger,
  AccountTrackerControllerMessenger,
} from './messengers';

/**
 * Initialize the account tracker controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const AccountTrackerControllerInit: ControllerInitFunction<
  AccountTrackerController,
  AccountTrackerControllerMessenger,
  AccountTrackerControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const { provider, blockTracker } =
    initMessenger.call('NetworkController:getSelectedNetworkClient') ?? {};

  assert(
    provider,
    'Provider is required to initialize AccountTrackerController.',
  );

  assert(
    blockTracker,
    'Block tracker is required to initialize AccountTrackerController.',
  );

  // Get feature flag for account API balances
  const remoteFeatureFlagState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );
  const FEATURE_FLAG_NAME = 'accountApiBalances';
  const featureFlagForAccountApiBalances =
    remoteFeatureFlagState?.remoteFeatureFlags?.[FEATURE_FLAG_NAME] ?? [];

  const controller = new AccountTrackerController({
    state: { accounts: {} },
    messenger: controllerMessenger,
    provider,
    blockTracker,
    getNetworkIdentifier: (providerConfig): string => {
      const metamask = initMessenger.call('NetworkController:getState');

      const config =
        providerConfig ??
        getProviderConfig({
          metamask,
        });

      return config.type === NETWORK_TYPES.RPC && config.rpcUrl
        ? config.rpcUrl
        : config.type;
    },
    // Account API configuration
    useAccountApi: false, // Can be enabled via feature flag
    allowExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    useAccountApiBalances: featureFlagForAccountApiBalances,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};

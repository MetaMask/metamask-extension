import {
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  SOL_ACCOUNT_PROVIDER_NAME,
  TRX_ACCOUNT_PROVIDER_NAME,
  BTC_ACCOUNT_PROVIDER_NAME,
  AccountProviderWrapper,
  ///: BEGIN:ONLY_INCLUDE_IF(stellar)
  XLM_ACCOUNT_PROVIDER_NAME,
  XlmAccountProvider,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/multichain-account-service';
import { MessengerClientInitFunction } from '../types';
import { MultichainAccountServiceInitMessenger } from '../messengers/accounts';
import { previousValueComparator } from '../../lib/util';
///: BEGIN:ONLY_INCLUDE_IF(stellar)
import { isMultichainFeatureEnabled } from '../../../../shared/lib/multichain-feature-flags';
///: END:ONLY_INCLUDE_IF
import { trace } from '../../../../shared/lib/trace';

/**
 * Initialize the multichain account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.ensureOnboardingComplete - Ensure onboarding is complete before initializing.
 * @returns The initialized service.
 */
export const MultichainAccountServiceInit: MessengerClientInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger
> = ({ controllerMessenger, initMessenger, ensureOnboardingComplete }) => {
  const snapAccountProviderConfig = {
    // READ THIS CAREFULLY:
    // We are using 1 to prevent any concurrent `keyring_createAccount` requests. This ensures
    // we prevent any desync between Snap's accounts and Metamask's accounts.
    maxConcurrency: 1,
    // Re-use the default config for the rest:
    discovery: {
      timeoutMs: 2000,
      maxAttempts: 3,
      backOffMs: 1000,
    },
    createAccounts: {
      timeoutMs: 3000,
      batched: true,
    },
    resyncAccounts: {
      autoRemoveExtraSnapAccounts: false,
    },
  };

  const providerConfigs: { [key: string]: any } = {
    [SOL_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
    [BTC_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
    [TRX_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
  };

  const customProviders = [];

  ///: BEGIN:ONLY_INCLUDE_IF(stellar)
  const xlmProvider = new AccountProviderWrapper(
    controllerMessenger,
    new XlmAccountProvider(
      controllerMessenger,
      {
        ...snapAccountProviderConfig,
        createAccounts: {
          ...snapAccountProviderConfig.createAccounts,
          batched: true,
          timeoutMs: 10000,
        },
      },
    ),
  );
  customProviders.push(xlmProvider);
  ///: END:ONLY_INCLUDE_IF

  const messengerClient = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: customProviders,
    providerConfigs,
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace,
    },
    ensureOnboardingComplete,
  });

  const preferencesState = initMessenger.call('PreferencesController:getState');

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (prevUseExternalServices !== currUseExternalServices) {
        // Set basic functionality and trigger alignment when enabled
        // This single call handles both provider disable/enable and alignment.
        messengerClient
          .setBasicFunctionality(currUseExternalServices)
          .catch((error) => {
            console.error(
              'Failed to set basic functionality on MultichainAccountService:',
              error,
            );
          });
      }

      return true;
    }, preferencesState),
  );

  // Handle Stellar provider feature flag using previousValueComparator pattern
  ///: BEGIN:ONLY_INCLUDE_IF(stellar)
  const initialRemoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  const initialStellarEnabled = isMultichainFeatureEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.stellarAccounts,
  );
  xlmProvider.setEnabled(initialStellarEnabled);

  (controllerMessenger.subscribe as any)(
    'RemoteFeatureFlagController:stateChange',
    previousValueComparator((prevState, currState) => {
      const prevStellarEnabled = isMultichainFeatureEnabled(
        prevState?.remoteFeatureFlags?.stellarAccounts,
      );
      const currStellarEnabled = isMultichainFeatureEnabled(
        currState?.remoteFeatureFlags?.stellarAccounts,
      );

      if (prevStellarEnabled !== currStellarEnabled) {
        // Enable/disable Stellar provider based on feature flag
        xlmProvider.setEnabled(currStellarEnabled);

        // Trigger wallet alignment when Stellar accounts are enabled
        // This will create Stellar accounts for existing wallets
        if (currStellarEnabled) {
          messengerClient.alignWallets().catch((error) => {
            console.error(
              'Failed to align wallets after enabling Stellar provider:',
              error,
            );
          });
        }
        // Note: When disabled, no action needed as the provider won't create new accounts
      }

      return true;
    }, initialRemoteFeatureFlagsState),
  );
  ///: END:ONLY_INCLUDE_IF

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};

import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
  RestrictedMethodMessenger,
} from '@metamask/snaps-rpc-methods';
import { ControllerGetStateAction } from '@metamask/base-controller';
import { CurrencyRateController } from '@metamask/assets-controllers';
import {
  SnapControllerClearSnapStateAction,
  SnapControllerGetSnapAction,
  SnapControllerGetSnapStateAction,
  SnapControllerHandleRequestAction,
  SnapControllerUpdateSnapStateAction,
  SnapInterfaceControllerCreateInterfaceAction,
  SnapInterfaceControllerGetInterfaceAction,
  SnapInterfaceControllerSetInterfaceDisplayedAction,
} from '@metamask/snaps-controllers';
import {
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerWithKeyringAction,
  KeyringTypes,
  KeyringMetadata,
} from '@metamask/keyring-controller';
import {
  RateLimitControllerCallApiAction,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import {
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../../shared/constants/snaps/permissions';
import { PreferencesControllerGetStateAction } from '../../preferences-controller';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { AppStateControllerGetUnlockPromiseAction } from '../../app-state-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';

export type SnapPermissionSpecificationsActions =
  | AppStateControllerGetUnlockPromiseAction
  | SnapControllerClearSnapStateAction
  | ControllerGetStateAction<
      'CurrencyRateController',
      CurrencyRateController['state']
    >
  | SnapInterfaceControllerCreateInterfaceAction
  | SnapInterfaceControllerGetInterfaceAction
  | SnapControllerGetSnapAction
  | SnapControllerGetSnapStateAction
  | SnapControllerHandleRequestAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerWithKeyringAction
  | MaybeUpdateState
  | PreferencesControllerGetStateAction
  | RateLimitControllerCallApiAction<RateLimitedApiMap>
  | SnapInterfaceControllerSetInterfaceDisplayedAction
  | TestOrigin
  | SnapControllerUpdateSnapStateAction;

type SnapPermissionSpecificationsHooks = {
  addAndShowApprovalRequest(request: unknown): Promise<unknown>;
  addNewKeyring(
    type: KeyringTypes | string,
    opts?: unknown,
  ): Promise<KeyringMetadata>;
};

/**
 * Get the permission specifications for Snaps.
 *
 * @param messenger - The messenger to use for communication with other
 * controllers.
 * @param hooks - Hooks for various operations. This is needed since some
 * controllers don't expose the required methods over the messenger yet.
 */
export function getSnapPermissionSpecifications(
  messenger: RootMessenger<SnapPermissionSpecificationsActions, never>,
  hooks: SnapPermissionSpecificationsHooks,
) {
  return {
    ...buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
    ...buildSnapRestrictedMethodSpecifications(
      Object.keys(ExcludedSnapPermissions),
      {
        /**
         * Get user preferences.
         *
         * @returns An object containing the preferences relevant to Snaps. This
         * is a subset of the full preferences state.
         */
        getPreferences: () => {
          const currency = messenger.call(
            'CurrencyRateController:getState',
          ).currentCurrency;

          const {
            currentLocale: locale,
            openSeaEnabled,
            preferences: { privacyMode, showTestNetworks },
            securityAlertsEnabled,
            useCurrencyRateCheck,
            useTransactionSimulations,
            useTokenDetection,
            useMultiAccountBalanceChecker,
            useNftDetection,
          } = messenger.call('PreferencesController:getState');

          return {
            locale,
            currency,
            hideBalances: privacyMode,
            useSecurityAlerts: securityAlertsEnabled,
            useExternalPricingData: useCurrencyRateCheck,
            simulateOnChainActions: useTransactionSimulations,
            useTokenDetection,
            batchCheckBalances: useMultiAccountBalanceChecker,
            displayNftMedia: openSeaEnabled,
            useNftDetection,
            showTestnets: showTestNetworks,
          };
        },

        getUnlockPromise: messenger.call.bind(
          messenger,
          'AppStateController:getUnlockPromise',
        ),

        /**
         * If phishing detection is enabled, check for an updated phishing
         * list.
         */
        maybeUpdatePhishingList: () => {
          const { usePhishDetect } = messenger.call(
            'PreferencesController:getState',
          );

          if (!usePhishDetect) {
            return;
          }

          messenger.call('PhishingController:maybeUpdateState');
        },

        /**
         * Check whether a URL is on the phishing list.
         *
         * @param url - The URL to check.
         * @returns A boolean indicating whether the URL is on the phishing
         * list. If phishing detection is disabled, false is returned.
         */
        isOnPhishingList: (url: string) => {
          const { usePhishDetect } = messenger.call(
            'PreferencesController:getState',
          );

          if (!usePhishDetect) {
            return false;
          }

          return messenger.call('PhishingController:testOrigin', url).result;
        },

        /**
         * Get custom cryptography implementations for the client.
         *
         * @returns An object containing custom cryptography implementations.
         * We currently don't use any specific implementations, so this is an
         * empty object.
         */
        getClientCryptography: () => ({}),

        getSnapKeyring: async () => {
          // TODO: Use `withKeyring` instead.
          const [snapKeyring] = messenger.call(
            'KeyringController:getKeyringsByType',
            KeyringType.snap,
          );

          if (!snapKeyring) {
            await hooks.addNewKeyring(KeyringType.snap);

            return messenger.call(
              'KeyringController:getKeyringsByType',
              KeyringType.snap,
            )[0];
          }

          return snapKeyring;
        },
      },
      messenger as RestrictedMethodMessenger,
    ),
  };
}

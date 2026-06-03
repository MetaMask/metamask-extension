import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
  RestrictedMethodMessenger,
} from '@metamask/snaps-rpc-methods';
import { ControllerGetStateAction } from '@metamask/base-controller';
import { CurrencyRateController } from '@metamask/assets-controllers';
import type { AssetsControllerGetStateAction } from '@metamask/assets-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
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
  KeyringControllerAddNewKeyringAction,
} from '@metamask/keyring-controller';
import {
  RateLimitControllerCallApiAction,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import { ApprovalControllerAddRequestAction } from '@metamask/approval-controller';
import {
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../../shared/constants/snaps/permissions';
import { PreferencesControllerGetStateAction } from '../../preferences-controller';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { AppStateControllerGetUnlockPromiseAction } from '../../app-state-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';
import {
  isAssetsUnifyStateFeatureEnabled,
  ASSETS_UNIFY_STATE_VERSION_1,
  type AssetsUnifyStateFeatureFlag,
} from '../../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../../shared/lib/environment';

export type SnapPermissionSpecificationsActions =
  | AppStateControllerGetUnlockPromiseAction
  | SnapControllerClearSnapStateAction
  | ControllerGetStateAction<
      'CurrencyRateController',
      CurrencyRateController['state']
    >
  | AssetsControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | SnapInterfaceControllerCreateInterfaceAction
  | SnapInterfaceControllerGetInterfaceAction
  | SnapControllerGetSnapAction
  | SnapControllerGetSnapStateAction
  | SnapControllerHandleRequestAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerWithKeyringAction
  | KeyringControllerAddNewKeyringAction
  | MaybeUpdateState
  | PreferencesControllerGetStateAction
  | RateLimitControllerCallApiAction<RateLimitedApiMap>
  | SnapInterfaceControllerSetInterfaceDisplayedAction
  | TestOrigin
  | SnapControllerUpdateSnapStateAction
  | ApprovalControllerAddRequestAction;

/**
 * Get the permission specifications for Snaps.
 *
 * @param messenger - The messenger to use for communication with other
 * controllers.
 */
export function getSnapPermissionSpecifications(
  messenger: RootMessenger<SnapPermissionSpecificationsActions, never>,
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
          const isAssetsUnifyStateEnabled =
            getIsAssetsUnifiedStateIncludedInBuild() &&
            isAssetsUnifyStateFeatureEnabled(
              messenger.call('RemoteFeatureFlagController:getState')
                ?.remoteFeatureFlags?.assetsUnifyState as
                | AssetsUnifyStateFeatureFlag
                | null
                | undefined,
              ASSETS_UNIFY_STATE_VERSION_1,
            );

          const currency = isAssetsUnifyStateEnabled
            ? messenger.call('AssetsController:getState').selectedCurrency
            : messenger.call('CurrencyRateController:getState').currentCurrency;

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
            await messenger.call(
              'KeyringController:addNewKeyring',
              KeyringType.snap,
            );

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

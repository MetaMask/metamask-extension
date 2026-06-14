import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
  type ConfirmTransactionParams,
  RestrictedMethodMessenger,
  type UpdateConfirmTransactionParams,
} from '@metamask/snaps-rpc-methods';
import { ControllerGetStateAction } from '@metamask/base-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { CurrencyRateController } from '@metamask/assets-controllers';
import type { AssetsControllerGetStateAction } from '@metamask/assets-controller';
import type { MultichainTransactionsControllerActions } from '@metamask/multichain-transactions-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { rpcErrors } from '@metamask/rpc-errors';
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
import { nanoid } from 'nanoid';
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
import {
  UNIVERSAL_TRANSACTION_APPROVAL_TYPE,
  USE_UNIVERSAL_MULTICHAIN_CONFIRMATION,
} from '../../../../../shared/constants/confirmations';
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

function getUniversalTransactionConfirmationKey(snapId: string, id: string) {
  const encodedId = encodeURIComponent(`${snapId}:${id}`).replace(/%/gu, '.');

  return `snap-confirm-tx:${encodedId}`;
}

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
  | ApprovalControllerAddRequestAction
  | MultichainTransactionsControllerActions;

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

        showUniversalTransactionConfirmation: async (
          snapId: string,
          params: ConfirmTransactionParams,
        ) => {
          if (!USE_UNIVERSAL_MULTICHAIN_CONFIRMATION) {
            throw rpcErrors.methodNotSupported();
          }

          const approvalId = params.id
            ? getUniversalTransactionConfirmationKey(snapId, params.id)
            : nanoid();

          messenger.call(
            'MultichainTransactionsController:addPendingTransaction',
            {
              approvalId,
              chainId: params.chainId,
              accountId: params.accountId,
              to: params.to,
              amount: params.amount,
              assetId: params.assetId,
              custom: params.custom,
              fee: params.fee,
              origin: snapId,
              createdAt: Date.now(),
            },
          );

          const addAndShowApprovalRequest = async () =>
            messenger.call(
              'ApprovalController:addRequest',
              {
                id: approvalId,
                origin: snapId,
                type: UNIVERSAL_TRANSACTION_APPROVAL_TYPE as ApprovalType,
                requestData: {
                  approvalId,
                  chainId: params.chainId,
                  txParams: {
                    to: params.to,
                    value: params.amount,
                  },
                },
              },
              true,
            );

          try {
            await addAndShowApprovalRequest();
            return true;
          } catch (_err) {
            return false;
          } finally {
            messenger.call(
              'MultichainTransactionsController:removePendingTransaction',
              approvalId,
            );
          }
        },

        updateUniversalTransactionConfirmation: async (
          snapId: string,
          params: UpdateConfirmTransactionParams,
        ) => {
          if (!USE_UNIVERSAL_MULTICHAIN_CONFIRMATION) {
            throw rpcErrors.methodNotSupported();
          }

          const approvalId = getUniversalTransactionConfirmationKey(
            snapId,
            params.id,
          );

          const patch = {
            ...(params.custom === undefined ? {} : { custom: params.custom }),
            ...(params.fee === undefined ? {} : { fee: params.fee }),
          };

          messenger.call(
            'MultichainTransactionsController:updatePendingTransaction',
            approvalId,
            patch,
          );
        },

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

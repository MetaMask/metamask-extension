import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
import { ControllerGetStateAction } from '@metamask/base-controller';
import { CurrencyRateController } from '@metamask/assets-controllers';
import {
  ClearSnapState,
  GetSnap,
  GetSnapState,
  HandleSnapRequest,
  UpdateSnapState,
  CreateInterface,
  GetInterface,
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
import { AppStateControllerGetUnlockPromiseAction } from '../../app-state-controller';
import { RootMessenger } from '../../../lib/messenger';
import { getMnemonic, getMnemonicSeed } from './utils';

export type SnapPermissionSpecificationsActions =
  | AppStateControllerGetUnlockPromiseAction
  | ClearSnapState
  | ControllerGetStateAction<
      'CurrencyRateController',
      CurrencyRateController['state']
    >
  | CreateInterface
  | GetInterface
  | GetSnap
  | GetSnapState
  | HandleSnapRequest
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerWithKeyringAction
  | MaybeUpdateState
  | PreferencesControllerGetStateAction
  | RateLimitControllerCallApiAction<RateLimitedApiMap>
  | TestOrigin
  | UpdateSnapState;

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

        clearSnapState: messenger.call.bind(
          messenger,
          'SnapController:clearSnapState',
        ),

        getMnemonic: getMnemonic.bind(null, messenger),
        getMnemonicSeed: getMnemonicSeed.bind(null, messenger),

        getUnlockPromise: messenger.call.bind(
          messenger,
          'AppStateController:getUnlockPromise',
        ),

        getSnap: messenger.call.bind(messenger, 'SnapController:get'),
        handleSnapRpcRequest: messenger.call.bind(
          messenger,
          'SnapController:handleRequest',
        ),

        getSnapState: messenger.call.bind(
          messenger,
          'SnapController:getSnapState',
        ),

        requestUserApproval: hooks.addAndShowApprovalRequest,

        /**
         * Show a native (system) notification.
         *
         * @param origin - The origin requesting the notification.
         * @param args - The notification arguments.
         * @param args.message - The notification message.
         * @returns A promise that resolves when the notification is shown.
         */
        showNativeNotification: (origin: string, args: { message: string }) =>
          messenger.call(
            'RateLimitController:call',
            origin,
            'showNativeNotification',
            // @ts-expect-error: `RateLimitController` methods aren't properly
            // typed yet.
            origin,
            args.message,
          ),

        /**
         * Show an in-app notification.
         *
         * @param origin - The origin requesting the notification.
         * @param args - The notification arguments.
         * @param args.message - The notification message.
         * @param args.title - The notification title.
         * @param args.footerLink - The notification footer link.
         * @param args.content - The notification content identifier.
         * @returns A promise that resolves when the notification is shown.
         */
        showInAppNotification: (
          origin: string,
          args: {
            message: string;
            title?: string;
            footerLink?: string;
            content?: string;
          },
        ) => {
          const { content, message, title, footerLink } = args;
          const notificationArgs = {
            interfaceId: content,
            message,
            title,
            footerLink,
          };

          return messenger.call(
            'RateLimitController:call',
            origin,
            'showInAppNotification',
            // @ts-expect-error: `RateLimitController` methods aren't properly
            // typed yet.
            origin,
            notificationArgs,
          );
        },

        updateSnapState: messenger.call.bind(
          messenger,
          'SnapController:updateSnapState',
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

        createInterface: messenger.call.bind(
          messenger,
          'SnapInterfaceController:createInterface',
        ),

        getInterface: messenger.call.bind(
          messenger,
          'SnapInterfaceController:getInterface',
        ),

        /**
         * Get custom cryptography implementations for the client.
         *
         * @returns An object containing custom cryptography implementations.
         * We currently don't use any specific implementations, so this is an
         * empty object.
         */
        getClientCryptography: () => ({}),

        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
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
        ///: END:ONLY_INCLUDE_IF
      },
    ),
  };
}

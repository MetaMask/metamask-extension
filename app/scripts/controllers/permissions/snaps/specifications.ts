import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
import {
  ControllerGetStateAction,
  RestrictedMessenger,
} from '@metamask/base-controller';
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
import { hasProperty } from '@metamask/utils';
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
  messenger: RestrictedMessenger<
    never,
    SnapPermissionSpecificationsActions,
    never,
    SnapPermissionSpecificationsActions['type'],
    never
  >,
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

        /**
         * Get the mnemonic for a given entropy source. If no source is
         * provided, the primary HD keyring's mnemonic will be returned.
         *
         * @param source - The ID of the entropy source keyring.
         * @returns The mnemonic.
         */
        getMnemonic: async (source: string) => {
          if (!source) {
            const [keyring] = messenger.call(
              'KeyringController:getKeyringsByType',
              KeyringType.hdKeyTree,
            ) as { mnemonic?: string }[];

            if (!keyring.mnemonic) {
              throw new Error('Primary keyring mnemonic unavailable.');
            }

            return keyring.mnemonic;
          }

          try {
            const { type, mnemonic } = (await messenger.call(
              'KeyringController:withKeyring',
              {
                id: source,
              },
              async ({ keyring }) => ({
                type: keyring.type,
                mnemonic: hasProperty(keyring, 'mnemonic')
                  ? keyring.mnemonic
                  : undefined,
              }),
            )) as { type: string; mnemonic?: string };

            if (type !== KeyringTypes.hd || !mnemonic) {
              // The keyring isn't guaranteed to have a mnemonic (e.g.,
              // hardware wallets, which can't be used as entropy sources),
              // so we throw an error if it doesn't.
              throw new Error(`Entropy source with ID "${source}" not found.`);
            }

            return mnemonic;
          } catch {
            throw new Error(`Entropy source with ID "${source}" not found.`);
          }
        },

        /**
         * Get the mnemonic seed for a given entropy source. If no source is
         * provided, the primary HD keyring's mnemonic seed will be returned.
         *
         * @param source - The ID of the entropy source keyring.
         * @returns The mnemonic seed.
         */
        getMnemonicSeed: async (source: string) => {
          if (!source) {
            const [keyring] = messenger.call(
              'KeyringController:getKeyringsByType',
              KeyringType.hdKeyTree,
            ) as { seed?: Uint8Array }[];

            if (!keyring.seed) {
              throw new Error('Primary keyring mnemonic unavailable.');
            }

            return keyring.seed;
          }

          try {
            const { type, seed } = (await messenger.call(
              'KeyringController:withKeyring',
              {
                id: source,
              },
              async ({ keyring }) => ({
                type: keyring.type,
                seed: hasProperty(keyring, 'seed') ? keyring.seed : undefined,
              }),
            )) as { type: string; seed?: Uint8Array };

            if (type !== KeyringTypes.hd || !seed) {
              // The keyring isn't guaranteed to have a mnemonic (e.g.,
              // hardware wallets, which can't be used as entropy sources),
              // so we throw an error if it doesn't.
              throw new Error(`Entropy source with ID "${source}" not found.`);
            }

            return seed;
          } catch {
            throw new Error(`Entropy source with ID "${source}" not found.`);
          }
        },

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

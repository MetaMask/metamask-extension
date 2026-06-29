import { Wallet } from '@metamask/wallet';
import type { DefaultActions, DefaultEvents } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import type { AnalyticsControllerGetStateAction } from '@metamask/analytics-controller';
import type {
  RemoteFeatureFlagControllerEnableAction,
  RemoteFeatureFlagControllerDisableAction,
  RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction,
} from '@metamask/remote-feature-flag-controller';
import { RootMessenger } from '../lib/messenger';
import type { PreferencesControllerStateChangeEvent } from '../controllers/preferences-controller';
import type { OnboardingControllerStateChangeEvent } from '../controllers/onboarding';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { getBaseSemVerVersion } from '../../../shared/lib/feature-flags/version-gating';
import { getKeyringBuilders, getKeyringV2Builders } from './keyrings';
import {
  getRemoteFeatureFlagClientConfigApiService,
  setupRemoteFeatureFlagToggle,
} from './remote-feature-flags';

const REMOTE_FEATURE_FLAG_FETCH_INTERVAL = 15 * 60 * 1000;

/**
 * The root messenger `initializeWallet` expects: the wallet defaults plus the
 * extra actions/events the extension-side wiring reads (the metaMetrics id and
 * the remote feature flag enable/disable/update actions, plus the preference
 * and onboarding state-change events the toggle subscribes to).
 */
export type WalletInitMessenger = RootMessenger<
  | DefaultActions
  | AnalyticsControllerGetStateAction
  | RemoteFeatureFlagControllerEnableAction
  | RemoteFeatureFlagControllerDisableAction
  | RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction,
  | DefaultEvents
  | PreferencesControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
>;

export function initializeWallet({
  messenger,
  state,
  encryptor,
  showApprovalRequest,
  connectivityAdapter,
}: {
  messenger: WalletInitMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
  showApprovalRequest?: ShowApprovalRequest;
  connectivityAdapter: ConnectivityAdapter;
}) {
  const wallet = new Wallet({
    messenger,
    state,
    instanceOptions: {
      approvalController: {
        showApprovalRequest,
        typesExcludedFromRateLimiting: [
          ApprovalType.PersonalSign,
          ApprovalType.EthSignTypedData,
          ApprovalType.Transaction,
          ApprovalType.WatchAsset,
          ApprovalType.EthGetEncryptionPublicKey,
          ApprovalType.EthDecrypt,

          // Exclude Smart TX Status Page from rate limiting to allow sequential
          // transactions.
          SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,

          // Allow one flavor of snap_dialog to be queued.
          DIALOG_APPROVAL_TYPES.default,
        ],
      },
      connectivityController: {
        connectivityAdapter,
      },
      keyringController: {
        encryptor,
        keyringBuilders: getKeyringBuilders(messenger),
        keyringV2Builders: getKeyringV2Builders(),
      },
      remoteFeatureFlagController: {
        clientConfigApiService: getRemoteFeatureFlagClientConfigApiService(),
        getMetaMetricsId: () =>
          messenger.call('AnalyticsController:getState').analyticsId,
        clientVersion: getBaseSemVerVersion(),
        prevClientVersion: state.AppMetadataController?.currentAppVersion as
          | string
          | undefined,
        fetchInterval: REMOTE_FEATURE_FLAG_FETCH_INTERVAL,
        disabled:
          state.OnboardingController?.completedOnboarding !== true ||
          state.PreferencesController?.useExternalServices === false,
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    },
  });

  // Keep the wallet-owned `RemoteFeatureFlagController` in sync with onboarding
  // and the external-services preference, seeded from the same persisted state
  // as the initial `disabled` value above. The controller is driven over the
  // shared messenger, so no instance reference is needed.
  setupRemoteFeatureFlagToggle({
    messenger,
    preferencesState: {
      useExternalServices:
        state.PreferencesController?.useExternalServices !== false,
    },
    onboardingState: {
      completedOnboarding:
        state.OnboardingController?.completedOnboarding === true,
    },
  });

  return wallet;
}

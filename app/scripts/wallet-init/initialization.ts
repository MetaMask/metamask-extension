import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { RootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { getBaseSemVerVersion } from '../../../shared/lib/feature-flags/version-gating';
import { getKeyringBuilders } from './keyrings';
import { getRemoteFeatureFlagClientConfigApiService } from './remote-feature-flags';

// Refresh remote feature flags at most every 15 minutes.
const REMOTE_FEATURE_FLAG_FETCH_INTERVAL = 15 * 60 * 1000;

export function initializeWallet({
  messenger,
  state,
  encryptor,
  showApprovalRequest,
  getMetaMetricsId,
}: {
  messenger: RootMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
  showApprovalRequest?: ShowApprovalRequest;
  getMetaMetricsId: () => string;
}) {
  return new Wallet({
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
      keyringController: {
        encryptor,
        keyringBuilders: getKeyringBuilders(messenger),
      },
      remoteFeatureFlagController: {
        clientConfigApiService: getRemoteFeatureFlagClientConfigApiService(),
        getMetaMetricsId,
        clientVersion: getBaseSemVerVersion(),
        prevClientVersion: state.AppMetadataController?.currentAppVersion as
          | string
          | undefined,
        fetchInterval: REMOTE_FEATURE_FLAG_FETCH_INTERVAL,
        // Start disabled until onboarding is complete and the user has opted
        // into external services. The extension then drives the dynamic
        // enable/disable toggling from Preferences/Onboarding state changes.
        disabled:
          state.OnboardingController?.completedOnboarding !== true ||
          state.PreferencesController?.useExternalServices !== true,
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    },
  });
}

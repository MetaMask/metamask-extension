import { Wallet } from '@metamask/wallet';
import type { DefaultActions, DefaultEvents } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { RootMessenger } from '../lib/messenger';
import type { MetaMetricsControllerGetMetaMetricsIdAction } from '../controllers/metametrics-controller-method-action-types';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { getBaseSemVerVersion } from '../../../shared/lib/feature-flags/version-gating';
import { getKeyringBuilders, getKeyringV2Builders } from './keyrings';
import { getRemoteFeatureFlagClientConfigApiService } from './remote-feature-flags';

const REMOTE_FEATURE_FLAG_FETCH_INTERVAL = 15 * 60 * 1000;

export function initializeWallet({
  messenger,
  state,
  encryptor,
  showApprovalRequest,
  connectivityAdapter,
}: {
  messenger: RootMessenger<
    DefaultActions | MetaMetricsControllerGetMetaMetricsIdAction,
    DefaultEvents
  >;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
  showApprovalRequest?: ShowApprovalRequest;
  connectivityAdapter: ConnectivityAdapter;
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
          messenger.call('MetaMetricsController:getMetaMetricsId'),
        clientVersion: getBaseSemVerVersion(),
        prevClientVersion: state.AppMetadataController?.currentAppVersion as
          | string
          | undefined,
        fetchInterval: REMOTE_FEATURE_FLAG_FETCH_INTERVAL,
        // `useExternalServices` defaults to `true`, so only treat an explicit
        // `false` as opting out — a missing field (e.g. pre-existing state)
        // should remain enabled, matching the live `PreferencesController`
        // default.
        disabled:
          state.OnboardingController?.completedOnboarding !== true ||
          state.PreferencesController?.useExternalServices === false,
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    },
  });
}

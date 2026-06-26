import { Wallet, WalletOptions } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { RootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { getKeyringBuilders, getKeyringV2Builders } from './keyrings';

// TODO: Remove this workaround once @metamask/wallet types are updated to include approvalController.
// The runtime (index.cjs) supports approvalController in instanceOptions, but the TypeScript
// declarations (types.d.cts) are missing it in InstanceSpecificOptions.
type WalletInstanceOptions = WalletOptions['instanceOptions'] & {
  approvalController?: {
    showApprovalRequest?: ShowApprovalRequest;
    typesExcludedFromRateLimiting?: string[];
  };
};

export function initializeWallet({
  messenger,
  state,
  encryptor,
  showApprovalRequest,
}: {
  messenger: RootMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
  showApprovalRequest?: ShowApprovalRequest;
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
        keyringV2Builders: getKeyringV2Builders(),
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    } as WalletInstanceOptions,
  });
}

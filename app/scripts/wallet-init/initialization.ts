import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { RootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { getKeyringBuilders } from './keyrings';

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
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    },
  });
}

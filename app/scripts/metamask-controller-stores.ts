import type {
  CurrencyRateState,
  NftControllerState,
  TokenListState,
  TokenRatesControllerState,
  TokensControllerState,
  RatesControllerState,
  TokenBalancesControllerState,
} from '@metamask/assets-controllers';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { ApprovalControllerState } from '@metamask/approval-controller';
import type { EnsControllerState } from '@metamask/ens-controller';
import type { PhishingControllerState } from '@metamask/phishing-controller';
import type { AnnouncementControllerState } from '@metamask/announcement-controller';
import type { NetworkState } from '@metamask/network-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type {
  PermissionConstraint,
  PermissionControllerState,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import type { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type { LoggingControllerState } from '@metamask/logging-controller';
import type { PermissionLogControllerState } from '@metamask/permission-log-controller';
import type { NotificationControllerState } from '@metamask/notification-controller';
import type {
  CronjobControllerState,
  SnapControllerState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
  SnapsRegistryState,
} from '@metamask/snaps-controllers';
import type { AccountsControllerState } from '@metamask/accounts-controller';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import type { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import type { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import type { CustodyController } from '@metamask-institutional/custody-controller';
///: END:ONLY_INCLUDE_IF
import type { SignatureControllerState } from '@metamask/signature-controller';
import type { PPOMState } from '@metamask/ppom-validator';

import type { NameControllerState } from '@metamask/name-controller';

import type { QueuedRequestControllerState } from '@metamask/queued-request-controller';

import type { UserOperationControllerState } from '@metamask/user-operation-controller';

import type { TransactionControllerState } from '@metamask/transaction-controller';
import type {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import type {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';

import { BridgeStatusControllerState } from '../../shared/types/bridge-status';

import type { BalancesController as MultichainBalancesControllerState } from './lib/accounts/BalancesController';
import type { NetworkOrderControllerState } from './controllers/network-order';
import type { AccountOrderControllerState } from './controllers/account-order';
import type { PreferencesControllerState } from './controllers/preferences-controller';
import type { AppStateControllerState } from './controllers/app-state-controller';
import type { AlertControllerState } from './controllers/alert-controller';
import type { OnboardingControllerState } from './controllers/onboarding';
import type { EncryptionPublicKeyControllerState } from './controllers/encryption-public-key';
import type { AppMetadataControllerState } from './controllers/app-metadata';
import type { DecryptMessageControllerState } from './controllers/decrypt-message';
import type { SwapsControllerState } from './controllers/swaps/swaps.types';
import type { BridgeControllerState } from './controllers/bridge/types';
import { MetaMetricsDataDeletionState } from './controllers/metametrics-data-deletion/metametrics-data-deletion';
import { MetaMetricsControllerState } from './controllers/metametrics-controller';
import { AccountTrackerControllerState } from './controllers/account-tracker-controller';

export type ResetOnRestartStoresComposedState = {
  AccountTracker: AccountTrackerControllerState;
  TokenRatesController: TokenRatesControllerState;
  DecryptMessageController: DecryptMessageControllerState;
  EncryptionPublicKeyController: EncryptionPublicKeyControllerState;
  SignatureController: SignatureControllerState;
  SwapsController: SwapsControllerState;
  BridgeController: BridgeControllerState;
  BridgeStatusController: BridgeStatusControllerState;
  EnsController: EnsControllerState;
  ApprovalController: ApprovalControllerState;
  PPOMController: PPOMState;
};

export type StoreControllersComposedState =
  ResetOnRestartStoresComposedState & {
    AccountsController: AccountsControllerState;
    AppStateController: AppStateControllerState;
    AppMetadataController: AppMetadataControllerState;
    MultichainBalancesController: MultichainBalancesControllerState;
    TransactionController: TransactionControllerState;
    KeyringController: KeyringControllerState;
    PreferencesController: PreferencesControllerState;
    MetaMetricsController: MetaMetricsControllerState;
    MetaMetricsDataDeletionController: MetaMetricsDataDeletionState;
    AddressBookController: AddressBookControllerState;
    CurrencyController: CurrencyRateState;
    NetworkController: NetworkState;
    AlertController: AlertControllerState;
    OnboardingController: OnboardingControllerState;
    PermissionController: PermissionControllerState<PermissionConstraint>;
    PermissionLogController: PermissionLogControllerState;
    SubjectMetadataController: SubjectMetadataControllerState;
    AnnouncementController: AnnouncementControllerState;
    NetworkOrderController: NetworkOrderControllerState;
    AccountOrderController: AccountOrderControllerState;
    GasFeeController: GasFeeState;
    TokenListController: TokenListState;
    TokensController: TokensControllerState;
    TokenBalancesController: TokenBalancesControllerState;
    SmartTransactionsController: SmartTransactionsControllerState;
    NftController: NftControllerState;
    PhishingController: PhishingControllerState;
    SelectedNetworkController: SelectedNetworkControllerState;
    LoggingController: LoggingControllerState;
    MultichainRatesController: RatesControllerState;
    SnapController: SnapControllerState;
    CronjobController: CronjobControllerState;
    SnapsRegistry: SnapsRegistryState;
    NotificationController: NotificationControllerState;
    SnapInterfaceController: SnapInterfaceControllerState;
    SnapInsightsController: SnapInsightsControllerState;
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    CustodyController: CustodyController['store'];
    InstitutionalFeaturesController: InstitutionalFeaturesController['store'];
    MmiConfigurationController: MmiConfigurationController['store'];
    ///: END:ONLY_INCLUDE_IF
    NameController: NameControllerState;
    UserOperationController: UserOperationControllerState;
    // Notification Controllers
    AuthenticationController: AuthenticationController.AuthenticationControllerState;
    UserStorageController: UserStorageController.UserStorageControllerState;
    NotificationServicesController: NotificationServicesController.NotificationServicesControllerState;
    NotificationServicesPushController: NotificationServicesPushController.NotificationServicesPushControllerState;
  };

export type MemStoreControllersComposedState = Omit<
  StoreControllersComposedState,
  'PhishingController' | 'TransactionController'
> & {
  TxController: TransactionControllerState;
  QueuedRequestController: QueuedRequestControllerState;
};

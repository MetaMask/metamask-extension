/* eslint-disable import/no-restricted-paths */
/** Circular dependencies in this file should not have any performance impact, since all imports/exports are types that are stripped at runtime */
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
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import type { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type { LoggingControllerState } from '@metamask/logging-controller';
import type { PermissionLogControllerState } from '@metamask/permission-log-controller';
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

import type { BalancesController as MultichainBalancesControllerState } from '../../app/scripts/lib/accounts/BalancesController';
import type { NetworkOrderControllerState } from '../../app/scripts/controllers/network-order';
import type { AccountOrderControllerState } from '../../app/scripts/controllers/account-order';
import type { PreferencesControllerState } from '../../app/scripts/controllers/preferences-controller';
import type { AppStateControllerState } from '../../app/scripts/controllers/app-state-controller';
import type { AlertControllerState } from '../../app/scripts/controllers/alert-controller';
import type { OnboardingControllerState } from '../../app/scripts/controllers/onboarding';
import type { EncryptionPublicKeyControllerState } from '../../app/scripts/controllers/encryption-public-key';
import type { AppMetadataControllerState } from '../../app/scripts/controllers/app-metadata';
import type { DecryptMessageControllerState } from '../../app/scripts/controllers/decrypt-message';
import type { SwapsControllerState } from '../../app/scripts/controllers/swaps/swaps.types';
import type { BridgeControllerState } from '../../app/scripts/controllers/bridge/types';
import type { MetaMetricsDataDeletionState } from '../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import type { MetaMetricsControllerState } from '../../app/scripts/controllers/metametrics-controller';
import type { AccountTrackerControllerState } from '../../app/scripts/controllers/account-tracker-controller';
import type { BridgeStatusControllerState } from './bridge-status';

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
    RemoteFeatureFlagController: RemoteFeatureFlagControllerState;
  };

export type MemStoreControllersComposedState = Omit<
  StoreControllersComposedState,
  'PhishingController' | 'TransactionController'
> & {
  TxController: TransactionControllerState;
  QueuedRequestController: QueuedRequestControllerState;
};

export type BackgroundStateProxy = {
  isInitialized: boolean;
} & MemStoreControllersComposedState;

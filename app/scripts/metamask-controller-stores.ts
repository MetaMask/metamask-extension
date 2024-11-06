import type {
  CurrencyRateController,
  NftController,
  TokenListController,
  TokenRatesController,
  TokensController,
  RatesController,
} from '@metamask/assets-controllers';
import type { KeyringController } from '@metamask/keyring-controller';
import type { AddressBookController } from '@metamask/address-book-controller';
import type { ApprovalController } from '@metamask/approval-controller';
import type { EnsController } from '@metamask/ens-controller';
import type { PhishingController } from '@metamask/phishing-controller';
import type { AnnouncementController } from '@metamask/announcement-controller';
import type { NetworkController } from '@metamask/network-controller';
import type { GasFeeController } from '@metamask/gas-fee-controller';
import type {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
  SubjectMetadataController,
} from '@metamask/permission-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import type { SelectedNetworkController } from '@metamask/selected-network-controller';
import type { LoggingController } from '@metamask/logging-controller';
import type { PermissionLogController } from '@metamask/permission-log-controller';
import type { NotificationController } from '@metamask/notification-controller';
import type {
  CronjobController,
  SnapController,
  SnapInterfaceController,
  SnapInsightsController,
  SnapsRegistry,
} from '@metamask/snaps-controllers';
import type { AccountsController } from '@metamask/accounts-controller';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import type { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import type { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import type { CustodyController } from '@metamask-institutional/custody-controller';
///: END:ONLY_INCLUDE_IF
import type { SignatureController } from '@metamask/signature-controller';
import type { PPOMController } from '@metamask/ppom-validator';

import type { NameController } from '@metamask/name-controller';

import type { QueuedRequestController } from '@metamask/queued-request-controller';

import type { UserOperationController } from '@metamask/user-operation-controller';

import type { TransactionController } from '@metamask/transaction-controller';
import type {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import type {
  NotificationServicesPushController,
  NotificationServicesController,
} from '@metamask/notification-services-controller';

import type { BalancesController as MultichainBalancesController } from './lib/accounts/BalancesController';
import AccountTrackerController from './controllers/account-tracker-controller';
import type { NetworkOrderController } from './controllers/network-order';
import type { AccountOrderController } from './controllers/account-order';
import type { PreferencesController } from './controllers/preferences-controller';
import type { AppStateController } from './controllers/app-state-controller';
import type { AlertController } from './controllers/alert-controller';
import OnboardingController from './controllers/onboarding';
import SwapsController from './controllers/swaps';
import MetaMetricsController from './controllers/metametrics';
import EncryptionPublicKeyController from './controllers/encryption-public-key';
import AppMetadataController from './controllers/app-metadata';
import DecryptMessageController from './controllers/decrypt-message';
import BridgeController from './controllers/bridge/bridge-controller';
import type { MetaMetricsDataDeletionController } from './controllers/metametrics-data-deletion/metametrics-data-deletion';

export type ResetOnRestartStore = {
  AccountTracker: AccountTrackerController;
  TokenRatesController: TokenRatesController;
  DecryptMessageController: DecryptMessageController;
  EncryptionPublicKeyController: EncryptionPublicKeyController;
  SignatureController: SignatureController;
  SwapsController: SwapsController;
  BridgeController: BridgeController;
  EnsController: EnsController;
  ApprovalController: ApprovalController;
  PPOMController: PPOMController;
};

export type StoreControllers = ResetOnRestartStore & {
  AccountsController: AccountsController;
  AppStateController: AppStateController['store'];
  AppMetadataController: AppMetadataController['store'];
  MultichainBalancesController: MultichainBalancesController;
  TransactionController: TransactionController;
  KeyringController: KeyringController;
  PreferencesController: PreferencesController;
  MetaMetricsController: MetaMetricsController['store'];
  MetaMetricsDataDeletionController: MetaMetricsDataDeletionController;
  AddressBookController: AddressBookController;
  CurrencyController: CurrencyRateController;
  NetworkController: NetworkController;
  AlertController: AlertController['store'];
  OnboardingController: OnboardingController;
  PermissionController: PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >;
  PermissionLogController: PermissionLogController;
  SubjectMetadataController: SubjectMetadataController;
  AnnouncementController: AnnouncementController;
  NetworkOrderController: NetworkOrderController;
  AccountOrderController: AccountOrderController;
  GasFeeController: GasFeeController;
  TokenListController: TokenListController;
  TokensController: TokensController;
  SmartTransactionsController: SmartTransactionsController;
  NftController: NftController;
  PhishingController: PhishingController;
  SelectedNetworkController: SelectedNetworkController;
  LoggingController: LoggingController;
  MultichainRatesController: RatesController;
  SnapController: SnapController;
  CronjobController: CronjobController;
  SnapsRegistry: SnapsRegistry;
  NotificationController: NotificationController;
  SnapInterfaceController: SnapInterfaceController;
  SnapInsightsController: SnapInsightsController;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CustodyController: CustodyController['store'];
  InstitutionalFeaturesController: InstitutionalFeaturesController['store'];
  MmiConfigurationController: MmiConfigurationController['store'];
  ///: END:ONLY_INCLUDE_IF
  PPOMController: PPOMController;
  NameController: NameController;
  UserOperationController: UserOperationController;
  // Notification Controllers
  AuthenticationController: AuthenticationController.Controller;
  UserStorageController: UserStorageController.Controller;
  NotificationServicesController: NotificationServicesController.Controller;
  NotificationServicesPushController: NotificationServicesPushController.Controller;
};

export type MemStoreControllers = Omit<
  StoreControllers,
  'PhishingController' | 'PPOMController' | 'TransactionController'
> & {
  TxController: TransactionController;
  QueuedRequestController: QueuedRequestController;
};

/* eslint-disable import/no-restricted-paths */
/** Circular dependencies in this file should have no impact at build time and runtime, ås all imports/exports are types that will be stripped by tsc */
import {
  TokenRatesController,
  CurrencyRateController,
  TokenListController,
  TokensController,
  TokenBalancesController,
  NftController,
  RatesController,
  CurrencyRateState,
  TokenListState,
  TokensControllerState,
  TokenBalancesControllerState,
  NftControllerState,
  RatesControllerState,
  TokenRatesControllerState,
} from '@metamask/assets-controllers';
import {
  KeyringController,
  KeyringControllerState,
} from '@metamask/keyring-controller';
import {
  AddressBookController,
  AddressBookControllerState,
} from '@metamask/address-book-controller';
import {
  ApprovalController,
  ApprovalControllerState,
} from '@metamask/approval-controller';
import { EnsController, EnsControllerState } from '@metamask/ens-controller';
import {
  PhishingController,
  PhishingControllerState,
} from '@metamask/phishing-controller';
import {
  AnnouncementController,
  AnnouncementControllerState,
} from '@metamask/announcement-controller';
import { NetworkController, NetworkState } from '@metamask/network-controller';
import { GasFeeController, GasFeeState } from '@metamask/gas-fee-controller';
import {
  CaveatConstraint,
  PermissionConstraint,
  PermissionController,
  PermissionControllerState,
  PermissionSpecificationConstraint,
  SubjectMetadataController,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import {
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import {
  SelectedNetworkController,
  SelectedNetworkControllerState,
} from '@metamask/selected-network-controller';
import {
  LoggingController,
  LoggingControllerState,
} from '@metamask/logging-controller';
import {
  PermissionLogController,
  PermissionLogControllerState,
} from '@metamask/permission-log-controller';
import {
  SnapController,
  CronjobController,
  SnapInterfaceController,
  SnapInsightsController,
  SnapControllerState,
  CronjobControllerState,
  SnapsRegistryState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
  JsonSnapsRegistry,
} from '@metamask/snaps-controllers';
import {
  AccountsController,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import {
  SignatureController,
  SignatureControllerState,
} from '@metamask/signature-controller';
import { PPOMController, PPOMState } from '@metamask/ppom-validator';
import { NameController, NameControllerState } from '@metamask/name-controller';
import {
  QueuedRequestController,
  QueuedRequestControllerState,
} from '@metamask/queued-request-controller';
import {
  UserOperationController,
  UserOperationControllerState,
} from '@metamask/user-operation-controller';
import {
  TransactionController,
  TransactionControllerState,
} from '@metamask/transaction-controller';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import SmartTransactionsController, {
  SmartTransactionsControllerState,
} from '@metamask/smart-transactions-controller';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';

import AccountTrackerController, {
  AccountTrackerControllerState,
} from '../../app/scripts/controllers/account-tracker-controller';
import {
  BalancesController,
  BalancesControllerState,
} from '../../app/scripts/lib/accounts/BalancesController';
import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../app/scripts/controllers/network-order';
import {
  AccountOrderController,
  AccountOrderControllerState,
} from '../../app/scripts/controllers/account-order';
import {
  PreferencesController,
  PreferencesControllerState,
} from '../../app/scripts/controllers/preferences-controller';
import {
  AppStateController,
  AppStateControllerState,
} from '../../app/scripts/controllers/app-state-controller';
import {
  AlertController,
  AlertControllerState,
} from '../../app/scripts/controllers/alert-controller';
import {
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionState,
} from '../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import BridgeController from '../../app/scripts/controllers/bridge/bridge-controller';
import BridgeStatusController from '../../app/scripts/controllers/bridge-status/bridge-status-controller';
import SwapsController from '../../app/scripts/controllers/swaps';
import EncryptionPublicKeyController, {
  EncryptionPublicKeyControllerState,
} from '../../app/scripts/controllers/encryption-public-key';
import DecryptMessageController, {
  DecryptMessageControllerState,
} from '../../app/scripts/controllers/decrypt-message';
import OnboardingController, {
  OnboardingControllerState,
} from '../../app/scripts/controllers/onboarding';
import MetaMetricsController, {
  MetaMetricsControllerState,
} from '../../app/scripts/controllers/metametrics-controller';
import AppMetadataController, {
  AppMetadataControllerState,
} from '../../app/scripts/controllers/app-metadata';
import { SwapsControllerState } from '../../app/scripts/controllers/swaps/swaps.types';

import { BridgeControllerState } from './bridge';
import { BridgeStatusControllerState } from './bridge-status';
import {
  CustodyControllerState,
  InstitutionalFeaturesControllerState,
  MmiConfigurationControllerState,
} from './institutional';

export type ResetOnRestartStores = {
  AccountTracker: AccountTrackerController;
  TokenRatesController: TokenRatesController;
  DecryptMessageController: DecryptMessageController;
  EncryptionPublicKeyController: EncryptionPublicKeyController;
  SignatureController: SignatureController;
  SwapsController: SwapsController;
  BridgeController: BridgeController;
  BridgeStatusController: BridgeStatusController;
  EnsController: EnsController;
  ApprovalController: ApprovalController;
  PPOMController: PPOMController;
};

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

export type StoreControllers = ResetOnRestartStores & {
  AccountsController: AccountsController;
  AppStateController: AppStateController;
  AppMetadataController: AppMetadataController;
  MultichainBalancesController: BalancesController;
  TransactionController: TransactionController;
  KeyringController: KeyringController;
  PreferencesController: PreferencesController;
  MetaMetricsController: MetaMetricsController;
  MetaMetricsDataDeletionController: MetaMetricsDataDeletionController;
  AddressBookController: AddressBookController;
  CurrencyController: CurrencyRateController;
  NetworkController: NetworkController;
  AlertController: AlertController;
  OnboardingController: OnboardingController;
  PermissionController: PermissionController<
    PermissionSpecificationConstraint,
    CaveatConstraint
  >;
  PermissionLogController: PermissionLogController;
  SubjectMetadataController: SubjectMetadataController;
  AnnouncementController: AnnouncementController;
  NetworkOrderController: NetworkOrderController;
  AccountOrderController: AccountOrderController;
  GasFeeController: GasFeeController;
  TokenListController: TokenListController;
  TokensController: TokensController;
  TokenBalancesController: TokenBalancesController;
  SmartTransactionsController: SmartTransactionsController;
  NftController: NftController;
  PhishingController: PhishingController;
  SelectedNetworkController: SelectedNetworkController;
  LoggingController: LoggingController;
  MultichainRatesController: RatesController;
  SnapController: SnapController;
  CronjobController: CronjobController;
  SnapsRegistry: JsonSnapsRegistry;
  SnapInterfaceController: SnapInterfaceController;
  SnapInsightsController: SnapInsightsController;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CustodyController: CustodyController;
  InstitutionalFeaturesController: InstitutionalFeaturesController;
  MmiConfigurationController: MmiConfigurationController;
  ///: END:ONLY_INCLUDE_IF
  NameController: NameController;
  UserOperationController: UserOperationController;
  // Notification Controllers
  AuthenticationController: AuthenticationController.Controller;
  UserStorageController: UserStorageController.Controller;
  NotificationServicesController: NotificationServicesController.Controller;
  NotificationServicesPushController: NotificationServicesPushController.Controller;
  RemoteFeatureFlagController: RemoteFeatureFlagController;
};

export type StoreControllersComposedState =
  ResetOnRestartStoresComposedState & {
    AccountsController: AccountsControllerState;
    AppStateController: AppStateControllerState;
    AppMetadataController: AppMetadataControllerState;
    MultichainBalancesController: BalancesControllerState;
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
    CustodyController: CustodyControllerState;
    InstitutionalFeaturesController: InstitutionalFeaturesControllerState;
    MmiConfigurationController: MmiConfigurationControllerState;
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

export type MemStoreControllers = Omit<
  StoreControllers,
  'PhishingController' | 'TransactionController'
> & {
  TxController: TransactionController;
  QueuedRequestController: QueuedRequestController;
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

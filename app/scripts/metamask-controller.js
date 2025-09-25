import EventEmitter from 'events';
import { finished, pipeline } from 'readable-stream';
import browser from 'webextension-polyfill';
import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JsonRpcEngine,
} from '@metamask/json-rpc-engine';
import { createEngineStream } from '@metamask/json-rpc-middleware-stream';
import { ObservableStore } from '@metamask/obs-store';
import { storeAsStream } from '@metamask/obs-store/dist/asStream';
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
import { debounce, uniq } from 'lodash';
import { KeyringTypes } from '@metamask/keyring-controller';
import createFilterMiddleware from '@metamask/eth-json-rpc-filters';
import createSubscriptionManager from '@metamask/eth-json-rpc-filters/subscriptionManager';
import { errorCodes, JsonRpcError, rpcErrors } from '@metamask/rpc-errors';
import { Mutex } from 'await-semaphore';
import log from 'loglevel';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import { rawChainData } from 'eth-chainlist';
import { QrKeyring } from '@metamask/eth-qr-keyring';
import { nanoid } from 'nanoid';
import { AddressBookController } from '@metamask/address-book-controller';
import {
  ApprovalController,
  ApprovalRequestNotFoundError,
} from '@metamask/approval-controller';
import { Messenger } from '@metamask/base-controller';
import { PhishingController } from '@metamask/phishing-controller';
import { AnnouncementController } from '@metamask/announcement-controller';
import {
  MethodNames,
  PermissionDoesNotExistError,
  PermissionsRequestNotFoundError,
  SubjectType,
} from '@metamask/permission-controller';
import {
  METAMASK_DOMAIN,
  createSelectedNetworkMiddleware,
} from '@metamask/selected-network-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';

import { MultichainRouter } from '@metamask/snaps-controllers';
import {
  createPreinstalledSnapsMiddleware,
  createSnapsMethodMiddleware,
} from '@metamask/snaps-rpc-methods';
import {
  ApprovalType,
  ERC1155,
  ERC20,
  ERC721,
} from '@metamask/controller-utils';

import { AccountsController } from '@metamask/accounts-controller';
import { SignatureController } from '@metamask/signature-controller';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

import { UserOperationController } from '@metamask/user-operation-controller';
import {
  BRIDGE_CONTROLLER_NAME,
  BridgeUserAction,
  BridgeBackgroundAction,
} from '@metamask/bridge-controller';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { Interface } from '@ethersproject/abi';
import { abiERC1155, abiERC721 } from '@metamask/metamask-eth-abis';
import {
  isEvmAccountType,
  SolAccountType,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcScope,
  ///: END:ONLY_INCLUDE_IF
  SolScope,
} from '@metamask/keyring-api';
import {
  hexToBigInt,
  toCaipChainId,
  parseCaipAccountId,
  add0x,
  hexToBytes,
  bytesToHex,
  KnownCaipNamespace,
} from '@metamask/utils';
import { normalize } from '@metamask/eth-sig-util';

import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';

import {
  multichainMethodCallValidatorMiddleware,
  MultichainSubscriptionManager,
  MultichainMiddlewareManager,
  walletGetSession,
  walletRevokeSession,
  walletInvokeMethod,
  MultichainApiNotifications,
  walletCreateSession,
} from '@metamask/multichain-api-middleware';

import {
  getCallsStatus,
  getCapabilities,
  processSendCalls,
  walletGetCallsStatus,
  walletGetCapabilities,
  walletSendCalls,
} from '@metamask/eip-5792-middleware';

import {
  Caip25CaveatMutators,
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getSessionScopes,
  setPermittedEthChainIds,
  getPermittedAccountsForScopes,
  KnownSessionProperties,
  getAllScopesFromCaip25CaveatValue,
  requestPermittedChainsPermissionIncremental,
  getCaip25PermissionFromLegacyPermissions,
} from '@metamask/chain-agnostic-permission';
import {
  BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusAction,
} from '@metamask/bridge-status-controller';

import { ErrorReportingService } from '@metamask/error-reporting-service';
import {
  SeedlessOnboardingControllerErrorMessage,
  SecretType,
  RecoveryError,
} from '@metamask/seedless-onboarding-controller';
import {
  FEATURE_VERSION_2,
  isMultichainAccountsFeatureEnabled,
} from '../../shared/lib/multichain-accounts/remote-feature-flag';
import { captureException } from '../../shared/lib/sentry';
import { TokenStandard } from '../../shared/constants/transaction';
import {
  CHAIN_IDS,
  CHAIN_SPEC_URL,
  NetworkStatus,
  UNSUPPORTED_RPC_METHODS,
} from '../../shared/constants/network';

import {
  HardwareDeviceNames,
  HardwareKeyringType,
  LedgerTransportTypes,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { RestrictedMethods } from '../../shared/constants/permissions';
import { UI_NOTIFICATIONS } from '../../shared/notifications';
import { MILLISECOND, MINUTE, SECOND } from '../../shared/constants/time';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ORIGIN_METAMASK,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
  MESSAGE_TYPE,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
  PLATFORM_FIREFOX,
} from '../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsRequestedThrough,
} from '../../shared/constants/metametrics';
import { LOG_EVENT } from '../../shared/constants/logs';

import {
  getStorageItem,
  setStorageItem,
} from '../../shared/lib/storage-helpers';
import {
  getTokenIdParam,
  fetchTokenBalance,
  fetchERC1155Balance,
} from '../../shared/lib/token-util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { parseStandardTokenTransactionData } from '../../shared/modules/transaction.utils';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { convertNetworkId } from '../../shared/modules/network.utils';
import { getIsSmartTransaction } from '../../shared/modules/selectors';
import {
  TOKEN_TRANSFER_LOG_TOPIC_HASH,
  TRANSFER_SINFLE_LOG_TOPIC_HASH,
} from '../../shared/lib/transactions-controller-utils';
import { getProviderConfig } from '../../shared/modules/selectors/networks';
import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
} from '../../shared/lib/trace';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { MultichainWalletSnapClient } from '../../shared/lib/accounts';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { BITCOIN_WALLET_SNAP_ID } from '../../shared/lib/accounts/bitcoin-wallet-snap';
///: END:ONLY_INCLUDE_IF
import { SOLANA_WALLET_SNAP_ID } from '../../shared/lib/accounts/solana-wallet-snap';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { updateCurrentLocale } from '../../shared/lib/translate';
import {
  getIsSeedlessOnboardingFeatureEnabled,
  isGatorPermissionsFeatureEnabled,
} from '../../shared/modules/environment';
import { isSnapPreinstalled } from '../../shared/lib/snaps/snaps';
import { getShieldGatewayConfig } from '../../shared/modules/shield';
import {
  HYPERLIQUID_ORIGIN,
  METAMASK_REFERRAL_CODE,
} from '../../shared/constants/referrals';
import { createTransactionEventFragmentWithTxId } from './lib/transaction/metrics';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { keyringSnapPermissionsBuilder } from './lib/snap-keyring/keyring-snaps-permissions';
///: END:ONLY_INCLUDE_IF

import { AddressBookPetnamesBridge } from './lib/AddressBookPetnamesBridge';
import { AccountIdentitiesPetnamesBridge } from './lib/AccountIdentitiesPetnamesBridge';
import { createPPOMMiddleware } from './lib/ppom/ppom-middleware';
import { createTrustSignalsMiddleware } from './lib/trust-signals/trust-signals-middleware';
import {
  onMessageReceived,
  checkForMultipleVersionsRunning,
} from './detect-multiple-instances';
import ComposableObservableStore from './lib/ComposableObservableStore';
import createDupeReqFilterStream from './lib/createDupeReqFilterStream';
import createLoggerMiddleware from './lib/createLoggerMiddleware';
import {
  createEthAccountsMethodMiddleware,
  createEip1193MethodMiddleware,
  createUnsupportedMethodMiddleware,
  createMultichainMethodMiddleware,
  makeMethodMiddlewareMaker,
} from './lib/rpc-method-middleware';
import createOriginMiddleware from './lib/createOriginMiddleware';
import createMainFrameOriginMiddleware from './lib/createMainFrameOriginMiddleware';
import createTabIdMiddleware from './lib/createTabIdMiddleware';
import { AccountOrderController } from './controllers/account-order';
import createOnboardingMiddleware from './lib/createOnboardingMiddleware';
import { isStreamWritable, setupMultiplex } from './lib/stream-utils';
import { ReferralStatus } from './controllers/preferences-controller';
import { AlertController } from './controllers/alert-controller';
import Backup from './lib/backup';
import DecryptMessageController from './controllers/decrypt-message';
import createMetaRPCHandler from './lib/createMetaRPCHandler';
import {
  addHexPrefix,
  getMethodDataName,
  previousValueComparator,
  initializeRpcProviderDomains,
  getPlatform,
} from './lib/util';
import createMetamaskMiddleware from './lib/createMetamaskMiddleware';
import EncryptionPublicKeyController from './controllers/encryption-public-key';
import AppMetadataController from './controllers/app-metadata';
import {
  createHyperliquidReferralMiddleware,
  HyperliquidPermissionTriggerType,
} from './lib/createHyperliquidReferralMiddleware';

import {
  diffMap,
  getPermissionBackgroundApiMethods,
  getPermittedAccountsByOrigin,
  getPermittedChainsByOrigin,
  NOTIFICATION_NAMES,
  getRemovedAuthorizations,
  getChangedAuthorizations,
  getAuthorizedScopesByOrigin,
  getPermittedAccountsForScopesByOrigin,
  getOriginsWithSessionProperty,
} from './controllers/permissions';
import { MetaMetricsDataDeletionController } from './controllers/metametrics-data-deletion/metametrics-data-deletion';
import { DataDeletionService } from './services/data-deletion-service';
import createRPCMethodTrackingMiddleware from './lib/createRPCMethodTrackingMiddleware';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { getAccountsBySnapId } from './lib/snap-keyring';
///: END:ONLY_INCLUDE_IF
import { addDappTransaction, addTransaction } from './lib/transaction/util';
import { addTypedMessage, addPersonalMessage } from './lib/signature/util';
import {
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
  METAMASK_COOKIE_HANDLER,
  METAMASK_EIP_1193_PROVIDER,
} from './constants/stream';

// Notification controllers
import {
  updateSecurityAlertResponse,
  validateRequestWithPPOM,
} from './lib/ppom/ppom-util';
import createEvmMethodsToNonEvmAccountReqFilterMiddleware from './lib/createEvmMethodsToNonEvmAccountReqFilterMiddleware';
import { isEthAddress } from './lib/multichain/address';

import { decodeTransactionData } from './lib/transaction/decode/util';
import createTracingMiddleware from './lib/createTracingMiddleware';
import createOriginThrottlingMiddleware from './lib/createOriginThrottlingMiddleware';
import { PatchStore } from './lib/PatchStore';
import { sanitizeUIState } from './lib/state-utils';
import {
  rejectAllApprovals,
  rejectOriginApprovals,
} from './lib/approval/utils';
import { InstitutionalSnapControllerInit } from './controller-init/institutional-snap/institutional-snap-controller-init';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  MultichainAssetsControllerInit,
  MultichainTransactionsControllerInit,
  MultichainBalancesControllerInit,
  MultichainAssetsRatesControllerInit,
  ///: END:ONLY_INCLUDE_IF
  MultichainNetworkControllerInit,
} from './controller-init/multichain';
import {
  AssetsContractControllerInit,
  NetworkOrderControllerInit,
  NftControllerInit,
  NftDetectionControllerInit,
  TokenRatesControllerInit,
} from './controller-init/assets';
import { TransactionControllerInit } from './controller-init/confirmations/transaction-controller-init';
import { PPOMControllerInit } from './controller-init/confirmations/ppom-controller-init';
import { SmartTransactionsControllerInit } from './controller-init/smart-transactions/smart-transactions-controller-init';
import { initControllers } from './controller-init/utils';
import {
  CronjobControllerInit,
  ExecutionServiceInit,
  RateLimitControllerInit,
  SnapControllerInit,
  SnapInsightsControllerInit,
  SnapInterfaceControllerInit,
  SnapsNameProviderInit,
  SnapsRegistryInit,
  WebSocketServiceInit,
} from './controller-init/snaps';
import { AuthenticationControllerInit } from './controller-init/identity/authentication-controller-init';
import { UserStorageControllerInit } from './controller-init/identity/user-storage-controller-init';
import { DeFiPositionsControllerInit } from './controller-init/defi-positions/defi-positions-controller-init';
import { NotificationServicesControllerInit } from './controller-init/notifications/notification-services-controller-init';
import { NotificationServicesPushControllerInit } from './controller-init/notifications/notification-services-push-controller-init';
import { DelegationControllerInit } from './controller-init/delegation/delegation-controller-init';
import { isRelaySupported } from './lib/transaction/transaction-relay';
import { openUpdateTabAndReload } from './lib/open-update-tab-and-reload';
import { AccountTreeControllerInit } from './controller-init/accounts/account-tree-controller-init';
import { MultichainAccountServiceInit } from './controller-init/multichain/multichain-account-service-init';
import {
  OAuthServiceInit,
  SeedlessOnboardingControllerInit,
} from './controller-init/seedless-onboarding';
import { applyTransactionContainersExisting } from './lib/transaction/containers/util';
import {
  getSendBundleSupportedChains,
  isSendBundleSupported,
} from './lib/transaction/sentinel-api';
import { ShieldControllerInit } from './controller-init/shield/shield-controller-init';
import { GatorPermissionsControllerInit } from './controller-init/gator-permissions/gator-permissions-controller-init';

import { forwardRequestToSnap } from './lib/forwardRequestToSnap';
import { MetaMetricsControllerInit } from './controller-init/metametrics-controller-init';
import { TokenListControllerInit } from './controller-init/token-list-controller-init';
import { TokenDetectionControllerInit } from './controller-init/token-detection-controller-init';
import { TokensControllerInit } from './controller-init/tokens-controller-init';
import { TokenBalancesControllerInit } from './controller-init/token-balances-controller-init';
import { RatesControllerInit } from './controller-init/rates-controller-init';
import { CurrencyRateControllerInit } from './controller-init/currency-rate-controller-init';
import { EnsControllerInit } from './controller-init/confirmations/ens-controller-init';
import { NameControllerInit } from './controller-init/confirmations/name-controller-init';
import { GasFeeControllerInit } from './controller-init/confirmations/gas-fee-controller-init';
import { SelectedNetworkControllerInit } from './controller-init/selected-network-controller-init';
import { SubscriptionControllerInit } from './controller-init/subscription';
import { getIdentityAPI } from './services/oauth/web-authenticator-factory';
import { AccountTrackerControllerInit } from './controller-init/account-tracker-controller-init';
import { OnboardingControllerInit } from './controller-init/onboarding-controller-init';
import { RemoteFeatureFlagControllerInit } from './controller-init/remote-feature-flag-controller-init';
import { SwapsControllerInit } from './controller-init/swaps-controller-init';
import { BridgeControllerInit } from './controller-init/bridge-controller-init';
import { BridgeStatusControllerInit } from './controller-init/bridge-status-controller-init';
import { PreferencesControllerInit } from './controller-init/preferences-controller-init';
import { AppStateControllerInit } from './controller-init/app-state-controller-init';
import { PermissionControllerInit } from './controller-init/permission-controller-init';
import { SubjectMetadataControllerInit } from './controller-init/subject-metadata-controller-init';
import { KeyringControllerInit } from './controller-init/keyring-controller-init';
import { SnapKeyringBuilderInit } from './controller-init/accounts/snap-keyring-builder-init';
import { PermissionLogControllerInit } from './controller-init/permission-log-controller-init';
import { NetworkControllerInit } from './controller-init/network-controller-init';

export const METAMASK_CONTROLLER_EVENTS = {
  // Fired after state changes that impact the extension badge (unapproved msg count)
  // The process of updating the badge happens in app/scripts/background.js.
  UPDATE_BADGE: 'updateBadge',
  DECRYPT_MESSAGE_MANAGER_UPDATE_BADGE: 'DecryptMessageManager:updateBadge',
  ENCRYPTION_PUBLIC_KEY_MANAGER_UPDATE_BADGE:
    'EncryptionPublicKeyManager:updateBadge',
  // TODO: Add this and similar enums to the `controllers` repo and export them
  APPROVAL_STATE_CHANGE: 'ApprovalController:stateChange',
  APP_STATE_UNLOCK_CHANGE: 'AppStateController:unlockChange',
  METAMASK_NOTIFICATIONS_LIST_UPDATED:
    'NotificationServicesController:notificationsListUpdated',
  METAMASK_NOTIFICATIONS_MARK_AS_READ:
    'NotificationServicesController:markNotificationsAsRead',
};

/**
 * @typedef {import('../../ui/store/store').MetaMaskReduxState} MetaMaskReduxState
 */

// Types of APIs
const API_TYPE = {
  EIP1193: 'eip-1193',
  CAIP_MULTICHAIN: 'caip-multichain',
};

// stream channels
const PHISHING_SAFELIST = 'metamask-phishing-safelist';

export default class MetamaskController extends EventEmitter {
  /**
   * @param {object} opts
   */
  constructor(opts) {
    super();

    const { isFirstMetaMaskControllerSetup } = opts;

    this.defaultMaxListeners = 20;

    this.sendUpdate = debounce(
      this.privateSendUpdate.bind(this),
      MILLISECOND * 200,
    );
    this.opts = opts;
    this.requestSafeReload =
      opts.requestSafeReload ?? (() => Promise.resolve());
    this.extension = opts.browser;
    this.platform = opts.platform;
    this.notificationManager = opts.notificationManager;
    const initState = opts.initState || {};
    const version = process.env.METAMASK_VERSION;
    this.recordFirstTimeInfo(initState);
    this.featureFlags = opts.featureFlags;

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0;

    this.offscreenPromise = opts.offscreenPromise ?? Promise.resolve();

    this.getRequestAccountTabIds = opts.getRequestAccountTabIds;
    this.getOpenMetamaskTabsIds = opts.getOpenMetamaskTabsIds;

    this.initializeChainlist();

    this.controllerMessenger = new Messenger();

    this.loggingController = new LoggingController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'LoggingController',
        allowedActions: [],
        allowedEvents: [],
      }),
      state: initState.LoggingController,
    });

    this.currentMigrationVersion = opts.currentMigrationVersion;

    // observable state store
    this.store = new ComposableObservableStore({
      state: initState,
      controllerMessenger: this.controllerMessenger,
      persist: true,
    });

    // external connections by origin
    // Do not modify directly. Use the associated methods.
    this.connections = {};

    // lock to ensure only one vault created at once
    this.createVaultMutex = new Mutex();

    // lock to ensure only one seedless onboarding operation is running at once
    this.seedlessOperationMutex = new Mutex();

    this.extension.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'update') {
        if (version === '8.1.0') {
          this.platform.openExtensionInBrowser();
        }
        this.loggingController.add({
          type: LogType.GenericLog,
          data: {
            event: LOG_EVENT.VERSION_UPDATE,
            previousVersion: details.previousVersion,
            version,
          },
        });
      }
    });

    this.appMetadataController = new AppMetadataController({
      state: initState.AppMetadataController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'AppMetadataController',
        allowedActions: [],
        allowedEvents: [],
      }),
      currentMigrationVersion: this.currentMigrationVersion,
      currentAppVersion: version,
    });

    this.approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: opts.showUserConfirmation,
      typesExcludedFromRateLimiting: [
        ApprovalType.PersonalSign,
        ApprovalType.EthSignTypedData,
        ApprovalType.Transaction,
        ApprovalType.WatchAsset,
        ApprovalType.EthGetEncryptionPublicKey,
        ApprovalType.EthDecrypt,
        // Exclude Smart TX Status Page from rate limiting to allow sequential transactions
        SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
      ],
    });

    const errorReportingServiceMessenger =
      this.controllerMessenger.getRestricted({
        name: 'ErrorReportingService',
        allowedActions: [],
        allowedEvents: [],
      });
    // Initializing the ErrorReportingService populates the
    // ErrorReportingServiceMessenger.
    // eslint-disable-next-line no-new
    new ErrorReportingService({
      messenger: errorReportingServiceMessenger,
      captureException,
    });

    this.multichainSubscriptionManager = new MultichainSubscriptionManager({
      getNetworkClientById: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'NetworkController:getNetworkClientById',
      ),
      findNetworkClientIdByChainId: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'NetworkController:findNetworkClientIdByChainId',
      ),
    });
    this.multichainMiddlewareManager = new MultichainMiddlewareManager();
    this.deprecatedNetworkVersions = {};

    const accountsControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'AccountsController',
      allowedEvents: [
        'SnapController:stateChange',
        'KeyringController:accountRemoved',
        'KeyringController:stateChange',
        'SnapKeyring:accountAssetListUpdated',
        'SnapKeyring:accountBalancesUpdated',
        'SnapKeyring:accountTransactionsUpdated',
        'MultichainNetworkController:networkDidChange',
      ],
      allowedActions: [
        'KeyringController:getState',
        'KeyringController:getKeyringsByType',
      ],
    });

    this.accountsController = new AccountsController({
      messenger: accountsControllerMessenger,
      state: initState.AccountsController,
    });

    const dataDeletionService = new DataDeletionService();
    const metaMetricsDataDeletionMessenger =
      this.controllerMessenger.getRestricted({
        name: 'MetaMetricsDataDeletionController',
        allowedActions: ['MetaMetricsController:getState'],
        allowedEvents: [],
      });
    this.metaMetricsDataDeletionController =
      new MetaMetricsDataDeletionController({
        dataDeletionService,
        messenger: metaMetricsDataDeletionMessenger,
        state: initState.metaMetricsDataDeletionController,
      });

    const phishingControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'PhishingController',
    });

    this.phishingController = new PhishingController({
      messenger: phishingControllerMessenger,
      state: initState.PhishingController,
      hotlistRefreshInterval: process.env.IN_TEST ? 5 * SECOND : undefined,
      stalelistRefreshInterval: process.env.IN_TEST ? 30 * SECOND : undefined,
    });

    const announcementMessenger = this.controllerMessenger.getRestricted({
      name: 'AnnouncementController',
    });

    this.announcementController = new AnnouncementController({
      messenger: announcementMessenger,
      allAnnouncements: UI_NOTIFICATIONS,
      state: initState.AnnouncementController,
    });

    const accountOrderMessenger = this.controllerMessenger.getRestricted({
      name: 'AccountOrderController',
    });
    this.accountOrderController = new AccountOrderController({
      messenger: accountOrderMessenger,
      state: initState.AccountOrderController,
    });

    // @TODO(snaps): This fixes an issue where `withKeyring` would lock the `KeyringController` mutex.
    // That meant that if a snap requested a keyring operation (like requesting entropy) while the `KeyringController` was locked,
    // it would cause a deadlock.
    // This is a temporary fix until we can refactor how we handle requests to the Snaps Keyring.
    const withSnapKeyring = async (operation) => {
      const keyring = await this.getSnapKeyring();

      return operation({ keyring });
    };

    const multichainRouterMessenger = this.controllerMessenger.getRestricted({
      name: 'MultichainRouter',
      allowedActions: [
        'SnapController:getAll',
        'SnapController:handleRequest',
        'PermissionController:getPermissions',
        'AccountsController:listMultichainAccounts',
      ],
      allowedEvents: [],
    });

    this.multichainRouter = new MultichainRouter({
      messenger: multichainRouterMessenger,
      withSnapKeyring,
    });

    // start and stop polling for balances based on activeControllerConnections
    this.on('controllerConnectionChanged', (activeControllerConnections) => {
      const { completedOnboarding } = this.onboardingController.state;
      if (activeControllerConnections > 0 && completedOnboarding) {
        this.triggerNetworkrequests();
      } else {
        this.stopNetworkRequests();
      }
    });

    const addressBookControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'AddressBookController',
        allowedActions: [],
        allowedEvents: [],
      });

    this.addressBookController = new AddressBookController({
      messenger: addressBookControllerMessenger,
      state: initState.AddressBookController,
    });

    this.alertController = new AlertController({
      state: initState.AlertController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'AlertController',
        allowedEvents: ['AccountsController:selectedAccountChange'],
        allowedActions: ['AccountsController:getSelectedAccount'],
      }),
    });

    // This gets used as a ...spread parameter in two places: new TransactionController() and createRPCMethodTrackingMiddleware()
    this.snapAndHardwareMetricsParams = {
      getSelectedAccount: this.accountsController.getSelectedAccount.bind(
        this.accountsController,
      ),
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      getHardwareTypeForMetric: this.getHardwareTypeForMetric.bind(this),
      snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
        name: 'SnapAndHardwareMessenger',
        allowedActions: [
          'KeyringController:getKeyringForAccount',
          'SnapController:get',
          'AccountsController:getSelectedAccount',
        ],
      }),
    };

    this.decryptMessageController = new DecryptMessageController({
      getState: this.getState.bind(this),
      messenger: this.controllerMessenger.getRestricted({
        name: 'DecryptMessageController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
          'KeyringController:decryptMessage',
        ],
        allowedEvents: [
          'DecryptMessageManager:stateChange',
          'DecryptMessageManager:unapprovedMessage',
        ],
      }),
      managerMessenger: this.controllerMessenger.getRestricted({
        name: 'DecryptMessageManager',
      }),
      metricsEvent: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:trackEvent',
      ),
    });

    this.encryptionPublicKeyController = new EncryptionPublicKeyController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'EncryptionPublicKeyController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
        ],
        allowedEvents: [
          'EncryptionPublicKeyManager:stateChange',
          'EncryptionPublicKeyManager:unapprovedMessage',
        ],
      }),
      managerMessenger: this.controllerMessenger.getRestricted({
        name: 'EncryptionPublicKeyManager',
      }),
      getEncryptionPublicKey: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'KeyringController:getEncryptionPublicKey',
      ),
      getAccountKeyringType: (...args) => {
        return this.keyringController.getAccountKeyringType(...args);
      },
      getState: this.getState.bind(this),
      metricsEvent: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:trackEvent',
      ),
    });

    this.signatureController = new SignatureController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SignatureController',
        allowedActions: [
          `${this.accountsController.name}:getState`,
          `${this.approvalController.name}:addRequest`,
          'KeyringController:signMessage',
          'KeyringController:signPersonalMessage',
          'KeyringController:signTypedMessage',
          `${this.loggingController.name}:add`,
          `NetworkController:getNetworkClientById`,
          `GatorPermissionsController:decodePermissionFromPermissionContextForOrigin`,
        ],
      }),
      trace,
      decodingApiUrl: process.env.DECODING_API_URL,
      isDecodeSignatureRequestEnabled: () =>
        this.preferencesController.state.useTransactionSimulations,
    });

    this.signatureController.hub.on(
      'cancelWithReason',
      ({ metadata: message, reason }) => {
        this.controllerMessenger.call('MetaMetricsController:trackEvent', {
          event: reason,
          category: MetaMetricsEventCategory.Transactions,
          properties: {
            action: 'Sign Request',
            type: message.type,
          },
        });
      },
    );

    this.userOperationController = new UserOperationController({
      entrypoint: process.env.EIP_4337_ENTRYPOINT,
      getGasFeeEstimates: (...args) => {
        return this.gasFeeController.fetchGasFeeEstimates(...args);
      },
      messenger: this.controllerMessenger.getRestricted({
        name: 'UserOperationController',
        allowedActions: [
          'ApprovalController:addRequest',
          'NetworkController:getNetworkClientById',
          'KeyringController:prepareUserOperation',
          'KeyringController:patchUserOperation',
          'KeyringController:signUserOperation',
        ],
      }),
      state: initState.UserOperationController,
    });

    this.userOperationController.hub.on(
      'user-operation-added',
      this._onUserOperationAdded.bind(this),
    );

    this.userOperationController.hub.on(
      'transaction-updated',
      this._onUserOperationTransactionUpdated.bind(this),
    );

    // ensure AccountTrackerController updates balances after network change
    this.controllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      () => {
        this.accountTrackerController.updateAccounts();
      },
    );

    const existingControllers = [
      this.approvalController,
      this.accountsController,
    ];

    /** @type {import('./controller-init/utils').InitFunctions} */
    const controllerInitFunctions = {
      PreferencesController: PreferencesControllerInit,
      SnapKeyringBuilder: SnapKeyringBuilderInit,
      KeyringController: KeyringControllerInit,
      PermissionController: PermissionControllerInit,
      PermissionLogController: PermissionLogControllerInit,
      SubjectMetadataController: SubjectMetadataControllerInit,
      AppStateController: AppStateControllerInit,
      NetworkController: NetworkControllerInit,
      MetaMetricsController: MetaMetricsControllerInit,
      RemoteFeatureFlagController: RemoteFeatureFlagControllerInit,
      GasFeeController: GasFeeControllerInit,
      ExecutionService: ExecutionServiceInit,
      InstitutionalSnapController: InstitutionalSnapControllerInit,
      RateLimitController: RateLimitControllerInit,
      SnapsRegistry: SnapsRegistryInit,
      CronjobController: CronjobControllerInit,
      SelectedNetworkController: SelectedNetworkControllerInit,
      SnapController: SnapControllerInit,
      SnapInsightsController: SnapInsightsControllerInit,
      SnapInterfaceController: SnapInterfaceControllerInit,
      WebSocketService: WebSocketServiceInit,
      PPOMController: PPOMControllerInit,
      OnboardingController: OnboardingControllerInit,
      AccountTrackerController: AccountTrackerControllerInit,
      TransactionController: TransactionControllerInit,
      SmartTransactionsController: SmartTransactionsControllerInit,
      SwapsController: SwapsControllerInit,
      BridgeController: BridgeControllerInit,
      BridgeStatusController: BridgeStatusControllerInit,
      NftController: NftControllerInit,
      AssetsContractController: AssetsContractControllerInit,
      NftDetectionController: NftDetectionControllerInit,
      CurrencyRateController: CurrencyRateControllerInit,
      RatesController: RatesControllerInit,
      TokenListController: TokenListControllerInit,
      TokenDetectionController: TokenDetectionControllerInit,
      TokensController: TokensControllerInit,
      TokenBalancesController: TokenBalancesControllerInit,
      TokenRatesController: TokenRatesControllerInit,
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      MultichainAssetsController: MultichainAssetsControllerInit,
      MultichainAssetsRatesController: MultichainAssetsRatesControllerInit,
      MultichainBalancesController: MultichainBalancesControllerInit,
      MultichainTransactionsController: MultichainTransactionsControllerInit,
      MultichainAccountService: MultichainAccountServiceInit,
      ///: END:ONLY_INCLUDE_IF
      MultichainNetworkController: MultichainNetworkControllerInit,
      AuthenticationController: AuthenticationControllerInit,
      UserStorageController: UserStorageControllerInit,
      NotificationServicesController: NotificationServicesControllerInit,
      NotificationServicesPushController:
        NotificationServicesPushControllerInit,
      DeFiPositionsController: DeFiPositionsControllerInit,
      DelegationController: DelegationControllerInit,
      AccountTreeController: AccountTreeControllerInit,
      OAuthService: OAuthServiceInit,
      SeedlessOnboardingController: SeedlessOnboardingControllerInit,
      SubscriptionController: SubscriptionControllerInit,
      NetworkOrderController: NetworkOrderControllerInit,
      ShieldController: ShieldControllerInit,
      GatorPermissionsController: GatorPermissionsControllerInit,
      SnapsNameProvider: SnapsNameProviderInit,
      EnsController: EnsControllerInit,
      NameController: NameControllerInit,
    };

    const {
      controllerApi,
      controllerMemState,
      controllerPersistedState,
      controllersByName,
    } = this.#initControllers({
      existingControllers,
      initFunctions: controllerInitFunctions,
      initState,
    });

    this.controllerApi = controllerApi;
    this.controllerMemState = controllerMemState;
    this.controllerPersistedState = controllerPersistedState;
    this.controllersByName = controllersByName;

    // Backwards compatibility for existing references
    this.preferencesController = controllersByName.PreferencesController;
    this.keyringController = controllersByName.KeyringController;
    this.permissionController = controllersByName.PermissionController;
    this.permissionLogController = controllersByName.PermissionLogController;
    this.subjectMetadataController =
      controllersByName.SubjectMetadataController;
    this.appStateController = controllersByName.AppStateController;
    this.networkController = controllersByName.NetworkController;
    this.metaMetricsController = controllersByName.MetaMetricsController;
    this.remoteFeatureFlagController =
      controllersByName.RemoteFeatureFlagController;
    this.gasFeeController = controllersByName.GasFeeController;
    this.cronjobController = controllersByName.CronjobController;
    this.rateLimitController = controllersByName.RateLimitController;
    this.selectedNetworkController =
      controllersByName.SelectedNetworkController;
    this.snapController = controllersByName.SnapController;
    this.snapInsightsController = controllersByName.SnapInsightsController;
    this.snapInterfaceController = controllersByName.SnapInterfaceController;
    this.snapsRegistry = controllersByName.SnapsRegistry;
    this.ppomController = controllersByName.PPOMController;
    this.onboardingController = controllersByName.OnboardingController;
    this.accountTrackerController = controllersByName.AccountTrackerController;
    this.txController = controllersByName.TransactionController;
    this.smartTransactionsController =
      controllersByName.SmartTransactionsController;
    this.swapsController = controllersByName.SwapsController;
    this.bridgeController = controllersByName.BridgeController;
    this.bridgeStatusController = controllersByName.BridgeStatusController;
    this.nftController = controllersByName.NftController;
    this.nftDetectionController = controllersByName.NftDetectionController;
    this.assetsContractController = controllersByName.AssetsContractController;
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    this.multichainAssetsController =
      controllersByName.MultichainAssetsController;
    this.multichainBalancesController =
      controllersByName.MultichainBalancesController;
    this.multichainTransactionsController =
      controllersByName.MultichainTransactionsController;
    this.multichainAssetsRatesController =
      controllersByName.MultichainAssetsRatesController;
    this.multichainAccountService = controllersByName.MultichainAccountService;
    ///: END:ONLY_INCLUDE_IF
    this.tokenBalancesController = controllersByName.TokenBalancesController;
    this.tokenListController = controllersByName.TokenListController;
    this.tokenDetectionController = controllersByName.TokenDetectionController;
    this.tokensController = controllersByName.TokensController;
    this.tokenRatesController = controllersByName.TokenRatesController;
    this.currencyRateController = controllersByName.CurrencyRateController;
    this.multichainNetworkController =
      controllersByName.MultichainNetworkController;
    this.multichainRatesController = controllersByName.RatesController;
    this.authenticationController = controllersByName.AuthenticationController;
    this.userStorageController = controllersByName.UserStorageController;
    this.delegationController = controllersByName.DelegationController;
    this.notificationServicesController =
      controllersByName.NotificationServicesController;
    this.notificationServicesPushController =
      controllersByName.NotificationServicesPushController;
    this.deFiPositionsController = controllersByName.DeFiPositionsController;
    this.accountTreeController = controllersByName.AccountTreeController;
    this.oauthService = controllersByName.OAuthService;
    this.seedlessOnboardingController =
      controllersByName.SeedlessOnboardingController;
    this.subscriptionController = controllersByName.SubscriptionController;
    this.networkOrderController = controllersByName.NetworkOrderController;
    this.shieldController = controllersByName.ShieldController;
    this.gatorPermissionsController =
      controllersByName.GatorPermissionsController;
    this.ensController = controllersByName.EnsController;
    this.nameController = controllersByName.NameController;

    this.backup = new Backup({
      preferencesController: this.preferencesController,
      addressBookController: this.addressBookController,
      accountsController: this.accountsController,
      networkController: this.networkController,
      trackMetaMetricsEvent: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:trackEvent',
      ),
    });

    this.provider =
      this.networkController.getProviderAndBlockTracker().provider;
    this.blockTracker =
      this.networkController.getProviderAndBlockTracker().blockTracker;

    this.on('update', (update) => {
      this.metaMetricsController.handleMetaMaskStateUpdate(update);
    });

    this.controllerMessenger.subscribe(
      'RemoteFeatureFlagController:stateChange',
      (isRpcFailoverEnabled) => {
        if (isRpcFailoverEnabled) {
          console.log(
            'isRpcFailoverEnabled = ',
            isRpcFailoverEnabled,
            ', enabling RPC failover',
          );
          this.networkController.enableRpcFailover();
        } else {
          console.log(
            'isRpcFailoverEnabled = ',
            isRpcFailoverEnabled,
            ', disabling RPC failover',
          );
          this.networkController.disableRpcFailover();
        }
      },
      (state) => state.remoteFeatureFlags.walletFrameworkRpcFailoverEnabled,
    );

    this.controllerMessenger.subscribe('KeyringController:unlock', () =>
      this._onUnlock(),
    );

    this.controllerMessenger.subscribe('KeyringController:lock', () =>
      this._onLock(),
    );

    this.controllerMessenger.subscribe(
      'KeyringController:stateChange',
      (state) => {
        this._onKeyringControllerUpdate(state);
      },
    );

    const petnamesBridgeMessenger = this.controllerMessenger.getRestricted({
      name: 'PetnamesBridge',
      allowedEvents: [
        'NameController:stateChange',
        'AccountsController:stateChange',
        'AddressBookController:stateChange',
      ],
      allowedActions: ['AccountsController:listAccounts'],
    });

    new AddressBookPetnamesBridge({
      addressBookController: this.addressBookController,
      nameController: this.nameController,
      messenger: petnamesBridgeMessenger,
    }).init();

    new AccountIdentitiesPetnamesBridge({
      nameController: this.nameController,
      messenger: petnamesBridgeMessenger,
    }).init();

    this.getSecurityAlertsConfig = async (url) => {
      const getToken = () =>
        this.controllerMessenger.call(
          'AuthenticationController:getBearerToken',
        );
      return getShieldGatewayConfig(getToken, url);
    };

    this.notificationServicesController.init();
    this.snapController.init();
    this.cronjobController.init();

    this.controllerMessenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      ({ transactionMeta }) => {
        this._onFinishedTransaction(transactionMeta);
      },
    );

    this.controllerMessenger.subscribe(
      'NotificationServicesPushController:onNewNotifications',
      (notification) => {
        this.metaMetricsController.trackEvent({
          category: MetaMetricsEventCategory.PushNotifications,
          event: MetaMetricsEventName.PushNotificationReceived,
          properties: {
            notification_id: notification.id,
            notification_type: notification.type,
            chain_id: notification?.chain_id,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      'NotificationServicesPushController:pushNotificationClicked',
      (notification) => {
        this.metaMetricsController.trackEvent({
          category: MetaMetricsEventCategory.PushNotifications,
          event: MetaMetricsEventName.PushNotificationClicked,
          properties: {
            notification_id: notification.id,
            notification_type: notification.type,
            chain_id: notification?.chain_id,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      'AccountTreeController:selectedAccountGroupChange',
      () => {
        const solAccounts =
          this.accountTreeController.getAccountsFromSelectedAccountGroup({
            scopes: [SolScope.Mainnet],
          });

        // eslint-disable-next-line no-unused-vars
        let btcAccounts = [];
        ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
        btcAccounts =
          this.accountTreeController.getAccountsFromSelectedAccountGroup({
            scopes: [BtcScope.Mainnet],
          });
        ///: END:ONLY_INCLUDE_IF(bitcoin)

        const allEnabledNetworks = Object.values(
          this.networkOrderController.state.enabledNetworkMap,
        ).reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {});

        if (Object.keys(allEnabledNetworks).length === 1) {
          const chainId = Object.keys(allEnabledNetworks)[0];

          let shouldEnableMainetNetworks = false;
          if (chainId === SolScope.Mainnet && solAccounts.length === 0) {
            shouldEnableMainetNetworks = true;
          }
          ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
          if (chainId === BtcScope.Mainnet && btcAccounts.length === 0) {
            shouldEnableMainetNetworks = true;
          }
          ///: END:ONLY_INCLUDE_IF(bitcoin)

          if (shouldEnableMainetNetworks) {
            this.networkOrderController.setEnabledNetworksMultichain(
              ['0x1'],
              KnownCaipNamespace.Eip155,
            );
          }
        }
      },
    );

    this.controllerMessenger.subscribe(
      `OnboardingController:stateChange`,
      previousValueComparator(async (prevState, currState) => {
        const { completedOnboarding: prevCompletedOnboarding } = prevState;
        const {
          completedOnboarding: currCompletedOnboarding,
          firstTimeFlowType,
        } = currState;
        if (!prevCompletedOnboarding && currCompletedOnboarding) {
          const { address } = this.accountsController.getSelectedAccount();

          if (this.isMultichainAccountsFeatureState2Enabled()) {
            ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
            await this.getSnapKeyring();
            ///: END:ONLY_INCLUDE_IF

            await this.accountTreeController.syncWithUserStorageAtLeastOnce();
          }

          if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
            // importing multiple SRPs on social login rehydration
            await this._importAccountsWithBalances();
          } else if (this.isMultichainAccountsFeatureState2Enabled()) {
            await this.discoverAndCreateAccounts();
          } else {
            await this._addAccountsWithBalance();
          }

          this.postOnboardingInitialization();
          this.triggerNetworkrequests();

          // execute once the token detection on the post-onboarding
          await this.tokenDetectionController.detectTokens({
            selectedAddress: address,
          });
        }
      }, this.onboardingController.state),
    );

    const getAccounts = ({ origin: innerOrigin }) => {
      if (innerOrigin === ORIGIN_METAMASK) {
        const selectedAddress =
          this.accountsController.getSelectedAccount().address;
        return selectedAddress ? [selectedAddress] : [];
      }
      return this.getPermittedAccounts(innerOrigin);
    };

    this.eip5792Middleware = createScaffoldMiddleware({
      wallet_getCapabilities: createAsyncMiddleware(async (req, res) =>
        walletGetCapabilities(req, res, {
          getAccounts,
          getCapabilities: getCapabilities.bind(
            null,
            {
              getDismissSmartAccountSuggestionEnabled: () =>
                this.preferencesController.state.preferences
                  .dismissSmartAccountSuggestionEnabled,
              getIsSmartTransaction: (chainId) =>
                getIsSmartTransaction(this._getMetaMaskState(), chainId),
              isAtomicBatchSupported:
                this.txController.isAtomicBatchSupported.bind(
                  this.txController,
                ),
              isRelaySupported,
              getSendBundleSupportedChains,
            },
            this.controllerMessenger,
          ),
        }),
      ),
      wallet_sendCalls: createAsyncMiddleware(async (req, res) =>
        walletSendCalls(req, res, {
          getAccounts,
          processSendCalls: processSendCalls.bind(
            null,
            {
              addTransaction: this.txController.addTransaction.bind(
                this.txController,
              ),
              addTransactionBatch: this.txController.addTransactionBatch.bind(
                this.txController,
              ),
              getDismissSmartAccountSuggestionEnabled: () =>
                this.preferencesController.state.preferences
                  .dismissSmartAccountSuggestionEnabled,
              isAtomicBatchSupported:
                this.txController.isAtomicBatchSupported.bind(
                  this.txController,
                ),
              validateSecurity: (securityAlertId, request, chainId) =>
                validateRequestWithPPOM({
                  chainId,
                  ppomController: this.ppomController,
                  request,
                  securityAlertId,
                  updateSecurityAlertResponse:
                    this.updateSecurityAlertResponse.bind(this),
                  getSecurityAlertsConfig:
                    this.getSecurityAlertsConfig.bind(this),
                }),
            },
            this.controllerMessenger,
          ),
        }),
      ),
      wallet_getCallsStatus: createAsyncMiddleware(async (req, res) =>
        walletGetCallsStatus(req, res, {
          getCallsStatus: getCallsStatus.bind(null, this.controllerMessenger),
        }),
      ),
    });

    this.metamaskMiddleware = createMetamaskMiddleware({
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      version,
      // account mgmt
      getAccounts,
      // tx signing
      processTransaction: (transactionParams, dappRequest) =>
        addDappTransaction(
          this.getAddTransactionRequest({ transactionParams, dappRequest }),
        ),
      // msg signing

      processTypedMessage: (...args) =>
        addTypedMessage({
          signatureController: this.signatureController,
          signatureParams: args,
        }),
      processTypedMessageV3: (...args) =>
        addTypedMessage({
          signatureController: this.signatureController,
          signatureParams: args,
        }),
      processTypedMessageV4: (...args) =>
        addTypedMessage({
          signatureController: this.signatureController,
          signatureParams: args,
        }),
      processPersonalMessage: (...args) =>
        addPersonalMessage({
          signatureController: this.signatureController,
          signatureParams: args,
        }),

      processEncryptionPublicKey:
        this.encryptionPublicKeyController.newRequestEncryptionPublicKey.bind(
          this.encryptionPublicKeyController,
        ),

      processDecryptMessage:
        this.decryptMessageController.newRequestDecryptMessage.bind(
          this.decryptMessageController,
        ),
      getPendingNonce: this.getPendingNonce.bind(this),
      getPendingTransactionByHash: (hash) =>
        this.txController.state.transactions.find(
          (meta) =>
            meta.hash === hash && meta.status === TransactionStatus.submitted,
        ),
      processRequestExecutionPermissions: isGatorPermissionsFeatureEnabled()
        ? forwardRequestToSnap.bind(null, {
            snapId: process.env.PERMISSIONS_KERNEL_SNAP_ID,
            handleRequest: this.handleSnapRequest.bind(this),
          })
        : undefined,
    });

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => this._onStateUpdate(memState));

    /**
     * All controllers in Memstore but not in store. They are not persisted.
     * On chrome profile re-start, they will be re-initialized.
     */
    const resetOnRestartStore = {
      AccountTracker: this.accountTrackerController,
      TokenRatesController: this.tokenRatesController,
      DecryptMessageController: this.decryptMessageController,
      EncryptionPublicKeyController: this.encryptionPublicKeyController,
      SignatureController: this.signatureController,
      SwapsController: this.swapsController,
      BridgeController: this.bridgeController,
      BridgeStatusController: this.bridgeStatusController,
      EnsController: this.ensController,
      ApprovalController: this.approvalController,
    };

    this.store.updateStructure({
      AccountsController: this.accountsController,
      AppStateController: this.appStateController,
      AppMetadataController: this.appMetadataController,
      KeyringController: this.keyringController,
      PreferencesController: this.preferencesController,
      MetaMetricsController: this.metaMetricsController,
      MetaMetricsDataDeletionController: this.metaMetricsDataDeletionController,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      MultichainNetworkController: this.multichainNetworkController,
      NetworkController: this.networkController,
      AlertController: this.alertController,
      OnboardingController: this.onboardingController,
      SeedlessOnboardingController: this.seedlessOnboardingController,
      PermissionController: this.permissionController,
      PermissionLogController: this.permissionLogController,
      SubjectMetadataController: this.subjectMetadataController,
      AnnouncementController: this.announcementController,
      NetworkOrderController: this.networkOrderController,
      AccountOrderController: this.accountOrderController,
      GasFeeController: this.gasFeeController,
      GatorPermissionsController: this.gatorPermissionsController,
      TokenListController: this.tokenListController,
      TokensController: this.tokensController,
      TokenBalancesController: this.tokenBalancesController,
      SmartTransactionsController: this.smartTransactionsController,
      NftController: this.nftController,
      PhishingController: this.phishingController,
      SelectedNetworkController: this.selectedNetworkController,
      LoggingController: this.loggingController,
      MultichainRatesController: this.multichainRatesController,
      NameController: this.nameController,
      UserOperationController: this.userOperationController,
      // Notification Controllers
      AuthenticationController: this.authenticationController,
      UserStorageController: this.userStorageController,
      NotificationServicesController: this.notificationServicesController,
      NotificationServicesPushController:
        this.notificationServicesPushController,
      RemoteFeatureFlagController: this.remoteFeatureFlagController,
      DeFiPositionsController: this.deFiPositionsController,
      ...resetOnRestartStore,
      ...controllerPersistedState,
    });

    this.memStore = new ComposableObservableStore({
      config: {
        AccountsController: this.accountsController,
        AppStateController: this.appStateController,
        AppMetadataController: this.appMetadataController,
        ///: BEGIN:ONLY_INCLUDE_IF(multichain)
        MultichainAssetsController: this.multichainAssetsController,
        MultichainBalancesController: this.multichainBalancesController,
        MultichainTransactionsController: this.multichainTransactionsController,
        MultichainAssetsRatesController: this.multichainAssetsRatesController,
        ///: END:ONLY_INCLUDE_IF
        TokenRatesController: this.tokenRatesController,
        MultichainNetworkController: this.multichainNetworkController,
        NetworkController: this.networkController,
        KeyringController: this.keyringController,
        PreferencesController: this.preferencesController,
        MetaMetricsController: this.metaMetricsController,
        MetaMetricsDataDeletionController:
          this.metaMetricsDataDeletionController,
        AddressBookController: this.addressBookController,
        CurrencyController: this.currencyRateController,
        AlertController: this.alertController,
        OnboardingController: this.onboardingController,
        SeedlessOnboardingController: this.seedlessOnboardingController,
        SubscriptionController: this.subscriptionController,
        PermissionController: this.permissionController,
        PermissionLogController: this.permissionLogController,
        SubjectMetadataController: this.subjectMetadataController,
        AnnouncementController: this.announcementController,
        NetworkOrderController: this.networkOrderController,
        AccountOrderController: this.accountOrderController,
        GasFeeController: this.gasFeeController,
        TokenListController: this.tokenListController,
        TokensController: this.tokensController,
        TokenBalancesController: this.tokenBalancesController,
        SmartTransactionsController: this.smartTransactionsController,
        NftController: this.nftController,
        SelectedNetworkController: this.selectedNetworkController,
        LoggingController: this.loggingController,
        MultichainRatesController: this.multichainRatesController,
        SnapController: this.snapController,
        CronjobController: this.cronjobController,
        SnapsRegistry: this.snapsRegistry,
        SnapInterfaceController: this.snapInterfaceController,
        SnapInsightsController: this.snapInsightsController,
        NameController: this.nameController,
        UserOperationController: this.userOperationController,
        // Notification Controllers
        AuthenticationController: this.authenticationController,
        UserStorageController: this.userStorageController,
        NotificationServicesController: this.notificationServicesController,
        NotificationServicesPushController:
          this.notificationServicesPushController,
        RemoteFeatureFlagController: this.remoteFeatureFlagController,
        DeFiPositionsController: this.deFiPositionsController,
        PhishingController: this.phishingController,
        ShieldController: this.shieldController,
        ...resetOnRestartStore,
        ...controllerMemState,
      },
      controllerMessenger: this.controllerMessenger,
    });

    // if this is the first time, clear the state of by calling these methods
    const resetMethods = [
      this.accountTrackerController.resetState.bind(
        this.accountTrackerController,
      ),
      this.decryptMessageController.resetState.bind(
        this.decryptMessageController,
      ),
      this.encryptionPublicKeyController.resetState.bind(
        this.encryptionPublicKeyController,
      ),
      this.signatureController.resetState.bind(this.signatureController),
      this.swapsController.resetState.bind(this.swapsController),
      this.bridgeController.resetState.bind(this.bridgeController),
      this.ensController.resetState.bind(this.ensController),
      this.approvalController.clear.bind(this.approvalController),
      // WE SHOULD ADD TokenListController.resetState here too. But it's not implemented yet.
    ];

    if (isManifestV3) {
      if (isFirstMetaMaskControllerSetup === true) {
        this.resetStates(resetMethods);
        this.extension.storage.session.set({
          isFirstMetaMaskControllerSetup: false,
        });
      }
    } else {
      // it's always the first time in MV2
      this.resetStates(resetMethods);
    }

    // Automatic login via config password
    const password = process.env.PASSWORD;
    if (
      !this.isUnlocked() &&
      this.onboardingController.state.completedOnboarding &&
      password &&
      !process.env.IN_TEST
    ) {
      this._loginUser(password);
    } else {
      this._startUISync();
    }

    // Lazily update the store with the current extension environment
    this.extension.runtime.getPlatformInfo().then(({ os }) => {
      this.appStateController.setBrowserEnvironment(
        os,
        // This method is presently only supported by Firefox
        this.extension.runtime.getBrowserInfo === undefined
          ? 'chrome'
          : 'firefox',
      );
    });

    this.setupControllerEventSubscriptions();
    this.setupMultichainDataAndSubscriptions();

    // For more information about these legacy streams, see here:
    // https://github.com/MetaMask/metamask-extension/issues/15491
    // TODO:LegacyProvider: Delete
    this.publicConfigStore = this.createPublicConfigStore();

    // Multiple MetaMask instances launched warning
    this.extension.runtime.onMessageExternal.addListener(onMessageReceived);
    // Fire a ping message to check if other extensions are running
    checkForMultipleVersionsRunning();

    if (this.onboardingController.state.completedOnboarding) {
      this.postOnboardingInitialization();
    }
  }

  // Provides a method for getting feature flags for the multichain
  // initial rollout, such that we can remotely modify polling interval
  getInfuraFeatureFlags() {
    fetchWithCache({
      url: 'https://bridge.api.cx.metamask.io/featureFlags',
      cacheRefreshTime: MINUTE * 20,
    })
      .then(this.onFeatureFlagResponseReceived)
      .catch((e) => {
        // API unreachable (?)
        log.warn('Feature flag endpoint is unreachable', e);
      });
  }

  onFeatureFlagResponseReceived(response) {
    const { multiChainAssets = {} } = response;
    const { pollInterval } = multiChainAssets;
    // Polling interval is provided in seconds
    if (pollInterval > 0) {
      this.tokenBalancesController.setIntervalLength(pollInterval * SECOND);
    }
  }

  isMultichainAccountsFeatureState2Enabled() {
    const featureFlag =
      this.remoteFeatureFlagController?.state?.remoteFeatureFlags
        ?.enableMultichainAccountsState2;
    return isMultichainAccountsFeatureEnabled(featureFlag, FEATURE_VERSION_2);
  }

  postOnboardingInitialization() {
    const { usePhishDetect } = this.preferencesController.state;

    this.networkController.lookupNetwork();

    if (usePhishDetect) {
      this.phishingController.maybeUpdateState();
    }
  }

  triggerNetworkrequests() {
    this.tokenDetectionController.enable();
    this.getInfuraFeatureFlags();
    if (
      !isEvmAccountType(
        this.accountsController.getSelectedMultichainAccount().type,
      )
    ) {
      this.multichainRatesController.start();
    }
  }

  stopNetworkRequests() {
    this.txController.stopIncomingTransactionPolling();
    this.tokenDetectionController.disable();
    this.multichainRatesController.stop();
  }

  resetStates(resetMethods) {
    resetMethods.forEach((resetMethod) => {
      try {
        resetMethod();
      } catch (err) {
        console.error(err);
      }
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  /**
   * Initialize the snap keyring if it is not present.
   *
   * @returns {SnapKeyring}
   */
  async getSnapKeyring() {
    // TODO: Use `withKeyring` instead
    let [snapKeyring] = this.keyringController.getKeyringsByType(
      KeyringType.snap,
    );
    if (!snapKeyring) {
      await this.keyringController.addNewKeyring(KeyringType.snap);
      // TODO: Use `withKeyring` instead
      [snapKeyring] = this.keyringController.getKeyringsByType(
        KeyringType.snap,
      );
    }
    return snapKeyring;
  }
  ///: END:ONLY_INCLUDE_IF

  trackInsightSnapView(snapId) {
    this.metaMetricsController.trackEvent({
      event: MetaMetricsEventName.InsightSnapViewed,
      category: MetaMetricsEventCategory.Snaps,
      properties: {
        snap_id: snapId,
      },
    });
  }

  /**
   * Get snap metadata from the current state without refreshing the registry database.
   *
   * @param {string} snapId - A snap id.
   * @returns The available metadata for the snap, if any.
   */
  _getSnapMetadata(snapId) {
    return this.snapsRegistry.state.database?.verifiedSnaps?.[snapId]?.metadata;
  }

  /**
   * Passes a JSON-RPC request object to the SnapController for execution.
   *
   * @param {object} args - A bag of options.
   * @param {string} args.snapId - The ID of the recipient snap.
   * @param {string} args.origin - The origin of the RPC request.
   * @param {string} args.handler - The handler to trigger on the snap for the request.
   * @param {object} args.request - The JSON-RPC request object.
   * @returns The result of the JSON-RPC request.
   */
  async handleSnapRequest(args) {
    return await this.controllerMessenger.call(
      'SnapController:handleRequest',
      args,
    );
  }

  /**
   * Sets up BaseController V2 event subscriptions. Currently, this includes
   * the subscriptions necessary to notify permission subjects of account
   * changes.
   *
   * Some of the subscriptions in this method are Messenger selector
   * event subscriptions. See the relevant documentation for
   * `@metamask/base-controller` for more information.
   *
   * Note that account-related notifications emitted when the extension
   * becomes unlocked are handled in MetaMaskController._onUnlock.
   */
  setupControllerEventSubscriptions() {
    let lastSelectedAddress;
    let lastSelectedSolanaAccountAddress;

    // this throws if there is no solana account... perhaps we should handle this better at the controller level
    try {
      lastSelectedSolanaAccountAddress =
        this.accountsController.getSelectedMultichainAccount(
          MultichainNetworks.SOLANA,
        )?.address;
    } catch {
      // noop
    }

    this.controllerMessenger.subscribe(
      'PreferencesController:stateChange',
      previousValueComparator(async (_, currState) => {
        const { currentLocale } = currState;

        await updateCurrentLocale(currentLocale);
      }, this.preferencesController.state),
    );

    this.controllerMessenger.subscribe(
      `${this.accountsController.name}:selectedAccountChange`,
      async (account) => {
        if (account.address && account.address !== lastSelectedAddress) {
          lastSelectedAddress = account.address;
          await this._onAccountChange(account.address);
        }
      },
    );

    // This handles account changes every time relevant permission state
    // changes, for any reason.
    this.controllerMessenger.subscribe(
      `${this.permissionController.name}:stateChange`,
      async (currentValue, previousValue) => {
        const changedAccounts = diffMap(currentValue, previousValue);

        for (const [origin, accounts] of changedAccounts.entries()) {
          this._notifyAccountsChange(origin, accounts);
        }
      },
      getPermittedAccountsByOrigin,
    );

    // This handles CAIP-25 authorization changes every time relevant permission state
    // changes, for any reason.
    // wallet_sessionChanged and eth_subscription setup/teardown
    this.controllerMessenger.subscribe(
      `${this.permissionController.name}:stateChange`,
      async (currentValue, previousValue) => {
        const changedAuthorizations = getChangedAuthorizations(
          currentValue,
          previousValue,
        );

        const removedAuthorizations = getRemovedAuthorizations(
          currentValue,
          previousValue,
        );

        // remove any existing notification subscriptions for removed authorizations
        for (const [origin, authorization] of removedAuthorizations.entries()) {
          const sessionScopes = getSessionScopes(authorization, {
            getNonEvmSupportedMethods:
              this.getNonEvmSupportedMethods.bind(this),
          });
          // if the eth_subscription notification is in the scope and eth_subscribe is in the methods
          // then remove middleware and unsubscribe
          Object.entries(sessionScopes).forEach(([scope, scopeObject]) => {
            if (
              scopeObject.notifications.includes('eth_subscription') &&
              scopeObject.methods.includes('eth_subscribe')
            ) {
              this.removeMultichainApiEthSubscriptionMiddleware({
                scope,
                origin,
              });
            }
          });
        }

        // add new notification subscriptions for added/changed authorizations
        for (const [origin, authorization] of changedAuthorizations.entries()) {
          const sessionScopes = getSessionScopes(authorization, {
            getNonEvmSupportedMethods:
              this.getNonEvmSupportedMethods.bind(this),
          });

          // if the eth_subscription notification is in the scope and eth_subscribe is in the methods
          // then get the subscriptionManager going for that scope
          Object.entries(sessionScopes).forEach(([scope, scopeObject]) => {
            if (
              scopeObject.notifications.includes('eth_subscription') &&
              scopeObject.methods.includes('eth_subscribe')
            ) {
              // for each tabId
              Object.values(this.connections[origin] ?? {}).forEach(
                ({ tabId }) => {
                  this.addMultichainApiEthSubscriptionMiddleware({
                    scope,
                    origin,
                    tabId,
                  });
                },
              );
            } else {
              this.removeMultichainApiEthSubscriptionMiddleware({
                scope,
                origin,
              });
            }
          });
          this._notifyAuthorizationChange(origin, authorization);
        }
      },
      getAuthorizedScopesByOrigin,
    );

    // wallet_notify for solana accountChanged when permission changes
    this.controllerMessenger.subscribe(
      `${this.permissionController.name}:stateChange`,
      async (currentValue, previousValue) => {
        const origins = uniq([...previousValue.keys(), ...currentValue.keys()]);
        origins.forEach((origin) => {
          const previousCaveatValue = previousValue.get(origin);
          const currentCaveatValue = currentValue.get(origin);

          const previousSolanaAccountChangedNotificationsEnabled = Boolean(
            previousCaveatValue?.sessionProperties?.[
              KnownSessionProperties.SolanaAccountChangedNotifications
            ],
          );
          const currentSolanaAccountChangedNotificationsEnabled = Boolean(
            currentCaveatValue?.sessionProperties?.[
              KnownSessionProperties.SolanaAccountChangedNotifications
            ],
          );

          if (
            !previousSolanaAccountChangedNotificationsEnabled &&
            !currentSolanaAccountChangedNotificationsEnabled
          ) {
            return;
          }

          const previousSolanaCaipAccountIds = previousCaveatValue
            ? getPermittedAccountsForScopes(previousCaveatValue, [
                MultichainNetworks.SOLANA,
                MultichainNetworks.SOLANA_DEVNET,
                MultichainNetworks.SOLANA_TESTNET,
              ])
            : [];
          const previousNonUniqueSolanaHexAccountAddresses =
            previousSolanaCaipAccountIds.map((caipAccountId) => {
              const { address } = parseCaipAccountId(caipAccountId);
              return address;
            });
          const previousSolanaHexAccountAddresses = uniq(
            previousNonUniqueSolanaHexAccountAddresses,
          );
          const [previousSelectedSolanaAccountAddress] =
            this.sortMultichainAccountsByLastSelected(
              previousSolanaHexAccountAddresses,
            );

          const currentSolanaCaipAccountIds = currentCaveatValue
            ? getPermittedAccountsForScopes(currentCaveatValue, [
                MultichainNetworks.SOLANA,
                MultichainNetworks.SOLANA_DEVNET,
                MultichainNetworks.SOLANA_TESTNET,
              ])
            : [];
          const currentNonUniqueSolanaHexAccountAddresses =
            currentSolanaCaipAccountIds.map((caipAccountId) => {
              const { address } = parseCaipAccountId(caipAccountId);
              return address;
            });
          const currentSolanaHexAccountAddresses = uniq(
            currentNonUniqueSolanaHexAccountAddresses,
          );
          const [currentSelectedSolanaAccountAddress] =
            this.sortMultichainAccountsByLastSelected(
              currentSolanaHexAccountAddresses,
            );

          if (
            previousSelectedSolanaAccountAddress !==
            currentSelectedSolanaAccountAddress
          ) {
            this._notifySolanaAccountChange(
              origin,
              currentSelectedSolanaAccountAddress
                ? [currentSelectedSolanaAccountAddress]
                : [],
            );
          }
        });
      },
      getAuthorizedScopesByOrigin,
    );

    // TODO: To be removed when state 2 is fully transitioned.
    // wallet_notify for solana accountChanged when selected account changes
    this.controllerMessenger.subscribe(
      `${this.accountsController.name}:selectedAccountChange`,
      async (account) => {
        if (
          account.type === SolAccountType.DataAccount &&
          account.address !== lastSelectedSolanaAccountAddress
        ) {
          lastSelectedSolanaAccountAddress = account.address;

          const originsWithSolanaAccountChangedNotifications =
            getOriginsWithSessionProperty(
              this.permissionController.state,
              KnownSessionProperties.SolanaAccountChangedNotifications,
            );

          // returns a map of origins to permitted solana accounts
          const solanaAccounts = getPermittedAccountsForScopesByOrigin(
            this.permissionController.state,
            [
              MultichainNetworks.SOLANA,
              MultichainNetworks.SOLANA_DEVNET,
              MultichainNetworks.SOLANA_TESTNET,
            ],
          );

          if (solanaAccounts.size > 0) {
            for (const [origin, accounts] of solanaAccounts.entries()) {
              const parsedSolanaAddresses = accounts.map((caipAccountId) => {
                const { address } = parseCaipAccountId(caipAccountId);
                return address;
              });

              if (
                parsedSolanaAddresses.includes(account.address) &&
                originsWithSolanaAccountChangedNotifications[origin]
              ) {
                this._notifySolanaAccountChange(origin, [account.address]);
              }
            }
          }
        }
      },
    );

    // wallet_notify for solana accountChanged when selected account group changes
    this.controllerMessenger.subscribe(
      `${this.accountTreeController.name}:selectedAccountGroupChange`,
      () => {
        const [account] =
          this.accountTreeController.getAccountsFromSelectedAccountGroup({
            scopes: [SolScope.Mainnet],
          });
        if (
          account &&
          account.type === SolAccountType.DataAccount &&
          account.address !== lastSelectedSolanaAccountAddress
        ) {
          lastSelectedSolanaAccountAddress = account.address;

          const originsWithSolanaAccountChangedNotifications =
            getOriginsWithSessionProperty(
              this.permissionController.state,
              KnownSessionProperties.SolanaAccountChangedNotifications,
            );

          // returns a map of origins to permitted solana accounts
          const solanaAccounts = getPermittedAccountsForScopesByOrigin(
            this.permissionController.state,
            [
              MultichainNetworks.SOLANA,
              MultichainNetworks.SOLANA_DEVNET,
              MultichainNetworks.SOLANA_TESTNET,
            ],
          );

          if (solanaAccounts.size > 0) {
            for (const [origin, accounts] of solanaAccounts.entries()) {
              const parsedSolanaAddresses = accounts.map((caipAccountId) => {
                const { address } = parseCaipAccountId(caipAccountId);
                return address;
              });

              if (
                parsedSolanaAddresses.includes(account.address) &&
                originsWithSolanaAccountChangedNotifications[origin]
              ) {
                this._notifySolanaAccountChange(origin, [account.address]);
              }
            }
          }
        }
      },
    );

    this.controllerMessenger.subscribe(
      `${this.permissionController.name}:stateChange`,
      async (currentValue, previousValue) => {
        const changedChains = diffMap(currentValue, previousValue);

        // This operates under the assumption that there will be at maximum
        // one origin permittedChains value change per event handler call
        for (const [origin, chains] of changedChains.entries()) {
          const currentNetworkClientIdForOrigin =
            this.selectedNetworkController.getNetworkClientIdForDomain(origin);

          const networkConfig =
            this.networkController.getNetworkConfigurationByNetworkClientId(
              currentNetworkClientIdForOrigin,
            );

          // Guard clause: skip this iteration or handle the case if networkConfig is undefined.
          if (!networkConfig) {
            log.warn(
              `No network configuration found for clientId: ${currentNetworkClientIdForOrigin}`,
            );
            continue;
          }

          const { chainId: currentChainIdForOrigin } = networkConfig;

          if (chains.length > 0 && !chains.includes(currentChainIdForOrigin)) {
            const networkClientId =
              this.networkController.findNetworkClientIdByChainId(chains[0]);
            // setActiveNetwork should be called before setNetworkClientIdForDomain
            // to ensure that the isConnected value can be accurately inferred from
            // NetworkController.state.networksMetadata in return value of
            // `metamask_getProviderState` requests and `metamask_chainChanged` events.
            this.networkController.setActiveNetwork(networkClientId);
            this.selectedNetworkController.setNetworkClientIdForDomain(
              origin,
              networkClientId,
            );
          }
        }
      },
      getPermittedChainsByOrigin,
    );

    this.controllerMessenger.subscribe(
      'NetworkController:networkRemoved',
      ({ chainId }) => {
        const scopeString = toCaipChainId(
          'eip155',
          hexToBigInt(chainId).toString(10),
        );
        this.removeAllScopePermissions(scopeString);
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapInstallStarted`,
      (snapId, origin, isUpdate) => {
        const snapCategory = this._getSnapMetadata(snapId)?.category;
        this.metaMetricsController.trackEvent({
          event: isUpdate
            ? MetaMetricsEventName.SnapUpdateStarted
            : MetaMetricsEventName.SnapInstallStarted,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: snapId,
            origin,
            snap_category: snapCategory,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapInstallFailed`,
      (snapId, origin, isUpdate, error) => {
        const isRejected = error.includes('User rejected the request.');
        const failedEvent = isUpdate
          ? MetaMetricsEventName.SnapUpdateFailed
          : MetaMetricsEventName.SnapInstallFailed;
        const rejectedEvent = isUpdate
          ? MetaMetricsEventName.SnapUpdateRejected
          : MetaMetricsEventName.SnapInstallRejected;

        const snapCategory = this._getSnapMetadata(snapId)?.category;
        this.metaMetricsController.trackEvent({
          event: isRejected ? rejectedEvent : failedEvent,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: snapId,
            origin,
            snap_category: snapCategory,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapInstalled`,
      (truncatedSnap, origin, preinstalled) => {
        if (preinstalled) {
          return;
        }

        const snapId = truncatedSnap.id;
        const snapCategory = this._getSnapMetadata(snapId)?.category;
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapInstalled,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: snapId,
            version: truncatedSnap.version,
            origin,
            snap_category: snapCategory,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapUpdated`,
      (newSnap, oldVersion, origin, preinstalled) => {
        if (preinstalled) {
          return;
        }

        const snapId = newSnap.id;
        const snapCategory = this._getSnapMetadata(snapId)?.category;
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapUpdated,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: snapId,
            old_version: oldVersion,
            new_version: newSnap.version,
            origin,
            snap_category: snapCategory,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapTerminated`,
      (truncatedSnap) => {
        const approvals = Object.values(
          this.approvalController.state.pendingApprovals,
        ).filter(
          (approval) =>
            approval.origin === truncatedSnap.id &&
            approval.type.startsWith(RestrictedMethods.snap_dialog),
        );
        for (const approval of approvals) {
          this.approvalController.reject(
            approval.id,
            new Error('Snap was terminated.'),
          );
        }
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapUninstalled`,
      (truncatedSnap) => {
        const notificationIds = this.notificationServicesController
          .getNotificationsByType(TRIGGER_TYPES.SNAP)
          .filter(
            (notification) => notification.data.origin === truncatedSnap.id,
          )
          .map((notification) => notification.id);

        this.notificationServicesController.deleteNotificationsById(
          notificationIds,
        );

        const snapId = truncatedSnap.id;
        const snapCategory = this._getSnapMetadata(snapId)?.category;
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapUninstalled,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: snapId,
            version: truncatedSnap.version,
            snap_category: snapCategory,
          },
        });
      },
    );
  }

  /**
   * Sets up multichain data and subscriptions.
   * This method is called during the MetaMaskController constructor.
   * It starts the MultichainRatesController if selected account is non-EVM
   * and subscribes to account changes.
   */
  setupMultichainDataAndSubscriptions() {
    this.controllerMessenger.subscribe(
      'AccountsController:selectedAccountChange',
      (selectedAccount) => {
        if (
          this.activeControllerConnections === 0 ||
          isEvmAccountType(selectedAccount.type)
        ) {
          this.multichainRatesController.stop();
          return;
        }
        this.multichainRatesController.start();
      },
    );

    this.controllerMessenger.subscribe(
      'CurrencyRateController:stateChange',
      ({ currentCurrency }) => {
        if (
          currentCurrency !== this.multichainRatesController.state.fiatCurrency
        ) {
          this.multichainRatesController.setFiatCurrency(currentCurrency);
        }
      },
    );
  }

  /**
   * If it does not already exist, creates and inserts middleware to handle eth
   * subscriptions for a particular evm scope on a specific Multichain API
   * JSON-RPC pipeline by origin and tabId.
   *
   * @param {object} options - The options object.
   * @param {string} options.scope - The evm scope to handle eth susbcriptions for.
   * @param {string} options.origin - The origin to handle eth subscriptions for.
   * @param {string} options.tabId - The tabId to handle eth subscriptions for.
   */
  addMultichainApiEthSubscriptionMiddleware({ scope, origin, tabId }) {
    const subscriptionManager = this.multichainSubscriptionManager.subscribe({
      scope,
      origin,
      tabId,
    });
    this.multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: subscriptionManager.middleware,
    });
  }

  /**
   * If it does exist, removes all middleware that were handling eth
   * subscriptions for a particular evm scope for all Multichain API
   * JSON-RPC pipelines for an origin.
   *
   * @param {object} options - The options object.
   * @param {string} options.scope - The evm scope to handle eth susbcriptions for.
   * @param {string} options.origin - The origin to handle eth subscriptions for.
   */

  removeMultichainApiEthSubscriptionMiddleware({ scope, origin }) {
    this.multichainMiddlewareManager.removeMiddlewareByScopeAndOrigin(
      scope,
      origin,
    );
    this.multichainSubscriptionManager.unsubscribeByScopeAndOrigin(
      scope,
      origin,
    );
  }

  /**
   * TODO:LegacyProvider: Delete
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  createPublicConfigStore() {
    // subset of state for metamask inpage provider
    const publicConfigStore = new ObservableStore();

    const selectPublicState = async ({ isUnlocked }) => {
      const { chainId, networkVersion, isConnected } =
        await this.getProviderNetworkState();

      return {
        isUnlocked,
        chainId,
        networkVersion: isConnected ? networkVersion : 'loading',
      };
    };

    const updatePublicConfigStore = async (memState) => {
      const networkStatus =
        memState.networksMetadata[memState.selectedNetworkClientId]?.status;
      if (networkStatus === NetworkStatus.Available) {
        publicConfigStore.putState(await selectPublicState(memState));
      }
    };

    // setup memStore subscription hooks
    this.on('update', updatePublicConfigStore);
    // Update the store asynchronously, out-of-band
    updatePublicConfigStore(this.getState());

    return publicConfigStore;
  }

  async startSubscriptionWithCard(
    params,
    /* current tab can be undefined if open from non tab context (e.g. popup, background) */
    currentTabId,
  ) {
    const identityAPI = getIdentityAPI();
    const redirectUrl = identityAPI.getRedirectURL();

    const { checkoutSessionUrl } =
      await this.subscriptionController.startShieldSubscriptionWithCard({
        ...params,
        successUrl: redirectUrl,
      });

    const checkoutTab = await this.platform.openTab({
      url: checkoutSessionUrl,
    });

    // --- We will define our listeners here so we can reference them for cleanup ---
    // eslint-disable-next-line prefer-const
    let onTabUpdatedListener;
    // eslint-disable-next-line prefer-const
    let onTabRemovedListener;

    await new Promise((resolve, reject) => {
      let checkoutSucceeded = false;
      const cleanupListeners = () => {
        // Important: Remove both listeners to prevent memory leaks
        if (onTabUpdatedListener) {
          this.platform.removeTabUpdatedListener(onTabUpdatedListener);
        }
        if (onTabRemovedListener) {
          this.platform.removeTabRemovedListener(onTabRemovedListener);
        }
      };

      // Set up a listener to watch for navigation on that specific tab
      onTabUpdatedListener = (tabId, changeInfo, _tab) => {
        // We only care about updates to our specific checkout tab
        if (tabId === checkoutTab.id && changeInfo.url) {
          if (changeInfo.url.startsWith(redirectUrl)) {
            // Payment was successful!
            checkoutSucceeded = true;

            // Clean up: close the tab
            this.platform.closeTab(tabId);
          }
          // TODO: handle cancel url ?
        }
      };
      this.platform.addTabUpdatedListener(onTabUpdatedListener);

      // Set up a listener to watch for tab removal
      onTabRemovedListener = (tabId) => {
        if (tabId === checkoutTab.id) {
          cleanupListeners();
          if (checkoutSucceeded) {
            resolve();
          } else {
            reject(new Error('Checkout failed'));
          }
        }
      };
      this.platform.addTabRemovedListener(onTabRemovedListener);
    });

    if (!currentTabId) {
      // open extension browser shield settings if open from pop up (no current tab)
      this.platform.openExtensionInBrowser('/settings/transaction-shield');
    }

    // fetch latest user subscriptions after checkout
    const subscriptions = await this.subscriptionController.getSubscriptions();
    return subscriptions;
  }

  /**
   * Gets relevant state for the provider of an external origin.
   *
   * @param {string} origin - The origin to get the provider state for.
   * @param {object} [options] - Options.
   * @param {boolean} [options.isInitializingStreamProvider] - Whether this method is being used to initialize the StreamProvider (default: false).
   * @returns {Promise<{ isUnlocked: boolean, networkVersion: string, chainId: string, accounts: string[], extensionId: string | undefined }>} An object with relevant state properties.
   */
  async getProviderState(
    origin,
    { isInitializingStreamProvider = false } = {},
  ) {
    const providerNetworkState = await this.getProviderNetworkState({
      origin,
      isInitializingStreamProvider,
    });
    const metadata = {};
    if (isManifestV3) {
      const { chrome } = globalThis;
      metadata.extensionId = chrome?.runtime?.id;
    }
    return {
      /**
       * We default `isUnlocked` to `true` because even though we no longer emit events depending on this,
       * embedded dapp providers might listen directly to our streams, and therefore depend on it, so we leave it here.
       */
      isUnlocked: true,
      accounts: this.getPermittedAccounts(origin),
      ...metadata,
      ...providerNetworkState,
    };
  }

  /**
   * Retrieves network state information relevant for external providers.
   *
   * @param {object} [args] - The arguments to this function.
   * @param {string} [args.origin] - The origin identifier for which network state is requested (default: 'metamask').
   * @param {boolean} [args.isInitializingStreamProvider] - Whether this method is being used to initialize the StreamProvider (default: false).
   * @returns {object} An object containing important network state properties, including chainId and networkVersion.
   */
  async getProviderNetworkState({
    origin = METAMASK_DOMAIN,
    isInitializingStreamProvider = false,
  } = {}) {
    const networkClientId = this.controllerMessenger.call(
      'SelectedNetworkController:getNetworkClientIdForDomain',
      origin,
    );

    const networkClient = this.controllerMessenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    const { chainId } = networkClient.configuration;

    const { completedOnboarding } = this.onboardingController.state;

    let networkVersion = this.deprecatedNetworkVersions[networkClientId];
    // We use `metamask_getProviderState` to set the initial state of the
    // StreamProvider. The StreamProvider allows the UI to make network requests
    // through the background connection, and it must be initialized before we
    // can show the UI. However, this creates a problem if the selected network
    // is slow or unresponsive, because then the network request will hang and
    // thus we will be unable to show the UI. To get around this, we prevent a
    // request from occurring during initialization
    // (`isInitializingStreamProvider` = true). `metamask_getProviderState` is
    // called each time the memState is updated, so eventually we _will_ make
    // this request (`isInitializingStreamProvider` = false), and if the network
    // recovers, the network version will be properly retrieved at that time.
    if (
      networkVersion === undefined &&
      completedOnboarding &&
      !isInitializingStreamProvider
    ) {
      try {
        const result = await networkClient.provider.request({
          method: 'net_version',
        });
        networkVersion = convertNetworkId(result);
      } catch (error) {
        console.error(error);
        networkVersion = null;
      }

      this.deprecatedNetworkVersions[networkClientId] = networkVersion;
    }

    const metadata =
      this.networkController.state.networksMetadata[networkClientId];

    return {
      chainId,
      networkVersion: networkVersion ?? 'loading',
      isConnected: metadata?.status === NetworkStatus.Available,
    };
  }

  //=============================================================================
  // EXPOSED TO THE UI SUBSYSTEM
  //=============================================================================

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * @returns {MetaMaskReduxState["metamask"]} status
   */
  getState() {
    const { vault } = this.keyringController.state;
    const isInitialized = Boolean(vault);
    const flatState = this.memStore.getFlatState();

    return {
      isInitialized,
      ...sanitizeUIState(flatState),
    };
  }

  /**
   * Returns an Object containing API Callback Functions.
   * These functions are the interface for the UI.
   * The API object can be transmitted over a stream via JSON-RPC.
   *
   * @returns {object} Object containing API functions.
   */
  getApi() {
    const {
      accountsController,
      addressBookController,
      alertController,
      appStateController,
      nftController,
      nftDetectionController,
      currencyRateController,
      tokenBalancesController,
      tokenDetectionController,
      ensController,
      tokenListController,
      gasFeeController,
      gatorPermissionsController,
      metaMetricsController,
      networkController,
      multichainNetworkController,
      announcementController,
      onboardingController,
      permissionController,
      preferencesController,
      tokensController,
      smartTransactionsController,
      txController,
      backup,
      approvalController,
      phishingController,
      tokenRatesController,
      accountTrackerController,
      // Notification Controllers
      authenticationController,
      userStorageController,
      notificationServicesController,
      notificationServicesPushController,
      deFiPositionsController,
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      multichainAssetsRatesController,
      ///: END:ONLY_INCLUDE_IF
    } = this;

    return {
      // etc
      getState: this.getState.bind(this),
      setCurrentCurrency: currencyRateController.setCurrentCurrency.bind(
        currencyRateController,
      ),
      // @deprecated Use setAvatarType instead
      setUseBlockie: preferencesController.setUseBlockie.bind(
        preferencesController,
      ),
      setAvatarType: (avatarType) =>
        preferencesController.setPreference('avatarType', avatarType),
      setUsePhishDetect: preferencesController.setUsePhishDetect.bind(
        preferencesController,
      ),
      setUseMultiAccountBalanceChecker:
        preferencesController.setUseMultiAccountBalanceChecker.bind(
          preferencesController,
        ),
      setUseSafeChainsListValidation:
        preferencesController.setUseSafeChainsListValidation.bind(
          preferencesController,
        ),
      setUseTokenDetection: preferencesController.setUseTokenDetection.bind(
        preferencesController,
      ),
      setUseNftDetection: preferencesController.setUseNftDetection.bind(
        preferencesController,
      ),
      setUse4ByteResolution: preferencesController.setUse4ByteResolution.bind(
        preferencesController,
      ),
      setUseCurrencyRateCheck:
        preferencesController.setUseCurrencyRateCheck.bind(
          preferencesController,
        ),
      setOpenSeaEnabled: preferencesController.setOpenSeaEnabled.bind(
        preferencesController,
      ),
      getProviderConfig: () =>
        getProviderConfig({
          metamask: this.networkController.state,
        }),
      grantPermissionsIncremental:
        this.permissionController.grantPermissionsIncremental.bind(
          this.permissionController,
        ),
      grantPermissions: this.permissionController.grantPermissions.bind(
        this.permissionController,
      ),
      setSecurityAlertsEnabled:
        preferencesController.setSecurityAlertsEnabled.bind(
          preferencesController,
        ),
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      setAddSnapAccountEnabled:
        preferencesController.setAddSnapAccountEnabled.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      setWatchEthereumAccountEnabled:
        preferencesController.setWatchEthereumAccountEnabled.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF
      setUseExternalNameSources:
        preferencesController.setUseExternalNameSources.bind(
          preferencesController,
        ),
      setUseTransactionSimulations:
        preferencesController.setUseTransactionSimulations.bind(
          preferencesController,
        ),
      setIpfsGateway: preferencesController.setIpfsGateway.bind(
        preferencesController,
      ),
      setIsIpfsGatewayEnabled:
        preferencesController.setIsIpfsGatewayEnabled.bind(
          preferencesController,
        ),
      setUseAddressBarEnsResolution:
        preferencesController.setUseAddressBarEnsResolution.bind(
          preferencesController,
        ),
      setParticipateInMetaMetrics:
        metaMetricsController.setParticipateInMetaMetrics.bind(
          metaMetricsController,
        ),
      setDataCollectionForMarketing:
        metaMetricsController.setDataCollectionForMarketing.bind(
          metaMetricsController,
        ),
      setMarketingCampaignCookieId:
        metaMetricsController.setMarketingCampaignCookieId.bind(
          metaMetricsController,
        ),
      setCurrentLocale: preferencesController.setCurrentLocale.bind(
        preferencesController,
      ),
      setServiceWorkerKeepAlivePreference:
        preferencesController.setServiceWorkerKeepAlivePreference.bind(
          preferencesController,
        ),
      markPasswordForgotten: this.markPasswordForgotten.bind(this),
      unMarkPasswordForgotten: this.unMarkPasswordForgotten.bind(this),
      getRequestAccountTabIds: this.getRequestAccountTabIds,
      getOpenMetamaskTabsIds: this.getOpenMetamaskTabsIds,
      markNotificationPopupAsAutomaticallyClosed: () =>
        this.notificationManager.markAsAutomaticallyClosed(),
      getCode: this.getCode.bind(this),

      // primary keyring management
      addNewAccount: this.addNewAccount.bind(this),
      getSeedPhrase: this.getSeedPhrase.bind(this),
      resetAccount: this.resetAccount.bind(this),
      removeAccount: this.removeAccount.bind(this),
      importAccountWithStrategy: this.importAccountWithStrategy.bind(this),
      getNextAvailableAccountName:
        accountsController.getNextAvailableAccountName.bind(accountsController),
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      getAccountsBySnapId: (snapId) =>
        getAccountsBySnapId(this.getSnapKeyring.bind(this), snapId),
      ///: END:ONLY_INCLUDE_IF
      checkIsSeedlessPasswordOutdated:
        this.checkIsSeedlessPasswordOutdated.bind(this),
      syncPasswordAndUnlockWallet: this.syncPasswordAndUnlockWallet.bind(this),

      // subscription
      getSubscriptions: this.subscriptionController.getSubscriptions.bind(
        this.subscriptionController,
      ),
      getSubscriptionPricing: this.subscriptionController.getPricing.bind(
        this.subscriptionController,
      ),
      getSubscriptionCryptoApprovalAmount:
        this.subscriptionController.getCryptoApproveTransactionParams.bind(
          this.subscriptionController,
        ),
      cancelSubscription: this.subscriptionController.cancelSubscription.bind(
        this.subscriptionController,
      ),
      unCancelSubscription:
        this.subscriptionController.unCancelSubscription.bind(
          this.subscriptionController,
        ),
      getSubscriptionBillingPortalUrl:
        this.subscriptionController.getBillingPortalUrl.bind(
          this.subscriptionController,
        ),
      startSubscriptionWithCard: this.startSubscriptionWithCard.bind(this),

      // hardware wallets
      connectHardware: this.connectHardware.bind(this),
      forgetDevice: this.forgetDevice.bind(this),
      checkHardwareStatus: this.checkHardwareStatus.bind(this),
      unlockHardwareWalletAccount: this.unlockHardwareWalletAccount.bind(this),
      attemptLedgerTransportCreation:
        this.attemptLedgerTransportCreation.bind(this),

      // qr hardware devices
      completeQrCodeScan:
        appStateController.completeQrCodeScan.bind(appStateController),
      cancelQrCodeScan:
        appStateController.cancelQrCodeScan.bind(appStateController),

      // vault management
      submitPassword: this.submitPassword.bind(this),
      verifyPassword: this.verifyPassword.bind(this),

      // network management
      setActiveNetwork: async (id) => {
        // The multichain network controller will proxy the call to the network controller
        // in the case that the ID is an EVM network client ID.
        return await this.multichainNetworkController.setActiveNetwork(id);
      },
      findNetworkClientIdByChainId:
        this.networkController.findNetworkClientIdByChainId.bind(
          this.networkController,
        ),

      // active networks by accounts
      getNetworksWithTransactionActivityByAccounts:
        this.multichainNetworkController.getNetworksWithTransactionActivityByAccounts.bind(
          this.multichainNetworkController,
        ),
      // Avoids returning the promise so that initial call to switch network
      // doesn't block on the network lookup step
      setActiveNetworkConfigurationId: (networkConfigurationId) => {
        this.networkController.setActiveNetwork(networkConfigurationId);
      },
      setNetworkClientIdForDomain: (origin, networkClientId) => {
        return this.selectedNetworkController.setNetworkClientIdForDomain(
          origin,
          networkClientId,
        );
      },
      rollbackToPreviousProvider:
        networkController.rollbackToPreviousProvider.bind(networkController),
      addNetwork: this.networkController.addNetwork.bind(
        this.networkController,
      ),
      updateNetwork: this.networkController.updateNetwork.bind(
        this.networkController,
      ),
      removeNetwork: this.multichainNetworkController.removeNetwork.bind(
        this.multichainNetworkController,
      ),
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      getNetworkConfigurationByNetworkClientId:
        this.networkController.getNetworkConfigurationByNetworkClientId.bind(
          this.networkController,
        ),
      // PreferencesController
      setSelectedAddress: (address) => {
        const account = this.accountsController.getAccountByAddress(address);
        if (account) {
          this.accountsController.setSelectedAccount(account.id);
        } else {
          throw new Error(`No account found for address: ${address}`);
        }
      },
      toggleExternalServices: this.toggleExternalServices.bind(this),
      addToken: tokensController.addToken.bind(tokensController),
      updateTokenType: tokensController.updateTokenType.bind(tokensController),
      setFeatureFlag: preferencesController.setFeatureFlag.bind(
        preferencesController,
      ),
      setPreference: preferencesController.setPreference.bind(
        preferencesController,
      ),

      addKnownMethodData: preferencesController.addKnownMethodData.bind(
        preferencesController,
      ),
      setDismissSeedBackUpReminder:
        preferencesController.setDismissSeedBackUpReminder.bind(
          preferencesController,
        ),
      setOverrideContentSecurityPolicyHeader:
        preferencesController.setOverrideContentSecurityPolicyHeader.bind(
          preferencesController,
        ),
      setAdvancedGasFee: preferencesController.setAdvancedGasFee.bind(
        preferencesController,
      ),
      setTheme: preferencesController.setTheme.bind(preferencesController),
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      setSnapsAddSnapAccountModalDismissed:
        preferencesController.setSnapsAddSnapAccountModalDismissed.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF

      setManageInstitutionalWallets:
        preferencesController.setManageInstitutionalWallets.bind(
          preferencesController,
        ),

      // AccountsController
      setSelectedInternalAccount: (id) => {
        const account = this.accountsController.getAccount(id);
        if (account) {
          this.accountsController.setSelectedAccount(id);
        }
      },

      setAccountName:
        accountsController.setAccountName.bind(accountsController),

      setAccountLabel: (address, label) => {
        const account = this.accountsController.getAccountByAddress(address);
        if (account === undefined) {
          throw new Error(`No account found for address: ${address}`);
        }
        this.accountsController.setAccountName(account.id, label);
      },

      // AccountTreeController
      setSelectedMultichainAccount: (accountGroupId) => {
        this.accountTreeController.setSelectedAccountGroup(accountGroupId);
      },
      setAccountGroupName: (accountGroupId, accountGroupName) => {
        this.accountTreeController.setAccountGroupName(
          accountGroupId,
          accountGroupName,
        );
      },
      syncAccountTreeWithUserStorage: async () => {
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        await this.getSnapKeyring();
        ///: END:ONLY_INCLUDE_IF
        await this.accountTreeController.syncWithUserStorage();
      },

      // MultichainAccountService
      createNextMultichainAccountGroup: async (walletId) => {
        await this.multichainAccountService.createNextMultichainAccountGroup({
          entropySource: walletId,
        });
      },

      alignMultichainWallets: async () => {
        if (this.multichainAccountService) {
          await this.multichainAccountService.alignWallets();
        }
      },

      // AssetsContractController
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),
      getTokenSymbol: this.getTokenSymbol.bind(this),
      getTokenStandardAndDetailsByChain:
        this.getTokenStandardAndDetailsByChain.bind(this),
      getERC1155BalanceOf:
        this.assetsContractController.getERC1155BalanceOf.bind(
          this.assetsContractController,
        ),
      getERC721AssetSymbol:
        this.assetsContractController.getERC721AssetSymbol.bind(
          this.assetsContractController,
        ),

      // NftController
      addNft: nftController.addNft.bind(nftController),

      addNftVerifyOwnership:
        nftController.addNftVerifyOwnership.bind(nftController),

      removeAndIgnoreNft: nftController.removeAndIgnoreNft.bind(nftController),

      removeNft: nftController.removeNft.bind(nftController),

      checkAndUpdateAllNftsOwnershipStatus:
        nftController.checkAndUpdateAllNftsOwnershipStatus.bind(nftController),

      checkAndUpdateSingleNftOwnershipStatus:
        nftController.checkAndUpdateSingleNftOwnershipStatus.bind(
          nftController,
        ),

      getNFTContractInfo: nftController.getNFTContractInfo.bind(nftController),

      isNftOwner: nftController.isNftOwner.bind(nftController),

      // TransactionController
      updateIncomingTransactions:
        txController.updateIncomingTransactions.bind(txController),

      // AddressController
      setAddressBook: addressBookController.set.bind(addressBookController),
      removeFromAddressBook: addressBookController.delete.bind(
        addressBookController,
      ),

      // AppStateController
      setLastActiveTime:
        appStateController.setLastActiveTime.bind(appStateController),
      setCurrentExtensionPopupId:
        appStateController.setCurrentExtensionPopupId.bind(appStateController),
      setDefaultHomeActiveTabName:
        appStateController.setDefaultHomeActiveTabName.bind(appStateController),
      setConnectedStatusPopoverHasBeenShown:
        appStateController.setConnectedStatusPopoverHasBeenShown.bind(
          appStateController,
        ),
      setRecoveryPhraseReminderHasBeenShown:
        appStateController.setRecoveryPhraseReminderHasBeenShown.bind(
          appStateController,
        ),
      setRecoveryPhraseReminderLastShown:
        appStateController.setRecoveryPhraseReminderLastShown.bind(
          appStateController,
        ),
      setTermsOfUseLastAgreed:
        appStateController.setTermsOfUseLastAgreed.bind(appStateController),
      setSurveyLinkLastClickedOrClosed:
        appStateController.setSurveyLinkLastClickedOrClosed.bind(
          appStateController,
        ),
      setOnboardingDate:
        appStateController.setOnboardingDate.bind(appStateController),
      setLastViewedUserSurvey:
        appStateController.setLastViewedUserSurvey.bind(appStateController),
      setRampCardClosed:
        appStateController.setRampCardClosed.bind(appStateController),
      setNewPrivacyPolicyToastClickedOrClosed:
        appStateController.setNewPrivacyPolicyToastClickedOrClosed.bind(
          appStateController,
        ),
      setNewPrivacyPolicyToastShownDate:
        appStateController.setNewPrivacyPolicyToastShownDate.bind(
          appStateController,
        ),
      setSnapsInstallPrivacyWarningShownStatus:
        appStateController.setSnapsInstallPrivacyWarningShownStatus.bind(
          appStateController,
        ),
      setOutdatedBrowserWarningLastShown:
        appStateController.setOutdatedBrowserWarningLastShown.bind(
          appStateController,
        ),
      setIsUpdateAvailable:
        appStateController.setIsUpdateAvailable.bind(appStateController),
      setUpdateModalLastDismissedAt:
        appStateController.setUpdateModalLastDismissedAt.bind(
          appStateController,
        ),
      setLastUpdatedAt:
        appStateController.setLastUpdatedAt.bind(appStateController),
      setShowTestnetMessageInDropdown:
        appStateController.setShowTestnetMessageInDropdown.bind(
          appStateController,
        ),
      setShowBetaHeader:
        appStateController.setShowBetaHeader.bind(appStateController),
      setShowPermissionsTour:
        appStateController.setShowPermissionsTour.bind(appStateController),
      setShowAccountBanner:
        appStateController.setShowAccountBanner.bind(appStateController),
      setProductTour:
        appStateController.setProductTour.bind(appStateController),
      setShowNetworkBanner:
        appStateController.setShowNetworkBanner.bind(appStateController),
      updateNftDropDownState:
        appStateController.updateNftDropDownState.bind(appStateController),
      getLastInteractedConfirmationInfo:
        appStateController.getLastInteractedConfirmationInfo.bind(
          appStateController,
        ),
      setLastInteractedConfirmationInfo:
        appStateController.setLastInteractedConfirmationInfo.bind(
          appStateController,
        ),
      updateSlides: appStateController.updateSlides.bind(appStateController),
      removeSlide: appStateController.removeSlide.bind(appStateController),
      setEnableEnforcedSimulations:
        appStateController.setEnableEnforcedSimulations.bind(
          appStateController,
        ),
      setEnableEnforcedSimulationsForTransaction:
        appStateController.setEnableEnforcedSimulationsForTransaction.bind(
          appStateController,
        ),
      setEnforcedSimulationsSlippageForTransaction:
        appStateController.setEnforcedSimulationsSlippageForTransaction.bind(
          appStateController,
        ),
      setHasShownMultichainAccountsIntroModal:
        appStateController.setHasShownMultichainAccountsIntroModal.bind(
          appStateController,
        ),
      // EnsController
      tryReverseResolveAddress:
        ensController.reverseResolveAddress.bind(ensController),

      // OAuthService
      startOAuthLogin: this.oauthService.startOAuthLogin.bind(
        this.oauthService,
      ),
      setMarketingConsent: this.oauthService.setMarketingConsent.bind(
        this.oauthService,
      ),
      getMarketingConsent: this.oauthService.getMarketingConsent.bind(
        this.oauthService,
      ),

      // SeedlessOnboardingController
      authenticate: this.seedlessOnboardingController.authenticate.bind(
        this.seedlessOnboardingController,
      ),
      resetOAuthLoginState: this.seedlessOnboardingController.clearState.bind(
        this.seedlessOnboardingController,
      ),
      createSeedPhraseBackup: this.createSeedPhraseBackup.bind(this),
      storeKeyringEncryptionKey:
        this.seedlessOnboardingController.storeKeyringEncryptionKey.bind(
          this.seedlessOnboardingController,
        ),
      restoreSocialBackupAndGetSeedPhrase:
        this.restoreSocialBackupAndGetSeedPhrase.bind(this),
      syncSeedPhrases: this.syncSeedPhrases.bind(this),
      changePassword: this.changePassword.bind(this),

      // GatorPermissionsController
      fetchAndUpdateGatorPermissions:
        gatorPermissionsController.fetchAndUpdateGatorPermissions.bind(
          gatorPermissionsController,
        ),

      // KeyringController
      setLocked: this.setLocked.bind(this),
      createNewVaultAndKeychain: this.createNewVaultAndKeychain.bind(this),
      createNewVaultAndRestore: this.createNewVaultAndRestore.bind(this),
      generateNewMnemonicAndAddToVault:
        this.generateNewMnemonicAndAddToVault.bind(this),
      importMnemonicToVault: this.importMnemonicToVault.bind(this),
      exportAccount: this.exportAccount.bind(this),

      // txController
      updateTransaction: txController.updateTransaction.bind(txController),
      approveTransactionsWithSameNonce:
        txController.approveTransactionsWithSameNonce.bind(txController),
      createCancelTransaction: this.createCancelTransaction.bind(this),
      createSpeedUpTransaction: this.createSpeedUpTransaction.bind(this),
      estimateGas: this.estimateGas.bind(this),
      estimateGasFee: txController.estimateGasFee.bind(txController),
      getNextNonce: this.getNextNonce.bind(this),
      addTransaction: (transactionParams, transactionOptions) =>
        addTransaction(
          this.getAddTransactionRequest({
            transactionParams,
            transactionOptions,
            waitForSubmit: false,
          }),
        ),
      addTransactionAndWaitForPublish: (
        transactionParams,
        transactionOptions,
      ) =>
        addTransaction(
          this.getAddTransactionRequest({
            transactionParams,
            transactionOptions,
            waitForSubmit: true,
          }),
        ),
      createTransactionEventFragment:
        createTransactionEventFragmentWithTxId.bind(
          null,
          this.getTransactionMetricsRequest(),
        ),
      setTransactionActive:
        txController.setTransactionActive.bind(txController),
      // decryptMessageController
      decryptMessage: this.decryptMessageController.decryptMessage.bind(
        this.decryptMessageController,
      ),
      decryptMessageInline:
        this.decryptMessageController.decryptMessageInline.bind(
          this.decryptMessageController,
        ),
      cancelDecryptMessage:
        this.decryptMessageController.cancelDecryptMessage.bind(
          this.decryptMessageController,
        ),

      // EncryptionPublicKeyController
      encryptionPublicKey:
        this.encryptionPublicKeyController.encryptionPublicKey.bind(
          this.encryptionPublicKeyController,
        ),
      cancelEncryptionPublicKey:
        this.encryptionPublicKeyController.cancelEncryptionPublicKey.bind(
          this.encryptionPublicKeyController,
        ),

      // onboarding controller
      setSeedPhraseBackedUp:
        onboardingController.setSeedPhraseBackedUp.bind(onboardingController),
      completeOnboarding:
        onboardingController.completeOnboarding.bind(onboardingController),
      setFirstTimeFlowType:
        onboardingController.setFirstTimeFlowType.bind(onboardingController),

      // alert controller
      setAlertEnabledness:
        alertController.setAlertEnabledness.bind(alertController),
      setUnconnectedAccountAlertShown:
        alertController.setUnconnectedAccountAlertShown.bind(alertController),
      setWeb3ShimUsageAlertDismissed:
        alertController.setWeb3ShimUsageAlertDismissed.bind(alertController),

      // permissions
      removePermissionsFor: this.removePermissionsFor,
      approvePermissionsRequest: this.acceptPermissionsRequest,
      rejectPermissionsRequest: this.rejectPermissionsRequest,
      ...getPermissionBackgroundApiMethods({
        permissionController,
        approvalController,
        accountsController,
        networkController,
        multichainNetworkController,
      }),

      // snaps
      disableSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:disable',
      ),
      enableSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:enable',
      ),
      updateSnap: (origin, requestedSnaps) => {
        // We deliberately do not await this promise as that would mean waiting for the update to complete
        // Instead we return null to signal to the UI that it is safe to redirect to the update flow
        this.controllerMessenger.call(
          'SnapController:install',
          origin,
          requestedSnaps,
        );
        return null;
      },
      removeSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:remove',
      ),
      handleSnapRequest: this.handleSnapRequest.bind(this),
      revokeDynamicSnapPermissions: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:revokeDynamicPermissions',
      ),
      disconnectOriginFromSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:disconnectOrigin',
      ),
      updateNetworksList: this.updateNetworksList.bind(this),
      updateAccountsList: this.updateAccountsList.bind(this),
      setEnabledNetworks: this.setEnabledNetworks.bind(this),
      setEnabledNetworksMultichain:
        this.setEnabledNetworksMultichain.bind(this),
      updateHiddenAccountsList: this.updateHiddenAccountsList.bind(this),
      getPhishingResult: async (website) => {
        await phishingController.maybeUpdateState();

        return phishingController.test(website);
      },
      deleteInterface: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapInterfaceController:deleteInterface',
      ),
      updateInterfaceState: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapInterfaceController:updateInterfaceState',
      ),

      // swaps
      fetchAndSetQuotes: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:fetchAndSetQuotes',
      ),
      setSelectedQuoteAggId: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSelectedQuoteAggId',
      ),
      resetSwapsState: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:resetSwapsState',
      ),
      setSwapsTokens: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsTokens',
      ),
      clearSwapsQuotes: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:clearSwapsQuotes',
      ),
      setApproveTxId: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setApproveTxId',
      ),
      setTradeTxId: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setTradeTxId',
      ),
      setSwapsTxGasPrice: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsTxGasPrice',
      ),
      setSwapsTxGasLimit: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsTxGasLimit',
      ),
      setSwapsTxMaxFeePerGas: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsTxMaxFeePerGas',
      ),
      setSwapsTxMaxFeePriorityPerGas: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsTxMaxFeePriorityPerGas',
      ),
      safeRefetchQuotes: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:safeRefetchQuotes',
      ),
      stopPollingForQuotes: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:stopPollingForQuotes',
      ),
      setBackgroundSwapRouteState: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setBackgroundSwapRouteState',
      ),
      resetPostFetchState: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:resetPostFetchState',
      ),
      setSwapsErrorKey: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsErrorKey',
      ),
      setInitialGasEstimate: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setInitialGasEstimate',
      ),
      setCustomApproveTxData: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setCustomApproveTxData',
      ),
      setSwapsLiveness: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsLiveness',
      ),
      setSwapsFeatureFlags: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsFeatureFlags',
      ),
      setSwapsUserFeeLevel: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsUserFeeLevel',
      ),
      setSwapsQuotesPollingLimitEnabled: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SwapsController:setSwapsQuotesPollingLimitEnabled',
      ),

      // Bridge
      [BridgeBackgroundAction.RESET_STATE]: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        `${BRIDGE_CONTROLLER_NAME}:${BridgeBackgroundAction.RESET_STATE}`,
      ),
      [BridgeUserAction.UPDATE_QUOTE_PARAMS]:
        this.controllerMessenger.call.bind(
          this.controllerMessenger,
          `${BRIDGE_CONTROLLER_NAME}:${BridgeUserAction.UPDATE_QUOTE_PARAMS}`,
        ),
      [BridgeBackgroundAction.TRACK_METAMETRICS_EVENT]:
        this.controllerMessenger.call.bind(
          this.controllerMessenger,
          `${BRIDGE_CONTROLLER_NAME}:${BridgeBackgroundAction.TRACK_METAMETRICS_EVENT}`,
        ),

      // Bridge Tx submission
      [BridgeStatusAction.SUBMIT_TX]: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        `${BRIDGE_STATUS_CONTROLLER_NAME}:${BridgeStatusAction.SUBMIT_TX}`,
      ),

      // Smart Transactions
      fetchSmartTransactionFees: smartTransactionsController.getFees.bind(
        smartTransactionsController,
      ),
      clearSmartTransactionFees: smartTransactionsController.clearFees.bind(
        smartTransactionsController,
      ),
      submitSignedTransactions:
        smartTransactionsController.submitSignedTransactions.bind(
          smartTransactionsController,
        ),
      cancelSmartTransaction:
        smartTransactionsController.cancelSmartTransaction.bind(
          smartTransactionsController,
        ),
      fetchSmartTransactionsLiveness:
        smartTransactionsController.fetchLiveness.bind(
          smartTransactionsController,
        ),
      updateSmartTransaction:
        smartTransactionsController.updateSmartTransaction.bind(
          smartTransactionsController,
        ),
      setStatusRefreshInterval:
        smartTransactionsController.setStatusRefreshInterval.bind(
          smartTransactionsController,
        ),

      // MetaMetrics
      trackMetaMetricsEvent: metaMetricsController.trackEvent.bind(
        metaMetricsController,
      ),
      trackMetaMetricsPage: metaMetricsController.trackPage.bind(
        metaMetricsController,
      ),
      createEventFragment: metaMetricsController.createEventFragment.bind(
        metaMetricsController,
      ),
      updateEventFragment: metaMetricsController.updateEventFragment.bind(
        metaMetricsController,
      ),
      finalizeEventFragment: metaMetricsController.finalizeEventFragment.bind(
        metaMetricsController,
      ),
      trackInsightSnapView: this.trackInsightSnapView.bind(this),

      // MetaMetrics buffering for onboarding
      addEventBeforeMetricsOptIn:
        metaMetricsController.addEventBeforeMetricsOptIn.bind(
          metaMetricsController,
        ),

      // Buffered Trace API that checks consent and handles buffering/immediate execution
      bufferedTrace: metaMetricsController.bufferedTrace.bind(
        metaMetricsController,
      ),
      bufferedEndTrace: metaMetricsController.bufferedEndTrace.bind(
        metaMetricsController,
      ),

      // ApprovalController
      rejectAllPendingApprovals: this.rejectAllPendingApprovals.bind(this),
      rejectPendingApproval: this.rejectPendingApproval,
      requestUserApproval:
        approvalController.addAndShowApprovalRequest.bind(approvalController),
      resolvePendingApproval: this.resolvePendingApproval,

      // Notifications
      resetViewedNotifications: announcementController.resetViewed.bind(
        announcementController,
      ),
      updateViewedNotifications: announcementController.updateViewed.bind(
        announcementController,
      ),

      // CurrencyRateController
      currencyRateStartPolling: currencyRateController.startPolling.bind(
        currencyRateController,
      ),
      currencyRateStopPollingByPollingToken:
        currencyRateController.stopPollingByPollingToken.bind(
          currencyRateController,
        ),
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      multichainAssetsRatesStartPolling:
        multichainAssetsRatesController.startPolling.bind(
          multichainAssetsRatesController,
        ),
      multichainAssetsRatesStopPollingByPollingToken:
        multichainAssetsRatesController.stopPollingByPollingToken.bind(
          multichainAssetsRatesController,
        ),
      ///: END:ONLY_INCLUDE_IF

      tokenRatesStartPolling:
        tokenRatesController.startPolling.bind(tokenRatesController),
      tokenRatesStopPollingByPollingToken:
        tokenRatesController.stopPollingByPollingToken.bind(
          tokenRatesController,
        ),
      accountTrackerStartPolling:
        accountTrackerController.startPollingByNetworkClientId.bind(
          accountTrackerController,
        ),
      accountTrackerStopPollingByPollingToken:
        accountTrackerController.stopPollingByPollingToken.bind(
          accountTrackerController,
        ),

      tokenDetectionStartPolling: tokenDetectionController.startPolling.bind(
        tokenDetectionController,
      ),
      tokenDetectionStopPollingByPollingToken:
        tokenDetectionController.stopPollingByPollingToken.bind(
          tokenDetectionController,
        ),

      tokenListStartPolling:
        tokenListController.startPolling.bind(tokenListController),
      tokenListStopPollingByPollingToken:
        tokenListController.stopPollingByPollingToken.bind(tokenListController),

      tokenBalancesStartPolling: tokenBalancesController.startPolling.bind(
        tokenBalancesController,
      ),
      tokenBalancesStopPollingByPollingToken:
        tokenBalancesController.stopPollingByPollingToken.bind(
          tokenBalancesController,
        ),
      deFiStartPolling: deFiPositionsController.startPolling.bind(
        deFiPositionsController,
      ),
      deFiStopPolling: deFiPositionsController.stopPollingByPollingToken.bind(
        deFiPositionsController,
      ),

      // GasFeeController
      gasFeeStartPolling: gasFeeController.startPolling.bind(gasFeeController),
      gasFeeStopPollingByPollingToken:
        gasFeeController.stopPollingByPollingToken.bind(gasFeeController),

      getGasFeeTimeEstimate:
        gasFeeController.getTimeEstimate.bind(gasFeeController),

      addPollingTokenToAppState:
        appStateController.addPollingToken.bind(appStateController),

      removePollingTokenFromAppState:
        appStateController.removePollingToken.bind(appStateController),

      updateThrottledOriginState:
        appStateController.updateThrottledOriginState.bind(appStateController),

      // Backup
      backupUserData: backup.backupUserData.bind(backup),
      restoreUserData: backup.restoreUserData.bind(backup),

      // TokenDetectionController
      detectTokens: tokenDetectionController.detectTokens.bind(
        tokenDetectionController,
      ),

      // MultichainAssetsRatesController
      fetchHistoricalPricesForAsset: (...args) =>
        this.multichainAssetsRatesController.fetchHistoricalPricesForAsset(
          ...args,
        ),

      // DetectCollectibleController
      detectNfts: nftDetectionController.detectNfts.bind(
        nftDetectionController,
      ),

      /** Token Detection V2 */
      addDetectedTokens:
        tokensController.addDetectedTokens.bind(tokensController),
      addImportedTokens: tokensController.addTokens.bind(tokensController),
      ignoreTokens: tokensController.ignoreTokens.bind(tokensController),
      getBalancesInSingleCall: (...args) =>
        this.assetsContractController.getBalancesInSingleCall(...args),

      // Authentication Controller
      performSignIn: authenticationController.performSignIn.bind(
        authenticationController,
      ),
      performSignOut: authenticationController.performSignOut.bind(
        authenticationController,
      ),
      getUserProfileLineage:
        authenticationController.getUserProfileLineage.bind(
          authenticationController,
        ),

      // UserStorageController
      setIsBackupAndSyncFeatureEnabled:
        userStorageController.setIsBackupAndSyncFeatureEnabled.bind(
          userStorageController,
        ),
      deleteAccountSyncingDataFromUserStorage:
        userStorageController.performDeleteStorageAllFeatureEntries.bind(
          userStorageController,
        ),
      syncContactsWithUserStorage:
        userStorageController.syncContactsWithUserStorage.bind(
          userStorageController,
        ),
      // NotificationServicesController
      checkAccountsPresence:
        notificationServicesController.checkAccountsPresence.bind(
          notificationServicesController,
        ),
      createOnChainTriggers:
        notificationServicesController.createOnChainTriggers.bind(
          notificationServicesController,
        ),
      disableAccounts: notificationServicesController.disableAccounts.bind(
        notificationServicesController,
      ),
      enableAccounts: notificationServicesController.enableAccounts.bind(
        notificationServicesController,
      ),
      fetchAndUpdateMetamaskNotifications:
        notificationServicesController.fetchAndUpdateMetamaskNotifications.bind(
          notificationServicesController,
        ),
      deleteNotificationsById:
        notificationServicesController.deleteNotificationsById.bind(
          notificationServicesController,
        ),
      getNotificationsByType:
        notificationServicesController.getNotificationsByType.bind(
          notificationServicesController,
        ),
      markMetamaskNotificationsAsRead:
        notificationServicesController.markMetamaskNotificationsAsRead.bind(
          notificationServicesController,
        ),
      setFeatureAnnouncementsEnabled:
        notificationServicesController.setFeatureAnnouncementsEnabled.bind(
          notificationServicesController,
        ),
      enablePushNotifications:
        notificationServicesPushController.enablePushNotifications.bind(
          notificationServicesPushController,
        ),
      disablePushNotifications:
        notificationServicesPushController.disablePushNotifications.bind(
          notificationServicesPushController,
        ),
      enableMetamaskNotifications:
        notificationServicesController.enableMetamaskNotifications.bind(
          notificationServicesController,
        ),
      disableMetamaskNotifications:
        notificationServicesController.disableNotificationServices.bind(
          notificationServicesController,
        ),

      // Testing
      throwTestError: this.throwTestError.bind(this),
      captureTestError: this.captureTestError.bind(this),

      // NameController
      updateProposedNames: this.nameController.updateProposedNames.bind(
        this.nameController,
      ),
      setName: this.nameController.setName.bind(this.nameController),

      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      // SnapKeyring
      createSnapAccount: async (snapId, options, internalOptions) => {
        // NOTE: We should probably start using `withKeyring` with `createIfMissing: true`
        // in this case.
        const keyring = await this.getSnapKeyring();

        return await keyring.createAccount(snapId, options, internalOptions);
      },
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      // MultichainBalancesController
      multichainUpdateBalance: (accountId) =>
        this.multichainBalancesController.updateBalance(accountId),

      // MultichainTransactionsController
      multichainUpdateTransactions: (accountId) =>
        this.multichainTransactionsController.updateTransactionsForAccount(
          accountId,
        ),
      ///: END:ONLY_INCLUDE_IF
      // Transaction Decode
      decodeTransactionData: (request) =>
        decodeTransactionData({
          ...request,
          provider: this.provider,
        }),
      // metrics data deleteion
      createMetaMetricsDataDeletionTask:
        this.metaMetricsDataDeletionController.createMetaMetricsDataDeletionTask.bind(
          this.metaMetricsDataDeletionController,
        ),
      updateDataDeletionTaskStatus:
        this.metaMetricsDataDeletionController.updateDataDeletionTaskStatus.bind(
          this.metaMetricsDataDeletionController,
        ),

      // Other
      endTrace,
      isRelaySupported,
      isSendBundleSupported,
      openUpdateTabAndReload: () =>
        openUpdateTabAndReload(this.requestSafeReload.bind(this)),
      requestSafeReload: this.requestSafeReload.bind(this),
      applyTransactionContainersExisting: (transactionId, containerTypes) =>
        applyTransactionContainersExisting({
          containerTypes,
          messenger: this.controllerMessenger,
          transactionId,
          updateEditableParams: this.txController.updateEditableParams.bind(
            this.txController,
          ),
        }),
    };
  }

  rejectOriginPendingApprovals(origin) {
    const deleteInterface = (id) =>
      this.controllerMessenger.call(
        'SnapInterfaceController:deleteInterface',
        id,
      );

    rejectOriginApprovals({
      approvalController: this.approvalController,
      deleteInterface,
      origin,
    });
  }

  async exportAccount(address, password) {
    await this.verifyPassword(password);
    return this.keyringController.exportAccount(password, address);
  }

  async getTokenStandardAndDetails(address, userAddress, tokenId) {
    const currentChainId = this.#getGlobalChainId();

    const { tokensChainsCache } = this.tokenListController.state;
    const tokenList = tokensChainsCache?.[currentChainId]?.data || {};
    const { allTokens } = this.tokensController.state;

    const tokens = allTokens?.[currentChainId]?.[userAddress] || [];

    const staticTokenListDetails =
      STATIC_MAINNET_TOKEN_LIST[address?.toLowerCase()] || {};
    const tokenListDetails = tokenList[address?.toLowerCase()] || {};
    const userDefinedTokenDetails =
      tokens.find(({ address: _address }) =>
        isEqualCaseInsensitive(_address, address),
      ) || {};

    const tokenDetails = {
      ...staticTokenListDetails,
      ...tokenListDetails,
      ...userDefinedTokenDetails,
    };

    // boolean to check if the token is an ERC20
    const tokenDetailsStandardIsERC20 =
      isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC20) ||
      tokenDetails.erc20 === true;

    // boolean to check if the token is an NFT
    const noEvidenceThatTokenIsAnNFT =
      !tokenId &&
      !isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC1155) &&
      !isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC721) &&
      !tokenDetails.erc721;

    // boolean to check if the token is an ERC20 like
    const otherDetailsAreERC20Like =
      tokenDetails.decimals !== undefined && tokenDetails.symbol;

    // boolean to check if the token can be treated as an ERC20
    const tokenCanBeTreatedAsAnERC20 =
      tokenDetailsStandardIsERC20 ||
      (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

    let details;
    if (tokenCanBeTreatedAsAnERC20) {
      try {
        const balance = userAddress
          ? await fetchTokenBalance(address, userAddress, this.provider)
          : undefined;

        details = {
          address,
          balance,
          standard: TokenStandard.ERC20,
          decimals: tokenDetails.decimals,
          symbol: tokenDetails.symbol,
        };
      } catch (e) {
        // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
        // fall back to the below `assetsContractController.getTokenStandardAndDetails` call
        log.warn(`Failed to get token balance. Error: ${e}`);
      }
    }

    // `details`` will be undefined if `tokenCanBeTreatedAsAnERC20`` is false,
    // or if it is true but the `fetchTokenBalance`` call failed. In either case, we should
    // attempt to retrieve details from `assetsContractController.getTokenStandardAndDetails`
    if (details === undefined) {
      try {
        details =
          await this.assetsContractController.getTokenStandardAndDetails(
            address,
            userAddress,
            tokenId,
          );
      } catch (e) {
        log.warn(`Failed to get token standard and details. Error: ${e}`);
      }
    }

    if (details) {
      const tokenDetailsStandardIsERC1155 = isEqualCaseInsensitive(
        details.standard,
        TokenStandard.ERC1155,
      );

      if (tokenDetailsStandardIsERC1155) {
        try {
          const balance = await fetchERC1155Balance(
            address,
            userAddress,
            tokenId,
            this.provider,
          );

          const balanceToUse = balance?._hex
            ? parseInt(balance._hex, 16).toString()
            : null;

          details = {
            ...details,
            balance: balanceToUse,
          };
        } catch (e) {
          // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
          // fall back to the below `assetsContractController.getTokenStandardAndDetails` call
          log.warn('Failed to get token balance. Error:', e);
        }
      }
    }

    return {
      ...details,
      decimals: details?.decimals?.toString(10),
      balance: details?.balance?.toString(10),
    };
  }

  async getTokenStandardAndDetailsByChain(
    address,
    userAddress,
    tokenId,
    chainId,
  ) {
    const { tokensChainsCache } = this.tokenListController.state;
    const tokenList = tokensChainsCache?.[chainId]?.data || {};

    const { allTokens } = this.tokensController.state;
    const selectedAccount = this.accountsController.getSelectedAccount();
    const tokens = allTokens?.[chainId]?.[selectedAccount.address] || [];

    let staticTokenListDetails = {};
    if (chainId === CHAIN_IDS.MAINNET) {
      staticTokenListDetails =
        STATIC_MAINNET_TOKEN_LIST[address?.toLowerCase()] || {};
    }

    const tokenListDetails = tokenList[address?.toLowerCase()] || {};
    const userDefinedTokenDetails =
      tokens.find(({ address: _address }) =>
        isEqualCaseInsensitive(_address, address),
      ) || {};
    const tokenDetails = {
      ...staticTokenListDetails,
      ...tokenListDetails,
      ...userDefinedTokenDetails,
    };

    const tokenDetailsStandardIsERC20 =
      isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC20) ||
      tokenDetails.erc20 === true;

    const noEvidenceThatTokenIsAnNFT =
      !tokenId &&
      !isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC1155) &&
      !isEqualCaseInsensitive(tokenDetails.standard, TokenStandard.ERC721) &&
      !tokenDetails.erc721;

    const otherDetailsAreERC20Like =
      tokenDetails.decimals !== undefined && tokenDetails.symbol;

    // boolean to check if the token can be treated as an ERC20
    const tokenCanBeTreatedAsAnERC20 =
      tokenDetailsStandardIsERC20 ||
      (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

    let details;
    if (tokenCanBeTreatedAsAnERC20) {
      try {
        let balance = 0;
        if (this.#getGlobalChainId() === chainId) {
          balance = await fetchTokenBalance(
            address,
            userAddress,
            this.provider,
          );
        }

        details = {
          address,
          balance,
          standard: TokenStandard.ERC20,
          decimals: tokenDetails.decimals,
          symbol: tokenDetails.symbol,
        };
      } catch (e) {
        // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
        // fall back to the below `assetsContractController.getTokenStandardAndDetails` call
        log.warn(`Failed to get token balance. Error: ${e}`);
      }
    }

    // `details`` will be undefined if `tokenCanBeTreatedAsAnERC20`` is false,
    // or if it is true but the `fetchTokenBalance`` call failed. In either case, we should
    // attempt to retrieve details from `assetsContractController.getTokenStandardAndDetails`
    if (details === undefined) {
      try {
        const networkClientId =
          this.networkController?.state?.networkConfigurationsByChainId?.[
            chainId
          ]?.rpcEndpoints[
            this.networkController?.state?.networkConfigurationsByChainId?.[
              chainId
            ]?.defaultRpcEndpointIndex
          ]?.networkClientId;

        details =
          await this.assetsContractController.getTokenStandardAndDetails(
            address,
            userAddress,
            tokenId,
            networkClientId,
          );
      } catch (e) {
        log.warn(`Failed to get token standard and details. Error: ${e}`);
      }
    }

    if (details) {
      const tokenDetailsStandardIsERC1155 = isEqualCaseInsensitive(
        details.standard,
        TokenStandard.ERC1155,
      );

      if (tokenDetailsStandardIsERC1155) {
        try {
          const balance = await fetchERC1155Balance(
            address,
            userAddress,
            tokenId,
            this.provider,
          );

          const balanceToUse = balance?._hex
            ? parseInt(balance._hex, 16).toString()
            : null;

          details = {
            ...details,
            balance: balanceToUse,
          };
        } catch (e) {
          // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
          // fall back to the below `assetsContractController.getTokenStandardAndDetails` call
          log.warn('Failed to get token balance. Error:', e);
        }
      }
    }

    return {
      ...details,
      decimals: details?.decimals?.toString(10),
      balance: details?.balance?.toString(10),
    };
  }

  async getTokenSymbol(address) {
    try {
      const details =
        await this.assetsContractController.getTokenStandardAndDetails(address);
      return details?.symbol;
    } catch (e) {
      return null;
    }
  }

  /**
   * Creates a PRIMARY seed phrase backup for the user.
   *
   * Generate Encryption Key from the password using the Threshold OPRF and encrypt the seed phrase with the key.
   * Save the encrypted seed phrase in the metadata store.
   *
   * @param {string} password - The user's password.
   * @param {number[]} encodedSeedPhrase - The seed phrase to backup.
   * @param {string} keyringId - The keyring id of the backup seed phrase.
   */
  async createSeedPhraseBackup(password, encodedSeedPhrase, keyringId) {
    let createSeedPhraseBackupSuccess = false;
    try {
      this.metaMetricsController.bufferedTrace?.({
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);

      const seedPhrase =
        this._convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

      await this.seedlessOnboardingController.createToprfKeyAndBackupSeedPhrase(
        password,
        seedPhrase,
        keyringId,
      );
      createSeedPhraseBackupSuccess = true;

      await this.syncKeyringEncryptionKey();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.metaMetricsController.bufferedTrace?.({
        name: TraceName.OnboardingCreateKeyAndBackupSrpError,
        op: TraceOperation.OnboardingError,
        tags: { errorMessage },
      });
      this.metaMetricsController.bufferedEndTrace?.({
        name: TraceName.OnboardingCreateKeyAndBackupSrpError,
      });

      log.error('[createSeedPhraseBackup] error', error);
      throw error;
    } finally {
      this.metaMetricsController.bufferedEndTrace?.({
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        data: { success: createSeedPhraseBackupSuccess },
      });
    }
  }

  /**
   * Fetches and restores all the backed-up Secret Data (SRPs and Private keys)
   *
   * @param {string} password - The user's password.
   * @returns {Promise<Buffer[]>} The seed phrase.
   */
  async fetchAllSecretData(password) {
    let fetchAllSeedPhrasesSuccess = false;
    try {
      this.metaMetricsController.bufferedTrace?.({
        name: TraceName.OnboardingFetchSrps,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const allSeedPhrases =
        await this.seedlessOnboardingController.fetchAllSecretData(password);
      fetchAllSeedPhrasesSuccess = true;

      return allSeedPhrases;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.metaMetricsController.bufferedTrace?.({
        name: TraceName.OnboardingFetchSrpsError,
        op: TraceOperation.OnboardingError,
        tags: { errorMessage },
      });
      this.metaMetricsController.bufferedEndTrace?.({
        name: TraceName.OnboardingFetchSrpsError,
      });

      throw error;
    } finally {
      this.metaMetricsController.bufferedEndTrace?.({
        name: TraceName.OnboardingFetchSrps,
        data: { success: fetchAllSeedPhrasesSuccess },
      });
    }
  }

  /**
   * Sync latest global seedless password and override the current device password with latest global password.
   * Unlock the vault with the latest global password.
   *
   * @param {string} password - latest global seedless password
   * @returns {boolean} true if the sync was successful, false otherwise. Sync can fail if user is on a very old device
   * and user has changed password more than 20 times since the last time they used the app on this device.
   */
  async syncPasswordAndUnlockWallet(password) {
    let isPasswordSynced = false;
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();
    // check if the password is outdated
    let isPasswordOutdated = false;
    if (isSocialLoginFlow) {
      try {
        isPasswordOutdated =
          await this.seedlessOnboardingController.checkIsPasswordOutdated({
            skipCache: false,
          });
      } catch (error) {
        // we don't want to block the unlock flow if the password outdated check fails
        log.error('error while checking if password is outdated', error);
      }
    }

    // if the flow is not social login or the password is not outdated,
    // we will proceed with the normal flow and use the password to unlock the vault
    if (!isSocialLoginFlow || !isPasswordOutdated) {
      await this.submitPassword(password);
      if (isSocialLoginFlow) {
        // renew seedless refresh token asynchronously
        this.seedlessOnboardingController
          .renewRefreshToken(password)
          .catch((err) => {
            log.error('error while revoking seedless refresh token', err);
          })
          .finally(() => {
            // try to revoke pending refresh tokens asynchronously
            this.seedlessOnboardingController
              .revokePendingRefreshTokens()
              .catch((err) => {
                log.error('error while revoking pending refresh tokens', err);
              });
          });
      }
      isPasswordSynced = true;
      return isPasswordSynced;
    }
    const releaseLock = await this.seedlessOperationMutex.acquire();

    try {
      const isKeyringPasswordValid = await this.keyringController
        .verifyPassword(password)
        .then(() => true)
        .catch((err) => {
          if (err.message.includes('Incorrect password')) {
            return false;
          }
          log.error('error while verifying keyring password', err.message);
          throw err;
        });

      // here e could be invalid password or outdated password error, which can result in following cases:
      // 1. Seedless controller password verification succeeded.
      // 2. Seedless controller failed but Keyring controller password verification succeeded.
      // 3. Both keyring and seedless controller password verification failed.
      await this.seedlessOnboardingController
        .submitGlobalPassword({
          globalPassword: password,
          maxKeyChainLength: 20,
        })
        .then(() => {
          // Case 1.
          isPasswordSynced = true;
        })
        .catch((err) => {
          log.error(
            `error while submitting global password: ${err.message} , isKeyringPasswordValid: ${isKeyringPasswordValid}`,
          );
          if (err instanceof RecoveryError) {
            // Keyring controller password verification succeeds and seedless controller failed.
            if (
              err?.message ===
                SeedlessOnboardingControllerErrorMessage.IncorrectPassword &&
              isKeyringPasswordValid
            ) {
              throw new Error(
                SeedlessOnboardingControllerErrorMessage.OutdatedPassword,
              );
            }
            throw new JsonRpcError(-32603, err.message, err.data);
          } else if (
            err.message ===
            SeedlessOnboardingControllerErrorMessage.MaxKeyChainLengthExceeded
          ) {
            isPasswordSynced = false;
          } else {
            throw err;
          }
        });

      // we are unable to recover the old pwd enc key as user is on a very old device.
      // create a new vault and encrypt the new vault with the latest global password.
      // also show a info popup to user.
      if (!isPasswordSynced) {
        // refresh the current auth tokens to get the latest auth tokens
        await this.seedlessOnboardingController.refreshAuthTokens();
        // create a new vault and encrypt the new vault with the latest global password
        await this.restoreSocialBackupAndGetSeedPhrase(password);
        // display info popup to user based on the password sync status
        return isPasswordSynced;
      }

      // re-encrypt the old vault data with the latest global password
      const keyringEncryptionKey =
        await this.seedlessOnboardingController.loadKeyringEncryptionKey();
      // use encryption key to unlock the keyring vault
      await this.submitEncryptionKey(keyringEncryptionKey);

      let changePasswordSuccess = false;
      try {
        // update seedlessOnboardingController to use latest global password
        await this.seedlessOnboardingController.syncLatestGlobalPassword({
          globalPassword: password,
        });

        this.metaMetricsController.bufferedTrace?.({
          name: TraceName.OnboardingResetPassword,
          op: TraceOperation.OnboardingSecurityOp,
        });
        // update vault password to global password
        await this.keyringController.changePassword(password);
        changePasswordSuccess = true;
        // sync the new keyring encryption key after keyring changePassword to the seedless onboarding controller
        await this.syncKeyringEncryptionKey();

        // check password outdated again skip cache to reset the cache after successful syncing
        await this.seedlessOnboardingController.checkIsPasswordOutdated({
          skipCache: true,
        });

        // revoke seedless refresh token asynchronously
        this.seedlessOnboardingController
          .renewRefreshToken(password)
          .catch((err) => {
            log.error('error while revoking seedless refresh token', err);
          })
          .finally(() => {
            // try to revoke pending refresh tokens asynchronously
            this.seedlessOnboardingController
              .revokePendingRefreshTokens()
              .catch((err) => {
                log.error('error while revoking pending refresh tokens', err);
              });
          });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';

        this.metaMetricsController.bufferedTrace?.({
          name: TraceName.OnboardingResetPasswordError,
          op: TraceOperation.OnboardingError,
          tags: { errorMessage },
        });
        this.metaMetricsController.bufferedEndTrace?.({
          name: TraceName.OnboardingResetPasswordError,
        });

        // lock app again on error after submitPassword succeeded
        // here we skip the seedless operation lock as we are already in the seedless operation lock
        await this.setLocked({ skipSeedlessOperationLock: true });
        throw err;
      } finally {
        this.metaMetricsController.bufferedEndTrace?.({
          name: TraceName.OnboardingResetPassword,
          data: { success: changePasswordSuccess },
        });
      }
      return isPasswordSynced;
    } finally {
      releaseLock();
    }
  }

  /**
   * Syncs the keyring encryption key with the seedless onboarding controller.
   *
   * @returns {Promise<void>}
   */
  async syncKeyringEncryptionKey() {
    // store the keyring encryption key in the seedless onboarding controller
    const keyringEncryptionKey =
      await this.keyringController.exportEncryptionKey();
    await this.seedlessOnboardingController.storeKeyringEncryptionKey(
      keyringEncryptionKey,
    );
  }

  /**
   * Checks if the seedless password is outdated.
   *
   * @param {boolean} skipCache - whether to skip the cache
   * @returns {Promise<boolean | undefined>} true if the password is outdated, false otherwise, undefined if the flow is not seedless
   */
  async checkIsSeedlessPasswordOutdated(skipCache = false) {
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();
    const { completedOnboarding } = this.onboardingController.state;

    if (!isSocialLoginFlow || !completedOnboarding) {
      // this is only available for seedless onboarding flow and completed onboarding
      return false;
    }

    const isPasswordOutdated =
      await this.seedlessOnboardingController.checkIsPasswordOutdated({
        skipCache,
      });
    return isPasswordOutdated;
  }

  /**
   * Syncs the seed phrases with the social login flow.
   *
   * @returns {Promise<void>}
   */
  async syncSeedPhrases() {
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();

    if (!isSocialLoginFlow) {
      throw new Error(
        'Syncing seed phrases is only available for social login flow',
      );
    }

    // 1. fetch all seed phrases
    const [rootSecret, ...otherSecrets] = await this.fetchAllSecretData();
    if (!rootSecret) {
      throw new Error('No root SRP found');
    }

    for (const secret of otherSecrets) {
      // import SRP secret
      // Get the SRP hash, and find the hash in the local state
      const srpHash =
        this.seedlessOnboardingController.getSecretDataBackupState(
          secret.data,
          secret.type,
        );

      if (!srpHash) {
        // import private key secret
        if (secret.type === SecretType.PrivateKey) {
          await this.importAccountWithStrategy(
            'privateKey',
            [bytesToHex(secret.data)],
            {
              shouldCreateSocialBackup: false,
              shouldSelectAccount: false,
            },
          );
          continue;
        }

        // If SRP is not in the local state, import it to the vault
        // convert the seed phrase to a mnemonic (string)
        const encodedSrp = this._convertEnglishWordlistIndicesToCodepoints(
          secret.data,
        );
        const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

        // import the new mnemonic to the current vault
        await this.importMnemonicToVault(mnemonicToRestore, {
          shouldCreateSocialBackup: false,
          shouldSelectAccount: false,
          shouldImportSolanaAccount: true,
        });
      }
    }
  }

  /**
   * Adds a new seed phrase backup for the user.
   *
   * If `syncWithSocial` is false, it will only update the local state,
   * and not sync the seed phrase to the server.
   *
   * @param {string} mnemonic - The mnemonic to derive the seed phrase from.
   * @param {string} keyringId - The keyring id of the backup seed phrase.
   * @param {boolean} syncWithSocial - whether to skip syncing with social login
   */
  async addNewSeedPhraseBackup(mnemonic, keyringId, syncWithSocial = true) {
    const seedPhraseAsBuffer = Buffer.from(mnemonic, 'utf8');

    const seedPhraseAsUint8Array =
      this._convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

    if (syncWithSocial) {
      const releaseLock = await this.seedlessOperationMutex.acquire();
      let addNewSeedPhraseBackupSuccess = false;
      try {
        this.metaMetricsController.bufferedTrace?.({
          name: TraceName.OnboardingAddSrp,
          op: TraceOperation.OnboardingSecurityOp,
        });
        await this.seedlessOnboardingController.addNewSecretData(
          seedPhraseAsUint8Array,
          SecretType.Mnemonic,
          {
            keyringId,
          },
        );
        addNewSeedPhraseBackupSuccess = true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';

        this.metaMetricsController.bufferedTrace?.({
          name: TraceName.OnboardingAddSrpError,
          op: TraceOperation.OnboardingError,
          tags: { errorMessage },
        });
        this.metaMetricsController.bufferedEndTrace?.({
          name: TraceName.OnboardingAddSrpError,
        });

        throw err;
      } finally {
        this.metaMetricsController.bufferedEndTrace?.({
          name: TraceName.OnboardingAddSrp,
          data: { success: addNewSeedPhraseBackupSuccess },
        });
        releaseLock();
      }
    } else {
      // Do not sync the seed phrase to the server, only update the local state
      this.seedlessOnboardingController.updateBackupMetadataState({
        keyringId,
        data: seedPhraseAsUint8Array,
        type: SecretType.Mnemonic,
      });
    }
  }

  /**
   * Changes the password for the wallet.
   *
   * If the flow is social login flow, it will also change the password for the seedless onboarding controller.
   *
   * @param {string} newPassword - The new password.
   * @param {string} oldPassword - The old password.
   */
  async changePassword(newPassword, oldPassword) {
    const releaseLock = await this.seedlessOperationMutex.acquire();
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();
    try {
      await this.keyringController.changePassword(newPassword);

      if (isSocialLoginFlow) {
        try {
          await this.seedlessOnboardingController.changePassword(
            newPassword,
            oldPassword,
          );
          // store the new keyring encryption key in the seedless onboarding controller
          const keyringEncKey =
            await this.keyringController.exportEncryptionKey();
          await this.seedlessOnboardingController.storeKeyringEncryptionKey(
            keyringEncKey,
          );
        } catch (err) {
          log.error('error while changing seedless-onboarding password', err);
          log.error('reverting keyring password change');
          // revert the keyring password change by changing the password back to the old password
          await this.keyringController.changePassword(oldPassword);
          // store the old keyring encryption key in the seedless onboarding controller
          const revertedKeyringEncKey =
            await this.keyringController.exportEncryptionKey();
          await this.seedlessOnboardingController.storeKeyringEncryptionKey(
            revertedKeyringEncKey,
          );
          throw err;
        }
      }
    } catch (error) {
      log.error('error while changing password', error);
      throw error;
    } finally {
      releaseLock();
    }
  }

  //=============================================================================
  // VAULT / KEYRING RELATED METHODS
  //=============================================================================

  /**
   * Creates a new Vault and create a new keychain.
   *
   * A vault, or KeyringController, is a controller that contains
   * many different account strategies, currently called Keyrings.
   * Creating it new means wiping all previous keyrings.
   *
   * A keychain, or keyring, controls many accounts with a single backup and signing strategy.
   * For example, a mnemonic phrase can generate many accounts, and is a keyring.
   *
   * @param {string} password
   * @returns {object} created keyring object
   */
  async createNewVaultAndKeychain(password) {
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      await this.keyringController.createNewVaultAndKeychain(password);
      return this.keyringController.state.keyrings[0];
    } finally {
      releaseLock();
    }
  }

  /**
   * Counts the number of accounts discovered by provider.
   *
   * @param {Array} accounts - The discovered accounts to count by provider.
   */
  getDiscoveryCountByProvider(accounts) {
    // count includes Bitcoin to maintain return type for the ImportSRP component
    const counts = {
      Bitcoin: 0,
      Solana: 0,
    };

    const solanaAccountTypes = Object.values(SolAccountType);

    for (const account of accounts) {
      // Newly supported account types should be added here
      // No BTC discovery/account creation until the provider is added to the MultichainAccountsService
      if (solanaAccountTypes.includes(account.type)) {
        counts.Solana += 1;
      }
    }

    return counts;
  }

  /**
   * Discovers and creates accounts for the given keyring id.
   *
   * @param {string} id - The keyring id to discover and create accounts for.
   * @returns {Promise<Record<string, number>>} Discovered account counts by chain.
   */
  async discoverAndCreateAccounts(id) {
    try {
      // If no keyring id is provided, we assume one keyring was added to the vault
      const keyringIdToDiscover =
        id || this.keyringController.state.keyrings[0]?.metadata.id;

      if (!keyringIdToDiscover) {
        throw new Error('No keyring id to discover accounts for');
      }

      // Ensure the snap keyring is initialized
      await this.getSnapKeyring();

      const wallet = this.controllerMessenger.call(
        'MultichainAccountService:getMultichainAccountWallet',
        { entropySource: keyringIdToDiscover },
      );

      const result = await wallet.discoverAccounts();

      const counts = this.getDiscoveryCountByProvider(result);

      return counts;
    } catch (error) {
      log.warn(`Failed to add accounts with balance. ${error}`);
      return {
        Bitcoin: 0,
        Solana: 0,
      };
    }
  }

  /**
   * Imports a new mnemonic to the vault.
   *
   * @param {string} mnemonic - The mnemonic to import.
   * @param {object} options - The options for the import.
   * @param {boolean} options.shouldCreateSocialBackup - whether to create a backup for the seedless onboarding flow
   * @param {boolean} options.shouldSelectAccount - whether to select the new account in the wallet
   * @param {boolean} options.shouldImportSolanaAccount - whether to import a Solana account
   * @returns {Promise<string>} new account address
   */
  async importMnemonicToVault(
    mnemonic,
    options = {
      shouldCreateSocialBackup: true,
      shouldSelectAccount: true,
      shouldImportSolanaAccount: true,
    },
  ) {
    const {
      shouldCreateSocialBackup,
      shouldSelectAccount,
      shouldImportSolanaAccount,
    } = options;
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      // TODO: `getKeyringsByType` is deprecated, this logic should probably be moved to the `KeyringController`.
      // FIXME: The `KeyringController` does not check yet for duplicated accounts with HD keyrings, see: https://github.com/MetaMask/core/issues/5411
      const alreadyImportedSrp = this.keyringController
        .getKeyringsByType(KeyringTypes.hd)
        .some((keyring) => {
          return (
            Buffer.from(
              this._convertEnglishWordlistIndicesToCodepoints(keyring.mnemonic),
            ).toString('utf8') === mnemonic
          );
        });

      if (alreadyImportedSrp) {
        throw new Error(
          'This Secret Recovery Phrase has already been imported.',
        );
      }

      const { id } = await this.keyringController.addNewKeyring(
        KeyringTypes.hd,
        {
          mnemonic,
          numberOfAccounts: 1,
        },
      );

      const [newAccountAddress] = await this.keyringController.withKeyring(
        { id },
        async ({ keyring }) => keyring.getAccounts(),
      );

      if (this.onboardingController.getIsSocialLoginFlow()) {
        try {
          // if social backup is requested, add the seed phrase backup
          await this.addNewSeedPhraseBackup(
            mnemonic,
            id,
            shouldCreateSocialBackup,
          );
        } catch (err) {
          // handle seedless controller import error by reverting keyring controller mnemonic import
          // KeyringController.removeAccount will remove keyring when it's emptied, currently there are no other method in keyring controller to remove keyring
          await this.keyringController.removeAccount(newAccountAddress);
          throw err;
        }
      }

      if (shouldSelectAccount) {
        const account =
          this.accountsController.getAccountByAddress(newAccountAddress);
        this.accountsController.setSelectedAccount(account.id);
      }

      if (this.isMultichainAccountsFeatureState2Enabled()) {
        // We want to trigger a full sync of the account tree after importing a new SRP
        // because `hasAccountTreeSyncingSyncedAtLeastOnce` is already true
        await this.accountTreeController.syncWithUserStorage();
      }

      let discoveredAccounts;

      if (
        this.isMultichainAccountsFeatureState2Enabled() &&
        shouldImportSolanaAccount
      ) {
        // We check if shouldImportSolanaAccount is true, because if it's false, we are in the middle of the onboarding flow.
        // We just create the accounts at the end of the onboarding flow (including EVM).
        discoveredAccounts = await this.discoverAndCreateAccounts(id);
      } else {
        discoveredAccounts = await this._addAccountsWithBalance(
          id,
          shouldImportSolanaAccount,
        );
      }

      return {
        newAccountAddress,
        discoveredAccounts,
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Restores an array of seed phrases to the vault and updates the SocialBackupMetadataState if import is successful.
   *
   * This method is used to restore seed phrases from the Social Backup.
   *
   * @param {{data: Uint8Array, type: SecretType, timestamp: number, version: number}[]} secretDatas - The seed phrases to restore.
   * @returns {Promise<void>}
   */
  async restoreSeedPhrasesToVault(secretDatas) {
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();

    if (!isSocialLoginFlow) {
      // import the restored seed phrase (mnemonics) to the vault
      // this is only available for social login flow
      return; // or throw error here?
    }

    // These mnemonics are restored from the Social Backup, so we don't need to do it again
    const shouldCreateSocialBackup = false;
    // This is used to select the new account in the wallet.
    // During the restore seed phrases, we just do the import, but don't change the selected account.
    // Just let the user select the account manually after the restore.
    const shouldSetSelectedAccount = false;

    // This method is called during the social login rehydration.
    // At that point, we won't import the Solana account yet, since the wallet onboarding is not completed yet.
    // Solana accounts will be imported after the wallet onboarding is completed.
    const shouldImportSolanaAccount = false;

    for (const secret of secretDatas) {
      // import SRP secret
      // Get the SRP hash, and find the hash in the local state
      const srpHash =
        this.seedlessOnboardingController.getSecretDataBackupState(
          secret.data,
          secret.type,
        );
      if (srpHash) {
        // If SRP is in the local state, skip it
        continue;
      }

      if (secret.type === SecretType.PrivateKey) {
        await this.importAccountWithStrategy(
          'privateKey',
          [bytesToHex(secret.data)],
          {
            shouldCreateSocialBackup,
            shouldSelectAccount: shouldSetSelectedAccount,
          },
        );
        continue;
      }

      // If SRP is not in the local state, import it to the vault
      // convert the seed phrase to a mnemonic (string)
      const encodedSrp = this._convertEnglishWordlistIndicesToCodepoints(
        secret.data,
      );
      const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

      // import the new mnemonic to the vault
      await this.importMnemonicToVault(mnemonicToRestore, {
        shouldCreateSocialBackup,
        shouldSelectAccount: shouldSetSelectedAccount,
        shouldImportSolanaAccount,
      });
    }
  }

  /**
   * Fetches and restores the seed phrase from the metadata store using the social login and restore the vault using the seed phrase.
   *
   * @param {string} password - The password.
   * @returns The seed phrase.
   */
  async restoreSocialBackupAndGetSeedPhrase(password) {
    try {
      // get the first seed phrase from the array, this is the oldest seed phrase
      // and we will use it to create the initial vault
      const [firstSecretData, ...remainingSecretData] =
        await this.fetchAllSecretData(password);

      const firstSeedPhrase = this._convertEnglishWordlistIndicesToCodepoints(
        firstSecretData.data,
      );
      const mnemonic = Buffer.from(firstSeedPhrase).toString('utf8');
      const encodedSeedPhrase = Array.from(
        Buffer.from(mnemonic, 'utf8').values(),
      );
      // restore the vault using the root seed phrase
      await this.createNewVaultAndRestore(password, encodedSeedPhrase);

      // restore the remaining Mnemonics/SeedPhrases/PrivateKeys to the vault
      if (remainingSecretData.length > 0) {
        await this.restoreSeedPhrasesToVault(remainingSecretData);
      }

      return mnemonic;
    } catch (error) {
      log.error('Error restoring social backup and getting seed phrase', error);
      if (error instanceof RecoveryError) {
        throw new JsonRpcError(-32603, error.message, error.data);
      }
      throw error;
    }
  }

  /**
   * Generates a new mnemonic phrase and adds it to the vault, creating a new HD keyring.
   * This method automatically creates one account associated with the new keyring.
   * The method is protected by a mutex to prevent concurrent vault modifications.
   *
   * @async
   * @returns {Promise<string>} The address of the newly created account
   * @throws Will throw an error if keyring creation fails
   */
  async generateNewMnemonicAndAddToVault() {
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      // addNewKeyring auto creates 1 account.
      const { id } = await this.keyringController.addNewKeyring(
        KeyringTypes.hd,
      );
      const [newAccount] = await this.keyringController.withKeyring(
        { id },
        async ({ keyring }) => keyring.getAccounts(),
      );
      const account = this.accountsController.getAccountByAddress(newAccount);
      this.accountsController.setSelectedAccount(account.id);

      // NOTE: No need to update balances here since we're generating a fresh seed.

      return newAccount;
    } finally {
      releaseLock();
    }
  }

  /**
   * Create a new Vault and restore an existent keyring.
   *
   * @param {string} password
   * @param {number[]} encodedSeedPhrase - The seed phrase, encoded as an array
   * of UTF-8 bytes.
   */
  async createNewVaultAndRestore(password, encodedSeedPhrase) {
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      const { completedOnboarding } = this.onboardingController.state;

      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);

      // clear permissions
      this.permissionController.clearState();

      // Clear snap state
      await this.snapController.clearState();

      // Clear account tree state
      this.accountTreeController.clearState();

      // Currently, the account-order-controller is not in sync with
      // the accounts-controller. To properly persist the hidden state
      // of accounts, we should add a new flag to the account struct
      // to indicate if it is hidden or not.
      // TODO: Update @metamask/accounts-controller to support this.
      this.accountOrderController.updateHiddenAccountsList([]);

      // clear accounts in AccountTrackerController
      this.accountTrackerController.clearAccounts();

      this.txController.clearUnapprovedTransactions();

      if (completedOnboarding) {
        this.tokenDetectionController.enable();
      }

      // create new vault
      const seedPhraseAsUint8Array =
        this._convertMnemonicToWordlistIndices(seedPhraseAsBuffer);
      await this.keyringController.createNewVaultAndRestore(
        password,
        seedPhraseAsUint8Array,
      );

      // We re-created the vault, meaning we only have 1 new HD keyring
      // now. We re-create the internal list of accounts (which is
      // not an expensive operation, since we should only have 1 HD
      // keyring that has one default account.
      // TODO: Remove this once the `accounts-controller` once only
      // depends only on keyrings `:stateChange`.
      await this.accountsController.updateAccounts();

      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      // Init multichain accounts after creating internal accounts.
      this.multichainAccountService.init();
      ///: END:ONLY_INCLUDE_IF

      // And we re-init the account tree controller too, to use the
      // newly created accounts.
      // TODO: Remove this once the `accounts-controller` once only
      // depends only on keyrings `:stateChange`.
      this.accountTreeController.init();

      if (completedOnboarding) {
        if (this.isMultichainAccountsFeatureState2Enabled()) {
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          await this.getSnapKeyring();
          ///: END:ONLY_INCLUDE_IF
          await this.accountTreeController.syncWithUserStorageAtLeastOnce();
          await this.discoverAndCreateAccounts();
        } else {
          await this._addAccountsWithBalance();
        }
      }

      if (getIsSeedlessOnboardingFeatureEnabled()) {
        const isSocialLoginFlow =
          this.onboardingController.getIsSocialLoginFlow();
        if (isSocialLoginFlow) {
          // if it's social login flow, update the local backup metadata state of SeedlessOnboarding Controller
          const primaryKeyringId =
            this.keyringController.state.keyrings[0].metadata.id;
          this.seedlessOnboardingController.updateBackupMetadataState({
            keyringId: primaryKeyringId,
            data: seedPhraseAsUint8Array,
            type: SecretType.Mnemonic,
          });

          await this.syncKeyringEncryptionKey();
        }
      }
    } finally {
      releaseLock();
    }
  }

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  async _getMultichainWalletSnapClient(snapId) {
    const keyring = await this.getSnapKeyring();
    const messenger = this.controllerMessenger;

    return new MultichainWalletSnapClient(snapId, keyring, messenger);
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Adds accounts with balances to the keyring.
   *
   * @param {string} keyringId - The Optional ID of the keyring to add the accounts to.
   * @param {boolean} shouldImportSolanaAccount - Whether to import Solana accounts.
   * For the context, we do not need to import the Solana account if the onboarding flow has not completed yet during the social login import flow.
   */
  async _addAccountsWithBalance(keyringId, shouldImportSolanaAccount = true) {
    try {
      // Scan accounts until we find an empty one
      const chainId = this.#getGlobalChainId();

      const keyringSelector = keyringId
        ? { id: keyringId }
        : { type: KeyringTypes.hd };

      const { accounts, entropySource } =
        await this.keyringController.withKeyring(
          keyringSelector,
          async ({ keyring, metadata }) => {
            const keyringAccounts = await keyring.getAccounts();
            return {
              accounts: keyringAccounts,
              entropySource: metadata.id,
            };
          },
        );
      let address = accounts[accounts.length - 1];

      for (let count = accounts.length; ; count++) {
        const balance = await this.getBalance(address, this.provider);

        if (balance === '0x0') {
          // This account has no balance, so check for tokens
          await this.tokenDetectionController.detectTokens({
            chainIds: [chainId],
            selectedAddress: address,
          });

          const tokens =
            this.tokensController.state.allTokens?.[chainId]?.[address];
          const detectedTokens =
            this.tokensController.state.allDetectedTokens?.[chainId]?.[address];

          if (
            (tokens?.length ?? 0) === 0 &&
            (detectedTokens?.length ?? 0) === 0
          ) {
            // This account has no balance or tokens
            if (count !== 1) {
              await this.removeAccount(address);
            }
            break;
          }
        }

        // This account has assets, so check the next one
        address = await this.keyringController.withKeyring(
          keyringSelector,
          async ({ keyring }) => {
            const [newAddress] = await keyring.addAccounts(1);
            return newAddress;
          },
        );
      }

      const discoveredAccounts = {
        Bitcoin: 0,
        Solana: 0,
      };

      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
      const btcClient = await this._getMultichainWalletSnapClient(
        BITCOIN_WALLET_SNAP_ID,
      );
      const btcScope = BtcScope.Mainnet;
      const btcAccounts = await btcClient.discoverAccounts(
        entropySource,
        btcScope,
      );

      discoveredAccounts.Bitcoin = btcAccounts.length;

      // If none accounts got discovered, we still create the first (default) one.
      if (btcAccounts.length === 0) {
        await this._addSnapAccount(entropySource, btcClient, {
          scope: btcScope,
          synchronize: false,
        });
      }
      ///: END:ONLY_INCLUDE_IF

      if (shouldImportSolanaAccount) {
        const solanaClient = await this._getMultichainWalletSnapClient(
          SOLANA_WALLET_SNAP_ID,
        );
        const solScope = SolScope.Mainnet;
        const solanaAccounts = await solanaClient.discoverAccounts(
          entropySource,
          solScope,
        );

        discoveredAccounts.Solana = solanaAccounts.length;

        // If none accounts got discovered, we still create the first (default) one.
        if (solanaAccounts.length === 0) {
          await this._addSnapAccount(entropySource, solanaClient, {
            scope: solScope,
          });
        }
      }

      return discoveredAccounts;
    } catch (e) {
      log.warn(`Failed to add accounts with balance. Error: ${e}`);
      return {
        Bitcoin: 0,
        Solana: 0,
      };
    }
  }

  /**
   * Imports accounts with balances to the keyring.
   */
  async _importAccountsWithBalances() {
    const shouldImportSolanaAccount = true;
    const { keyrings } = this.keyringController.state;

    // walk through all the keyrings and import the solana accounts for the HD keyrings
    for (const { metadata } of keyrings) {
      // check if the keyring is an HD keyring
      const isHdKeyring = await this.keyringController.withKeyring(
        { id: metadata.id },
        async ({ keyring }) => {
          return keyring.type === KeyringTypes.hd;
        },
      );
      if (isHdKeyring) {
        if (this.isMultichainAccountsFeatureState2Enabled()) {
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          await this.getSnapKeyring();
          ///: END:ONLY_INCLUDE_IF
          await this.accountTreeController.syncWithUserStorageAtLeastOnce();
          await this.discoverAndCreateAccounts(metadata.id);
        } else {
          await this._addAccountsWithBalance(
            metadata.id,
            shouldImportSolanaAccount,
          );
        }
      }
    }
  }

  /**
   * Adds Snap account to the keyring.
   *
   * @param {string} keyringId - The ID of the keyring to add the account to.
   * @param {object} client - The Snap client instance.
   * @param {object} options - The options to pass to the createAccount method.
   */
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  async _addSnapAccount(keyringId, client, options = {}) {
    let entropySource = keyringId;
    try {
      if (!entropySource) {
        // Get the entropy source from the first HD keyring
        const id = await this.keyringController.withKeyring(
          { type: KeyringTypes.hd },
          async ({ metadata }) => {
            return metadata.id;
          },
        );
        entropySource = id;
      }

      return await client.createAccount(
        { ...options, entropySource },
        {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        },
      );
    } catch (e) {
      // Do not block the onboarding flow if this fails
      log.warn(`Failed to add Snap account. Error: ${e}`);
      captureException(e);
      return null;
    }
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Encodes a BIP-39 mnemonic as the indices of words in the English BIP-39 wordlist.
   *
   * @param {Buffer} mnemonic - The BIP-39 mnemonic.
   * @returns {Buffer} The Unicode code points for the seed phrase formed from the words in the wordlist.
   */
  _convertMnemonicToWordlistIndices(mnemonic) {
    const indices = mnemonic
      .toString()
      .split(' ')
      .map((word) => wordlist.indexOf(word));
    return new Uint8Array(new Uint16Array(indices).buffer);
  }

  /**
   * Converts a BIP-39 mnemonic stored as indices of words in the English wordlist to a buffer of Unicode code points.
   *
   * @param {Uint8Array} wordlistIndices - Indices to specific words in the BIP-39 English wordlist.
   * @returns {Buffer} The BIP-39 mnemonic formed from the words in the English wordlist, encoded as a list of Unicode code points.
   */
  _convertEnglishWordlistIndicesToCodepoints(wordlistIndices) {
    return Buffer.from(
      Array.from(new Uint16Array(wordlistIndices.buffer))
        .map((i) => wordlist[i])
        .join(' '),
    );
  }

  /**
   * Get an account balance from the AccountTrackerController or request it directly from the network.
   *
   * @param {string} address - The account address
   * @param {Provider} provider - The provider instance to use when asking the network
   */
  async getBalance(address, provider) {
    const accounts =
      this.accountTrackerController.state.accountsByChainId[
        this.#getGlobalChainId()
      ];
    const cached = accounts?.[address];

    if (cached && cached.balance) {
      return cached.balance;
    }

    try {
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return balance || '0x0';
    } catch (error) {
      log.error(error);
      throw error;
    }
  }

  /**
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   */
  async submitPassword(password) {
    await this.submitPasswordOrEncryptionKey({ password });
  }

  /**
   * Submits the user's encryption key and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} encryptionKey - The user's encryption key
   */
  async submitEncryptionKey(encryptionKey) {
    await this.submitPasswordOrEncryptionKey({ encryptionKey });
  }

  /**
   * Attempts to unlock the vault using either the user's password or encryption
   * key. Also synchronizes the preferencesController, to ensure its schema is
   * up to date with known accounts once the vault is decrypted.
   *
   * @param {object} params - The function parameters.
   * @param {string} params.password - The user's password.
   * @param {string} params.encryptionKey - The user's encryption key.
   */
  async submitPasswordOrEncryptionKey({ password, encryptionKey }) {
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();

    // Before attempting to unlock the keyrings, we need the offscreen to have loaded.
    await this.offscreenPromise;

    if (encryptionKey) {
      await this.keyringController.submitEncryptionKey(encryptionKey);
    } else {
      await this.keyringController.submitPassword(password);
      if (isSocialLoginFlow) {
        // unlock the seedless onboarding vault
        await this.seedlessOnboardingController.submitPassword(password);
      }
    }

    try {
      await this.blockTracker.checkForLatestBlock();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    await this.accountsController.updateAccounts();
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    // Init multichain accounts after creating internal accounts.
    this.multichainAccountService.init();
    ///: END:ONLY_INCLUDE_IF
    // Force account-tree refresh after all accounts have been updated.
    this.accountTreeController.init();
  }

  async _loginUser(password) {
    try {
      // Automatic login via config password
      await this.submitPassword(password);

      // Updating accounts in this.accountTrackerController before starting UI syncing ensure that
      // state has account balance before it is synced with UI
      await this.accountTrackerController.updateAccountsAllActiveNetworks();
    } finally {
      this._startUISync();
    }
  }

  _startUISync() {
    // Message startUISync is used to start syncing state with UI
    // Sending this message after login is completed helps to ensure that incomplete state without
    // account details are not flushed to UI.
    this.emit('startUISync');
    this.startUISync = true;
    this.memStore.subscribe(this.sendUpdate.bind(this));
  }

  /**
   * Submits a user's encryption key to log the user in via login token
   */
  async submitEncryptionKeyFromSessionStorage() {
    try {
      const { loginToken, loginSalt } =
        await this.extension.storage.session.get(['loginToken', 'loginSalt']);
      if (loginToken && loginSalt) {
        const { vault } = this.keyringController.state;

        const jsonVault = JSON.parse(vault);

        if (jsonVault.salt !== loginSalt) {
          console.warn(
            'submitEncryptionKey: Stored salt and vault salt do not match',
          );
          await this.clearLoginArtifacts();
          return;
        }

        await this.keyringController.submitEncryptionKey(loginToken, loginSalt);
      }
    } catch (e) {
      // If somehow this login token doesn't work properly,
      // remove it and the user will get shown back to the unlock screen
      await this.clearLoginArtifacts();
      throw e;
    }
  }

  async clearLoginArtifacts() {
    await this.extension.storage.session.remove(['loginToken', 'loginSalt']);
  }

  /**
   * Submits a user's password to check its validity.
   *
   * @param {string} password - The user's password
   */
  async verifyPassword(password) {
    await this.keyringController.verifyPassword(password);
  }

  /**
   * @type Identity
   * @property {string} name - The account nickname.
   * @property {string} address - The account's ethereum address, in lower case.
   * receiving funds from our automatic Ropsten faucet.
   */

  /**
   * Gets the mnemonic of the user's primary keyring.
   */
  getPrimaryKeyringMnemonic() {
    const [keyring] = this.keyringController.getKeyringsByType(
      KeyringType.hdKeyTree,
    );
    if (!keyring.mnemonic) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyring.mnemonic;
  }

  /**
   * Gets the mnemonic seed of the user's primary keyring.
   */
  getPrimaryKeyringMnemonicSeed() {
    const [keyring] = this.keyringController.getKeyringsByType(
      KeyringType.hdKeyTree,
    );
    if (!keyring.seed) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyring.seed;
  }

  //
  // Hardware
  //

  async attemptLedgerTransportCreation() {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger },
      async (keyring) => keyring.attemptMakeApp(),
    );
  }

  /**
   * Fetch account list from a hardware device.
   *
   * @param deviceName
   * @param page
   * @param hdPath
   * @returns [] accounts
   */
  async connectHardware(deviceName, page, hdPath) {
    return this.#withKeyringForDevice(
      { name: deviceName, hdPath },
      async (keyring) => {
        let accounts = [];
        switch (page) {
          case -1:
            accounts = await keyring.getPreviousPage();
            break;
          case 1:
            accounts = await keyring.getNextPage();
            break;
          default:
            accounts = await keyring.getFirstPage();
        }

        // Merge with existing accounts
        // and make sure addresses are not repeated
        const oldAccounts = await this.keyringController.getAccounts();

        const accountsToTrack = [
          ...new Set(
            oldAccounts.concat(accounts.map((a) => a.address.toLowerCase())),
          ),
        ];
        this.accountTrackerController.syncWithAddresses(accountsToTrack);
        return accounts;
      },
    );
  }

  /**
   * Check if the device is unlocked
   *
   * @param deviceName
   * @param hdPath
   * @returns {Promise<boolean>}
   */
  async checkHardwareStatus(deviceName, hdPath) {
    return this.#withKeyringForDevice(
      { name: deviceName, hdPath },
      async (keyring) => {
        return keyring.isUnlocked();
      },
    );
  }

  /**
   * Get hardware type that will be sent for metrics logging.
   *
   * @param {string} address - Address to retrieve the keyring from
   * @returns {HardwareKeyringType} Keyring hardware type
   */
  async getHardwareTypeForMetric(address) {
    return await this.keyringController.withKeyring(
      { address },
      ({ keyring }) => HardwareKeyringType[keyring.type],
    );
  }

  /**
   * Clear
   *
   * @param deviceName
   * @returns {Promise<boolean>}
   */
  async forgetDevice(deviceName) {
    return this.#withKeyringForDevice({ name: deviceName }, async (keyring) => {
      for (const address of await keyring.getAccounts()) {
        this._onAccountRemoved(address);
      }

      keyring.forgetDevice();

      return true;
    });
  }

  /**
   * Retrieves the keyring for the selected address and using the .type returns
   * a subtype for the account. Either 'hardware', 'imported', 'snap', or 'MetaMask'.
   *
   * @param {string} address - Address to retrieve keyring for
   * @returns {'hardware' | 'imported' | 'snap' | 'MetaMask'}
   */
  async getAccountType(address) {
    const keyringType =
      await this.keyringController.getAccountKeyringType(address);
    switch (keyringType) {
      case KeyringType.trezor:
      case KeyringType.oneKey:
      case KeyringType.lattice:
      case KeyringType.qr:
      case KeyringType.ledger:
        return 'hardware';
      case KeyringType.imported:
        return 'imported';
      case KeyringType.snap:
        return 'snap';
      default:
        return 'MetaMask';
    }
  }

  /**
   * Retrieves the keyring for the selected address and using the .type
   * determines if a more specific name for the device is available. Returns
   * undefined for non hardware wallets.
   *
   * @param {string} address - Address to retrieve keyring for
   * @returns {'ledger' | 'lattice' | string | undefined}
   */
  async getDeviceModel(address) {
    return this.keyringController.withKeyring(
      { address },
      async ({ keyring }) => {
        switch (keyring.type) {
          case KeyringType.trezor:
          case KeyringType.oneKey:
            return keyring.getModel();
          case KeyringType.qr:
            return keyring.getName();
          case KeyringType.ledger:
            // TODO: get model after ledger keyring exposes method
            return HardwareDeviceNames.ledger;
          case KeyringType.lattice:
            // TODO: get model after lattice keyring exposes method
            return HardwareDeviceNames.lattice;
          default:
            return undefined;
        }
      },
    );
  }

  /**
   * get hardware account label
   *
   * @param name
   * @param index
   * @param hdPathDescription
   * @returns string label
   */
  getAccountLabel(name, index, hdPathDescription) {
    return `${name[0].toUpperCase()}${name.slice(1)} ${
      parseInt(index, 10) + 1
    } ${hdPathDescription || ''}`.trim();
  }

  /**
   * Imports an account from a Trezor or Ledger device.
   *
   * @param index
   * @param deviceName
   * @param hdPath
   * @param hdPathDescription
   * @returns {} keyState
   */
  async unlockHardwareWalletAccount(
    index,
    deviceName,
    hdPath,
    hdPathDescription,
  ) {
    const { address: unlockedAccount } = await this.#withKeyringForDevice(
      { name: deviceName, hdPath },
      async (keyring) => {
        keyring.setAccountToUnlock(index);
        const [address] = await keyring.addAccounts(1);
        return {
          address: normalize(address),
          label: this.getAccountLabel(
            deviceName === HardwareDeviceNames.qr
              ? keyring.getName()
              : deviceName,
            index,
            hdPathDescription,
          ),
        };
      },
    );
    // Select the account
    this.preferencesController.setSelectedAddress(unlockedAccount);

    const accounts = this.accountsController.listAccounts();

    const { identities } = this.preferencesController.state;
    return { unlockedAccount, identities, accounts };
  }

  //
  // Account Management
  //

  /**
   * Adds a new account to the keyring corresponding to the given `keyringId`,
   * or to the default (first) HD keyring if no `keyringId` is provided.
   *
   * @param {number} accountCount - The number of accounts to create
   * @param {string} _keyringId - The keyring identifier.
   * @returns {Promise<string>} The address of the newly-created account.
   */
  async addNewAccount(accountCount, _keyringId) {
    const oldAccounts = await this.keyringController.getAccounts();
    const keyringSelector = _keyringId
      ? { id: _keyringId }
      : { type: KeyringTypes.hd };

    const addedAccountAddress = await this.keyringController.withKeyring(
      keyringSelector,
      async ({ keyring }) => {
        if (keyring.type !== KeyringTypes.hd) {
          throw new Error('Cannot add account to non-HD keyring');
        }
        const accountsInKeyring = await keyring.getAccounts();

        // Only add an account if the accountCount matches the accounts in the keyring.
        if (accountCount && accountCount !== accountsInKeyring.length) {
          if (accountCount > accountsInKeyring.length) {
            throw new Error('Account out of sequence');
          }

          const existingAccount = accountsInKeyring[accountCount];

          if (!existingAccount) {
            throw new Error(`Can't find account at index ${accountCount}`);
          }

          return existingAccount;
        }

        const [newAddress] = await keyring.addAccounts(1);
        if (oldAccounts.includes(newAddress)) {
          await keyring.removeAccount(newAddress);
          throw new Error(`Cannot add duplicate ${newAddress} account`);
        }
        return newAddress;
      },
    );

    if (!oldAccounts.includes(addedAccountAddress)) {
      this.preferencesController.setSelectedAddress(addedAccountAddress);
    }

    return addedAccountAddress;
  }

  /**
   * Verifies the validity of the current vault's seed phrase.
   *
   * Validity: seed phrase restores the accounts belonging to the current vault.
   *
   * Called when the first account is created and on unlocking the vault.
   *
   * @param {string} password
   * @param {string} _keyringId - This is the identifier for the hd keyring.
   * @returns {Promise<number[]>} The seed phrase to be confirmed by the user,
   * encoded as an array of UTF-8 bytes.
   */
  async getSeedPhrase(password, _keyringId) {
    return this._convertEnglishWordlistIndicesToCodepoints(
      await this.keyringController.exportSeedPhrase(password, _keyringId),
    );
  }

  /**
   * Clears the transaction history, to allow users to force-reset their nonces.
   * Mostly used in development environments, when networks are restarted with
   * the same network ID.
   *
   * @returns {Promise<string>} The current selected address.
   */
  async resetAccount() {
    const selectedAddress =
      this.accountsController.getSelectedAccount().address;

    const globalChainId = this.#getGlobalChainId();

    this.txController.wipeTransactions({
      address: selectedAddress,
      chainId: globalChainId,
    });

    this.smartTransactionsController.wipeSmartTransactions({
      address: selectedAddress,
      ignoreNetwork: false,
    });

    this.bridgeStatusController.wipeBridgeStatus({
      address: selectedAddress,
      ignoreNetwork: false,
    });

    this.networkController.resetConnection();

    return selectedAddress;
  }

  /**
   * Checks that all accounts referenced have a matching InternalAccount. Sends
   * an error to sentry for any accounts that were expected but are missing from the wallet.
   *
   * @param {InternalAccount[]} [internalAccounts] - The list of evm accounts the wallet knows about.
   * @param {Hex[]} [accounts] - The list of evm accounts addresses that should exist.
   */
  captureKeyringTypesWithMissingIdentities(
    internalAccounts = [],
    accounts = [],
  ) {
    const accountsMissingIdentities = accounts.filter(
      (address) =>
        !internalAccounts.some(
          (account) => account.address.toLowerCase() === address.toLowerCase(),
        ),
    );
    const keyringTypesWithMissingIdentities = accountsMissingIdentities.map(
      (address) => this.keyringController.getAccountKeyringType(address),
    );

    const internalAccountCount = internalAccounts.length;

    const accountsForCurrentChain =
      this.accountTrackerController.state.accountsByChainId[
        this.#getGlobalChainId()
      ];

    const accountTrackerCount = Object.keys(
      accountsForCurrentChain || {},
    ).length;

    captureException(
      new Error(
        `Attempt to get permission specifications failed because their were ${accounts.length} accounts, but ${internalAccountCount} identities, and the ${keyringTypesWithMissingIdentities} keyrings included accounts with missing identities. Meanwhile, there are ${accountTrackerCount} accounts in the account tracker.`,
      ),
    );
  }

  /**
   * Sorts a list of evm account addresses by most recently selected by using
   * the lastSelected value for the matching InternalAccount object stored in state.
   *
   * @param {Hex[]} [addresses] - The list of evm accounts addresses to sort.
   * @returns {Hex[]} The sorted evm accounts addresses.
   */
  sortEvmAccountsByLastSelected(addresses) {
    const internalAccounts = this.accountsController.listAccounts();
    return this.sortAddressesWithInternalAccounts(addresses, internalAccounts);
  }

  /**
   * Sorts a list of multichain account addresses by most recently selected by using
   * the lastSelected value for the matching InternalAccount object stored in state.
   *
   * @param {string[]} [addresses] - The list of addresses (not full CAIP-10 Account IDs) to sort.
   * @returns {string[]} The sorted accounts addresses.
   */
  sortMultichainAccountsByLastSelected(addresses) {
    const internalAccounts = this.accountsController.listMultichainAccounts();
    return this.sortAddressesWithInternalAccounts(addresses, internalAccounts);
  }

  /**
   * Sorts a list of addresses by most recently selected by using the lastSelected value for
   * the matching InternalAccount object from the list of internalAccounts provided.
   *
   * @param {string[]} [addresses] - The list of caip accounts addresses to sort.
   * @param {InternalAccount[]} [internalAccounts] - The list of InternalAccounts to determine lastSelected from.
   * @returns {string[]} The sorted accounts addresses.
   */
  sortAddressesWithInternalAccounts(addresses, internalAccounts) {
    return addresses.sort((firstAddress, secondAddress) => {
      const firstAccount = internalAccounts.find(
        (internalAccount) =>
          internalAccount.address.toLowerCase() === firstAddress.toLowerCase(),
      );

      const secondAccount = internalAccounts.find(
        (internalAccount) =>
          internalAccount.address.toLowerCase() === secondAddress.toLowerCase(),
      );

      if (!firstAccount) {
        this.captureKeyringTypesWithMissingIdentities(
          internalAccounts,
          addresses,
        );
        throw new Error(`Missing identity for address: "${firstAddress}".`);
      } else if (!secondAccount) {
        this.captureKeyringTypesWithMissingIdentities(
          internalAccounts,
          addresses,
        );
        throw new Error(`Missing identity for address: "${secondAddress}".`);
      } else if (
        firstAccount.metadata.lastSelected ===
        secondAccount.metadata.lastSelected
      ) {
        return 0;
      } else if (firstAccount.metadata.lastSelected === undefined) {
        return 1;
      } else if (secondAccount.metadata.lastSelected === undefined) {
        return -1;
      }

      return (
        secondAccount.metadata.lastSelected - firstAccount.metadata.lastSelected
      );
    });
  }

  /**
   * Gets the sorted permitted accounts for the specified origin. Returns an empty
   * array if no accounts are permitted.
   *
   * @param {string} origin - The origin whose exposed accounts to retrieve.
   * @returns {string[]} The origin's permitted accounts, or an empty
   * array.
   */
  getPermittedAccounts(origin) {
    let caveat;
    try {
      caveat = this.permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    } catch (err) {
      if (err instanceof PermissionDoesNotExistError) {
        // suppress expected error in case that the origin
        // does not have the target permission yet
        return [];
      }
      throw err;
    }

    const ethAccounts = getEthAccounts(caveat.value);
    return this.sortEvmAccountsByLastSelected(ethAccounts);
  }

  /**
   * Handles Hyperliquid referral approval flow.
   * Shows approval confirmation screen if needed and manages referral URL redirection.
   * This can be triggered by connection permission grants or existing connections.
   *
   * @param {number} tabId - The browser tab ID to update.
   * @param {HyperliquidPermissionTriggerType} triggerType - The trigger type.
   */
  async handleHyperliquidReferral(tabId, triggerType) {
    const isHyperliquidReferralEnabled =
      this.remoteFeatureFlagController?.state?.remoteFeatureFlags
        ?.extensionUxDefiReferral;

    if (!isHyperliquidReferralEnabled) {
      return;
    }

    // Only continue if Hyperliquid has permitted accounts
    const permittedAccounts = this.getPermittedAccounts(HYPERLIQUID_ORIGIN);
    if (permittedAccounts.length === 0) {
      return;
    }

    // Only continue if there is no pending approval
    const hasPendingApproval = this.approvalController.has({
      origin: HYPERLIQUID_ORIGIN,
      type: HYPERLIQUID_APPROVAL_TYPE,
    });

    if (hasPendingApproval) {
      return;
    }

    // First account is the active Hyperliquid account
    const activePermittedAccount = permittedAccounts[0];

    const referralStatusByAccount =
      this.preferencesController.state.referrals.hyperliquid;
    const permittedAccountStatus =
      referralStatusByAccount[activePermittedAccount];
    const declinedAccounts = Object.keys(referralStatusByAccount).filter(
      (account) => referralStatusByAccount[account] === ReferralStatus.Declined,
    );

    // We should show approval screen if the account does not have a status
    const shouldShowApproval = permittedAccountStatus === undefined;

    // We should redirect to the referral url if the account is approved
    const shouldRedirect = permittedAccountStatus === ReferralStatus.Approved;

    if (shouldShowApproval) {
      try {
        const approvalResponse = await this.approvalController.add({
          origin: HYPERLIQUID_ORIGIN,
          type: HYPERLIQUID_APPROVAL_TYPE,
          requestData: { selectedAddress: activePermittedAccount },
          shouldShowRequest:
            triggerType === HyperliquidPermissionTriggerType.NewConnection,
        });

        if (approvalResponse?.approved) {
          this._handleHyperliquidApprovedAccount(
            activePermittedAccount,
            permittedAccounts,
            declinedAccounts,
          );
          await this._handleHyperliquidReferralRedirect(
            tabId,
            activePermittedAccount,
          );
        } else {
          this.preferencesController.addReferralDeclinedAccount(
            activePermittedAccount,
          );
        }
      } catch (error) {
        // Do nothing if the user rejects the request
        if (error.code === errorCodes.provider.userRejectedRequest) {
          return;
        }
        throw error;
      }
    }

    if (shouldRedirect) {
      await this._handleHyperliquidReferralRedirect(
        tabId,
        activePermittedAccount,
      );
    }
  }

  /**
   * Handles redirection to the Hyperliquid referral page.
   *
   * @param {number} tabId - The browser tab ID to update.
   * @param {string} permittedAccount - The permitted account.
   */
  async _handleHyperliquidReferralRedirect(tabId, permittedAccount) {
    await this._updateHyperliquidReferralUrl(tabId);
    // Mark this account as having been shown the Hyperliquid referral page
    this.preferencesController.addReferralPassedAccount(permittedAccount);
  }

  /**
   * Handles referral states for permitted accounts after user approval.
   *
   * @param {string} activePermittedAccount - The active permitted account.
   * @param {string[]} permittedAccounts - The permitted accounts.
   * @param {string[]} declinedAccounts - The previously declined permitted accounts.
   */
  _handleHyperliquidApprovedAccount(
    activePermittedAccount,
    permittedAccounts,
    declinedAccounts,
  ) {
    if (declinedAccounts.length === 0) {
      // If there are no previously declined permitted accounts then
      // we approve all permitted accounts so that the user is not
      // shown the approval screen unnecessarily when switching
      this.preferencesController.setAccountsReferralApproved(permittedAccounts);
    } else {
      this.preferencesController.addReferralApprovedAccount(
        activePermittedAccount,
      );
      // If there are any previously declined accounts then
      // we do not approve them, but instead remove them from the declined list
      // so they have the option to participate again in future
      permittedAccounts.forEach((account) => {
        if (declinedAccounts.includes(account)) {
          this.preferencesController.removeReferralDeclinedAccount(account);
        }
      });
    }
  }

  /**
   * Updates the browser tab URL to the Hyperliquid referral page.
   *
   * @param {number} tabId - The browser tab ID to update.
   */
  async _updateHyperliquidReferralUrl(tabId) {
    try {
      const { url } = await browser.tabs.get(tabId);
      const { search } = new URL(url || '');
      const newUrl = `${HYPERLIQUID_ORIGIN}/join/${METAMASK_REFERRAL_CODE}${search}`;
      await browser.tabs.update(tabId, { url: newUrl });
    } catch (error) {
      log.error('Failed to update URL to Hyperliquid referral page: ', error);
    }
  }

  /**
   * Stops exposing the specified scope to all third parties.
   *
   * @param {string} scopeString - The scope to stop exposing
   * to third parties.
   */
  removeAllScopePermissions(scopeString) {
    this.permissionController.updatePermissionsByCaveat(
      Caip25CaveatType,
      (existingScopes) =>
        Caip25CaveatMutators[Caip25CaveatType].removeScope(
          existingScopes,
          scopeString,
        ),
    );
  }

  /**
   * Stops exposing the account with the specified address to all third parties.
   * Exposed accounts are stored in caveats of the eth_accounts permission. This
   * method uses `PermissionController.updatePermissionsByCaveat` to
   * remove the specified address from every eth_accounts permission. If a
   * permission only included this address, the permission is revoked entirely.
   *
   * @param {string} targetAccount - The address of the account to stop exposing
   * to third parties.
   */
  removeAllAccountPermissions(targetAccount) {
    this.permissionController.updatePermissionsByCaveat(
      Caip25CaveatType,
      (existingScopes) =>
        Caip25CaveatMutators[Caip25CaveatType].removeAccount(
          existingScopes,
          targetAccount,
        ),
    );
  }

  /**
   * Removes an account from state / storage.
   *
   * @param {string} address - A hex address
   */
  async removeAccount(address) {
    this._onAccountRemoved(address);
    await this.keyringController.removeAccount(address);

    return address;
  }

  /**
   * Imports an account with the specified import strategy.
   * These are defined in @metamask/keyring-controller
   * Each strategy represents a different way of serializing an Ethereum key pair.
   *
   * @param {'privateKey' | 'json'} strategy - A unique identifier for an account import strategy.
   * @param {any} args - The data required by that strategy to import an account.
   * @param {object} options - The options for the import.
   * @param {boolean} options.shouldCreateSocialBackup - whether to create a backup for the seedless onboarding flow
   * @param {boolean} options.shouldSelectAccount - whether to select the new account in the wallet
   */
  async importAccountWithStrategy(
    strategy,
    args,
    options = {
      shouldCreateSocialBackup: true,
      shouldSelectAccount: true,
    },
  ) {
    const { shouldCreateSocialBackup, shouldSelectAccount } = options;

    const importedAccountAddress =
      await this.keyringController.importAccountWithStrategy(strategy, args);

    if (this.onboardingController.getIsSocialLoginFlow()) {
      // Use withKeyring to get keyring metadata for an address
      const { id: keyringId, privateKey: privateKeyFromKeyring } =
        await this.keyringController.withKeyring(
          { address: importedAccountAddress },
          async ({ keyring, metadata }) => {
            const privateKey = await keyring.exportAccount(
              importedAccountAddress,
            );
            return { id: metadata.id, privateKey };
          },
        );

      try {
        // if social backup is requested, add the seed phrase backup
        await this.addNewPrivateKeyBackup(
          privateKeyFromKeyring,
          keyringId,
          shouldCreateSocialBackup,
        );
      } catch (err) {
        // handle seedless controller import error by reverting keyring controller mnemonic import
        // KeyringController.removeAccount will remove keyring when it's emptied, currently there are no other method in keyring controller to remove keyring
        await this.keyringController.removeAccount(importedAccountAddress);
        throw err;
      }
    }

    if (shouldSelectAccount) {
      // set new account as selected
      this.preferencesController.setSelectedAddress(importedAccountAddress);
    }
  }

  /**
   * Adds a new private key backup for the user
   *
   * If `syncWithSocial` is false, it will only update the local state,
   * and not sync the private key to the server.
   *
   * @param {string} privateKey - The privateKey from keyring.
   * @param {string} keyringId - The keyring id to add the private key backup to.
   * @param {boolean} syncWithSocial - whether to skip syncing with social login
   */
  async addNewPrivateKeyBackup(privateKey, keyringId, syncWithSocial = true) {
    const bufferedPrivateKey = hexToBytes(add0x(privateKey));

    if (syncWithSocial) {
      const releaseLock = await this.seedlessOperationMutex.acquire();
      try {
        await this.seedlessOnboardingController.addNewSecretData(
          bufferedPrivateKey,
          SecretType.PrivateKey,
          { keyringId },
        );
      } catch (error) {
        log.error('Error adding new private key backup', error);
        throw error;
      } finally {
        releaseLock();
      }
    } else {
      // Do not sync the seed phrase to the server, only update the local state
      this.seedlessOnboardingController.updateBackupMetadataState({
        keyringId,
        data: bufferedPrivateKey,
        type: SecretType.PrivateKey,
      });
    }
  }

  /**
   * Requests approval for permissions for the specified origin
   *
   * @param origin - The origin to request approval for.
   * @param permissions - The permissions to request approval for.
   * @param [options] - Optional. Additional properties to define on the requestData object
   */
  async requestPermissionApproval(origin, permissions, options = {}) {
    const id = nanoid();
    return this.approvalController.addAndShowApprovalRequest({
      id,
      origin,
      requestData: {
        metadata: {
          id,
          origin,
        },
        permissions,
        ...options,
      },
      type: MethodNames.RequestPermissions,
    });
  }

  /**
   * Prompts the user with permittedChains approval for given chainId.
   *
   * @param {string} origin - The origin to request approval for.
   * @param {Hex} chainId - The chainId to add incrementally.
   */
  async requestApprovalPermittedChainsPermission(origin, chainId) {
    const caveatValueWithChains = setPermittedEthChainIds(
      {
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false,
      },
      [chainId],
    );

    await this.permissionController.requestPermissionsIncremental(
      { origin },
      {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: caveatValueWithChains,
            },
          ],
        },
      },
    );
  }

  getNonEvmSupportedMethods(scope) {
    return this.controllerMessenger.call(
      'MultichainRouter:getSupportedMethods',
      scope,
    );
  }

  /**
   * For origins with a solana scope permitted, sends a wallet_notify -> metamask_accountChanged
   * event to fire for the solana scope with the currently selected solana account if any are
   * permitted or empty array otherwise.
   *
   * @param {string} origin - The origin to notify with the current solana account
   */
  notifySolanaAccountChangedForCurrentAccount(origin) {
    let caip25Caveat;
    try {
      caip25Caveat = this.permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    } catch {
      // noop
    }
    if (!caip25Caveat) {
      return;
    }

    // The optional chain operator below shouldn't be needed as
    // the existence of sessionProperties is enforced by the caveat
    // validator, but we are still seeing some instances where it
    // isn't defined in production:
    // https://github.com/MetaMask/metamask-extension/issues/33412
    // This suggests state corruption, but we can't find definitive proof that.
    // For now we are using this patch which is harmless and silences the error in Sentry.
    const solanaAccountsChangedNotifications =
      caip25Caveat.value.sessionProperties?.[
        KnownSessionProperties.SolanaAccountChangedNotifications
      ];

    const sessionScopes = getSessionScopes(caip25Caveat.value, {
      getNonEvmSupportedMethods: this.getNonEvmSupportedMethods.bind(this),
    });

    const solanaScope =
      sessionScopes[MultichainNetworks.SOLANA] ||
      sessionScopes[MultichainNetworks.SOLANA_DEVNET] ||
      sessionScopes[MultichainNetworks.SOLANA_TESTNET];

    if (solanaAccountsChangedNotifications && solanaScope) {
      const { accounts } = solanaScope;
      const parsedPermittedSolanaAddresses = accounts.map((caipAccountId) => {
        const { address } = parseCaipAccountId(caipAccountId);
        return address;
      });

      const [accountAddressToEmit] = this.sortMultichainAccountsByLastSelected(
        parsedPermittedSolanaAddresses,
      );

      if (accountAddressToEmit) {
        this._notifySolanaAccountChange(origin, [accountAddressToEmit]);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Identity Management (signature operations)

  getAddTransactionRequest({
    transactionParams,
    transactionOptions,
    dappRequest,
    ...otherParams
  }) {
    const networkClientId =
      dappRequest?.networkClientId ?? transactionOptions?.networkClientId;
    const { chainId } =
      this.networkController.getNetworkConfigurationByNetworkClientId(
        networkClientId,
      );
    return {
      internalAccounts: this.accountsController.listAccounts(),
      dappRequest,
      networkClientId,
      selectedAccount: this.accountsController.getAccountByAddress(
        transactionParams.from,
      ),
      transactionController: this.txController,
      transactionOptions,
      transactionParams,
      userOperationController: this.userOperationController,
      chainId,
      ppomController: this.ppomController,
      securityAlertsEnabled:
        this.preferencesController.state?.securityAlertsEnabled,
      updateSecurityAlertResponse: this.updateSecurityAlertResponse.bind(this),
      getSecurityAlertResponse:
        this.appStateController.getAddressSecurityAlertResponse.bind(
          this.appStateController,
        ),
      addSecurityAlertResponse:
        this.appStateController.addAddressSecurityAlertResponse.bind(
          this.appStateController,
        ),
      getSecurityAlertsConfig: this.getSecurityAlertsConfig.bind(this),
      ...otherParams,
    };
  }

  //=============================================================================
  // END (VAULT / KEYRING RELATED METHODS)
  //=============================================================================

  /**
   * Allows a user to attempt to cancel a previously submitted transaction
   * by creating a new transaction.
   *
   * @param {number} originalTxId - the id of the txMeta that you want to
   * attempt to cancel
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   * instead of allowing this method to generate them
   * @param options
   * @returns {object} MetaMask state
   */
  async createCancelTransaction(originalTxId, customGasSettings, options) {
    await this.txController.stopTransaction(
      originalTxId,
      customGasSettings,
      options,
    );
    const state = this.getState();
    return state;
  }

  /**
   * Allows a user to attempt to speed up a previously submitted transaction
   * by creating a new transaction.
   *
   * @param {number} originalTxId - the id of the txMeta that you want to
   * attempt to speed up
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   * instead of allowing this method to generate them
   * @param options
   * @returns {object} MetaMask state
   */
  async createSpeedUpTransaction(originalTxId, customGasSettings, options) {
    await this.txController.speedUpTransaction(
      originalTxId,
      customGasSettings,
      options,
    );
    const state = this.getState();
    return state;
  }

  async estimateGas(estimateGasParams) {
    return new Promise((resolve, reject) => {
      this.provider
        .request({
          method: 'eth_estimateGas',
          params: [estimateGasParams],
        })
        .then((result) => resolve(result.toString(16)))
        .catch((err) => reject(err));
    });
  }

  handleWatchAssetRequest = ({ asset, type, origin, networkClientId }) => {
    switch (type) {
      case ERC20:
        return this.tokensController.watchAsset({
          asset,
          type,
          networkClientId,
        });
      case ERC721:
      case ERC1155:
        return this.nftController.watchNft(
          asset,
          type,
          origin,
          networkClientId,
        );
      default:
        throw new Error(`Asset type ${type} not supported`);
    }
  };

  async updateSecurityAlertResponse(
    method,
    securityAlertId,
    securityAlertResponse,
  ) {
    return await updateSecurityAlertResponse({
      appStateController: this.appStateController,
      messenger: this.controllerMessenger,
      method,
      securityAlertId,
      securityAlertResponse,
      signatureController: this.signatureController,
      transactionController: this.txController,
    });
  }

  /**
   * Returns the index of the HD keyring containing the selected account.
   *
   * @returns {number | undefined} The index of the HD keyring containing the selected account.
   */
  getHDEntropyIndex() {
    const selectedAccount = this.accountsController.getSelectedAccount();
    const hdKeyrings = this.keyringController.state.keyrings.filter(
      (keyring) => keyring.type === KeyringTypes.hd,
    );
    const index = hdKeyrings.findIndex((keyring) =>
      keyring.accounts.includes(selectedAccount.address),
    );

    return index === -1 ? undefined : index;
  }

  //=============================================================================
  // PASSWORD MANAGEMENT
  //=============================================================================

  /**
   * Allows a user to begin the seed phrase recovery process.
   */
  markPasswordForgotten() {
    this.preferencesController.setPasswordForgotten(true);
    this.sendUpdate();
  }

  /**
   * Allows a user to end the seed phrase recovery process.
   */
  unMarkPasswordForgotten() {
    this.preferencesController.setPasswordForgotten(false);
    this.sendUpdate();
  }

  //=============================================================================
  // SETUP
  //=============================================================================

  /**
   * A runtime.MessageSender object, as provided by the browser:
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
   * @typedef {object} MessageSender
   * @property {string} - The URL of the page or frame hosting the script that sent the message.
   */

  /**
   * A Snap sender object.
   *
   * @typedef {object} SnapSender
   * @property {string} snapId - The ID of the snap.
   */

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   *
   * @param options - Options bag.
   * @param {ReadableStream} options.connectionStream - The Duplex stream to connect to.
   * @param {MessageSender | SnapSender} options.sender - The sender of the messages on this stream.
   * @param {string} [options.subjectType] - The type of the sender, i.e. subject.
   */
  setupUntrustedCommunicationEip1193({
    connectionStream,
    sender,
    subjectType,
  }) {
    if (sender.url) {
      if (this.onboardingController.state.completedOnboarding) {
        if (this.preferencesController.state.usePhishDetect) {
          const { hostname } = new URL(sender.url);
          this.phishingController.maybeUpdateState();
          // Check if new connection is blocked if phishing detection is on
          const phishingTestResponse = this.phishingController.test(sender.url);
          if (phishingTestResponse?.result) {
            this.sendPhishingWarning(connectionStream, hostname);
            this.metaMetricsController.trackEvent({
              event: MetaMetricsEventName.PhishingPageDisplayed,
              category: MetaMetricsEventCategory.Phishing,
              properties: {
                url: hostname,
              },
            });
            return;
          }
        }
      }
    }

    let inputSubjectType;
    if (subjectType) {
      inputSubjectType = subjectType;
    } else if (sender.id && sender.id !== this.extension.runtime.id) {
      inputSubjectType = SubjectType.Extension;
    } else {
      inputSubjectType = SubjectType.Website;
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream);
    mux.ignoreStream(METAMASK_CAIP_MULTICHAIN_PROVIDER);

    // messages between inpage and background
    this.setupProviderConnectionEip1193(
      mux.createStream(METAMASK_EIP_1193_PROVIDER),
      sender,
      inputSubjectType,
    );

    // TODO:LegacyProvider: Delete
    if (sender.url) {
      // legacy streams
      this.setupPublicConfig(mux.createStream('publicConfig'));
    }
  }

  /**
   * Used to create a CAIP stream for connecting to an untrusted context.
   *
   * @param options - Options bag.
   * @param {ReadableStream} options.connectionStream - The Duplex stream to connect to.
   * @param {MessageSender | SnapSender} options.sender - The sender of the messages on this stream.
   * @param {string} [options.subjectType] - The type of the sender, i.e. subject.
   */
  setupUntrustedCommunicationCaip({ connectionStream, sender, subjectType }) {
    let inputSubjectType;
    if (subjectType) {
      inputSubjectType = subjectType;
    } else if (sender.id && sender.id !== this.extension.runtime.id) {
      inputSubjectType = SubjectType.Extension;
    } else {
      inputSubjectType = SubjectType.Website;
    }

    // messages between subject and background
    this.setupProviderConnectionCaip(
      connectionStream,
      sender,
      inputSubjectType,
    );
  }

  /**
   * Used to create a multiplexed stream for connecting to a trusted context,
   * like our own user interfaces, which have the provider APIs, but also
   * receive the exported API from this controller, which includes trusted
   * functions, like the ability to approve transactions or sign messages.
   *
   * @param {*} connectionStream - The duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupTrustedCommunication(connectionStream, sender) {
    // setup multiplexing
    const mux = setupMultiplex(connectionStream);
    // connect features
    this.setupControllerConnection(mux.createStream('controller'));
    this.setupProviderConnectionEip1193(
      mux.createStream('provider'),
      sender,
      SubjectType.Internal,
    );
  }

  /**
   * Used to create a multiplexed stream for connecting to the phishing warning page.
   *
   * @param options - Options bag.
   * @param {ReadableStream} options.connectionStream - The Duplex stream to connect to.
   */
  setupPhishingCommunication({ connectionStream }) {
    const { usePhishDetect } = this.preferencesController.state;

    if (!usePhishDetect) {
      return;
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream);
    const phishingStream = mux.createStream(PHISHING_SAFELIST);

    // set up postStream transport
    phishingStream.on(
      'data',
      createMetaRPCHandler(
        {
          safelistPhishingDomain: this.safelistPhishingDomain.bind(this),
          backToSafetyPhishingWarning:
            this.backToSafetyPhishingWarning.bind(this),
        },
        phishingStream,
      ),
    );
  }

  setUpCookieHandlerCommunication({ connectionStream }) {
    const {
      metaMetricsId,
      dataCollectionForMarketing,
      participateInMetaMetrics,
    } = this.metaMetricsController.state;

    if (
      metaMetricsId &&
      dataCollectionForMarketing &&
      participateInMetaMetrics
    ) {
      // setup multiplexing
      const mux = setupMultiplex(connectionStream);
      const metamaskCookieHandlerStream = mux.createStream(
        METAMASK_COOKIE_HANDLER,
      );
      // set up postStream transport
      metamaskCookieHandlerStream.on(
        'data',
        createMetaRPCHandler(
          {
            getCookieFromMarketingPage:
              this.getCookieFromMarketingPage.bind(this),
          },
          metamaskCookieHandlerStream,
        ),
      );
    }
  }

  getCookieFromMarketingPage(data) {
    const { ga_client_id: cookieId } = data;
    this.metaMetricsController.setMarketingCampaignCookieId(cookieId);
  }

  /**
   * Called when we detect a suspicious domain. Requests the browser redirects
   * to our anti-phishing page.
   *
   * @private
   * @param {*} connectionStream - The duplex stream to the per-page script,
   * for sending the reload attempt to.
   * @param {string} hostname - The hostname that triggered the suspicion.
   */
  sendPhishingWarning(connectionStream, hostname) {
    const mux = setupMultiplex(connectionStream);
    const phishingStream = mux.createStream('phishing');
    phishingStream.write({ hostname });
  }

  /**
   * A method for providing our API over a stream using JSON-RPC.
   *
   * @param {*} outStream - The stream to provide our API over.
   */
  setupControllerConnection(outStream) {
    const patchStore = new PatchStore(this.memStore);
    let uiReady = false;

    const handleUpdate = () => {
      if (!isStreamWritable(outStream) || !uiReady) {
        return;
      }

      const patches = patchStore.flushPendingPatches();

      outStream.write({
        jsonrpc: '2.0',
        method: 'sendUpdate',
        params: [patches],
      });
    };

    const api = {
      ...this.getApi(),
      ...this.controllerApi,
      startPatches: () => {
        uiReady = true;
        handleUpdate();
      },
      getStatePatches: () => patchStore.flushPendingPatches(),
    };

    this.on('update', handleUpdate);

    // report new active controller connection
    this.activeControllerConnections += 1;
    this.emit('controllerConnectionChanged', this.activeControllerConnections);

    // set up postStream transport
    outStream.on('data', createMetaRPCHandler(api, outStream));

    const startUISync = () => {
      if (!isStreamWritable(outStream)) {
        return;
      }
      // send notification to client-side
      outStream.write({
        jsonrpc: '2.0',
        method: 'startUISync',
      });
    };

    if (this.startUISync) {
      startUISync();
    } else {
      this.once('startUISync', startUISync);
    }

    const outstreamEndHandler = () => {
      if (!outStream.mmFinished) {
        this.activeControllerConnections -= 1;
        this.emit(
          'controllerConnectionChanged',
          this.activeControllerConnections,
        );
        outStream.mmFinished = true;
        this.removeListener('update', handleUpdate);
        patchStore.destroy();
      }
    };

    // The presence of both of the below handlers may be redundant.
    // After upgrading metamask/object-multiples to v2.0.0, which included
    // an upgrade of readable-streams from v2 to v3, we saw that the
    // `outStream.on('end'` handler was almost never being called. This seems to
    // related to how v3 handles errors vs how v2 handles errors; there
    // are "premature close" errors in both cases, although in the case
    // of v2 they don't prevent `outStream.on('end'` from being called.
    // At the time that this comment was committed, it was known that we
    // need to investigate and resolve the underlying error, however,
    // for expediency, we are not addressing them at this time. Instead, we
    // can observe that `readableStream.finished` preserves the same
    // functionality as we had when we relied on readable-stream v2. Meanwhile,
    // the `outStream.on('end')` handler was observed to have been called at least once.
    // In an abundance of caution to prevent against unexpected future behavioral changes in
    // streams implementations, we redundantly use multiple paths to attach the same event handler.
    // The outstreamEndHandler therefore needs to be idempotent, which introduces the `mmFinished` property.

    outStream.mmFinished = false;
    finished(outStream, outstreamEndHandler);
    outStream.once('close', outstreamEndHandler);
    outStream.once('end', outstreamEndHandler);
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   *
   * @param {*} outStream - The stream to provide over.
   * @param {MessageSender | SnapSender} sender - The sender of the messages on this stream
   * @param {SubjectType} subjectType - The type of the sender, i.e. subject.
   */
  setupProviderConnectionEip1193(outStream, sender, subjectType) {
    let origin;
    if (subjectType === SubjectType.Internal) {
      origin = ORIGIN_METAMASK;
    } else if (subjectType === SubjectType.Snap) {
      origin = sender.snapId;
    } else {
      origin = new URL(sender.url).origin;
    }

    if (sender.id && sender.id !== this.extension.runtime.id) {
      this.subjectMetadataController.addSubjectMetadata({
        origin,
        extensionId: sender.id,
        subjectType: SubjectType.Extension,
      });
    }

    let tabId;
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id;
    }

    let mainFrameOrigin = origin;
    if (sender.tab && sender.tab.url) {
      // If sender origin is an iframe, then get the top-level frame's origin
      mainFrameOrigin = new URL(sender.tab.url).origin;
    }

    const engine = this.setupProviderEngineEip1193({
      origin,
      sender,
      subjectType,
      tabId,
      mainFrameOrigin,
    });

    const dupeReqFilterStream = createDupeReqFilterStream();

    // setup connection
    const providerStream = createEngineStream({ engine });

    const connectionId = this.addConnection(origin, {
      tabId,
      apiType: API_TYPE.EIP1193,
      engine,
    });

    pipeline(
      outStream,
      dupeReqFilterStream,
      providerStream,
      outStream,
      (err) => {
        // handle any middleware cleanup
        engine.destroy();
        connectionId && this.removeConnection(origin, connectionId);
        // For context and todos related to the error message match, see https://github.com/MetaMask/metamask-extension/issues/26337
        if (err && !err.message?.match('Premature close')) {
          log.error(err);
        }
      },
    );

    // Used to show wallet liveliness to the provider
    if (subjectType !== SubjectType.Internal) {
      this._notifyChainChangeForConnection({ engine }, origin);
    }
  }

  /**
   * A method for serving our CAIP provider over a given stream.
   *
   * @param {*} outStream - The stream to provide over.
   * @param {MessageSender | SnapSender} sender - The sender of the messages on this stream
   * @param {SubjectType} subjectType - The type of the sender, i.e. subject.
   */
  setupProviderConnectionCaip(outStream, sender, subjectType) {
    let origin;
    if (subjectType === SubjectType.Internal) {
      origin = ORIGIN_METAMASK;
    } else if (subjectType === SubjectType.Snap) {
      origin = sender.snapId;
    } else {
      origin = new URL(sender.url).origin;
    }

    if (sender.id && sender.id !== this.extension.runtime.id) {
      this.subjectMetadataController.addSubjectMetadata({
        origin,
        extensionId: sender.id,
        subjectType: SubjectType.Extension,
      });
    }

    let tabId;
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id;
    }

    const engine = this.setupProviderEngineCaip({
      origin,
      sender,
      subjectType,
      tabId,
    });

    const dupeReqFilterStream = createDupeReqFilterStream();

    // setup connection
    const providerStream = createEngineStream({ engine });

    const connectionId = this.addConnection(origin, {
      tabId,
      apiType: API_TYPE.CAIP_MULTICHAIN,
      engine,
    });

    // solana account changed notifications
    // This delay is needed because it's possible for a dapp to not have listeners
    // setup in time right after a connection is established.
    // This can be resolved if we amend the caip standards to include a liveliness
    // handshake as part of the initial connection.
    setTimeout(
      () => this.notifySolanaAccountChangedForCurrentAccount(origin),
      500,
    );

    pipeline(
      outStream,
      dupeReqFilterStream,
      providerStream,
      outStream,
      (err) => {
        // handle any middleware cleanup
        engine.destroy();
        connectionId && this.removeConnection(origin, connectionId);
        // For context and todos related to the error message match, see https://github.com/MetaMask/metamask-extension/issues/26337
        if (err && !err.message?.match('Premature close')) {
          log.error(err);
        }
      },
    );
  }

  /**
   * Creates middleware hooks that are shared between the Eip1193 and Multichain engines.
   *
   * @private
   * @param {string} origin - The connection's origin string.
   * @returns {object} The shared hooks.
   */
  setupCommonMiddlewareHooks(origin) {
    return {
      // Miscellaneous
      addSubjectMetadata:
        this.subjectMetadataController.addSubjectMetadata.bind(
          this.subjectMetadataController,
        ),
      getProviderState: this.getProviderState.bind(this),
      handleWatchAssetRequest: this.handleWatchAssetRequest.bind(this),
      requestUserApproval:
        this.approvalController.addAndShowApprovalRequest.bind(
          this.approvalController,
        ),
      getCaveat: ({ target, caveatType }) => {
        try {
          return this.permissionController.getCaveat(
            origin,
            target,
            caveatType,
          );
        } catch (e) {
          if (e instanceof PermissionDoesNotExistError) {
            // suppress expected error in case that the origin
            // does not have the target permission yet
          } else {
            throw e;
          }
        }

        return undefined;
      },
      requestPermittedChainsPermissionIncrementalForOrigin: (options) =>
        requestPermittedChainsPermissionIncremental({
          ...options,
          origin,
          hooks: {
            requestPermissionsIncremental:
              this.permissionController.requestPermissionsIncremental.bind(
                this.permissionController,
              ),
            grantPermissionsIncremental:
              this.permissionController.grantPermissionsIncremental.bind(
                this.permissionController,
              ),
          },
        }),

      // Network configuration-related
      addNetwork: this.networkController.addNetwork.bind(
        this.networkController,
      ),
      updateNetwork: this.networkController.updateNetwork.bind(
        this.networkController,
      ),
      setActiveNetwork: async (networkClientId) => {
        // if the origin has the CAIP-25 permission
        // we set per dapp network selection state
        if (
          this.permissionController.hasPermission(
            origin,
            Caip25EndowmentPermissionName,
          )
        ) {
          this.selectedNetworkController.setNetworkClientIdForDomain(
            origin,
            networkClientId,
          );
        } else {
          await this.networkController.setActiveNetwork(networkClientId);
        }
      },
      getNetworkConfigurationByChainId:
        this.networkController.getNetworkConfigurationByChainId.bind(
          this.networkController,
        ),
      setTokenNetworkFilter: (chainId) => {
        const { tokenNetworkFilter } =
          this.preferencesController.getPreferences();
        if (chainId && Object.keys(tokenNetworkFilter).length === 1) {
          this.preferencesController.setPreference('tokenNetworkFilter', {
            [chainId]: true,
          });
        }
      },
      setEnabledNetworks: (chainIds, namespace) => {
        this.networkOrderController.setEnabledNetworks(chainIds, namespace);
      },
      setEnabledNetworksMultichain: (chainIds, namespace) => {
        this.networkOrderController.setEnabledNetworksMultichain(
          chainIds,
          namespace,
        );
      },
      getEnabledNetworks: (namespace) => {
        return (
          this.networkOrderController.state.enabledNetworkMap[namespace] || {}
        );
      },
      getCurrentChainIdForDomain: (domain) => {
        const networkClientId =
          this.selectedNetworkController.getNetworkClientIdForDomain(domain);
        const { chainId } =
          this.networkController.getNetworkConfigurationByNetworkClientId(
            networkClientId,
          );
        return chainId;
      },

      // Web3 shim-related
      getWeb3ShimUsageState: this.alertController.getWeb3ShimUsageState.bind(
        this.alertController,
      ),
      setWeb3ShimUsageRecorded:
        this.alertController.setWeb3ShimUsageRecorded.bind(
          this.alertController,
        ),
      rejectApprovalRequestsForOrigin: () =>
        this.rejectOriginPendingApprovals(origin),
    };
  }

  /**
   * A method for creating an ethereum provider that is safely restricted for the requesting subject.
   *
   * @param {object} options - Provider engine options
   * @param {string} options.origin - The origin of the sender
   * @param {MessageSender | SnapSender} options.sender - The sender object.
   * @param {string} options.subjectType - The type of the sender subject.
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   * @param {mainFrameOrigin} [options.mainFrameOrigin] - The origin of the main frame if the sender is an iframe
   */
  setupProviderEngineEip1193({
    origin,
    subjectType,
    sender,
    tabId,
    mainFrameOrigin,
  }) {
    const engine = new JsonRpcEngine();

    // Append origin to each request
    engine.push(createOriginMiddleware({ origin }));

    // Append mainFrameOrigin to each request if present
    if (mainFrameOrigin) {
      engine.push(createMainFrameOriginMiddleware({ mainFrameOrigin }));
    }

    // Append selectedNetworkClientId to each request
    engine.push(createSelectedNetworkMiddleware(this.controllerMessenger));

    // If the origin is not in the selectedNetworkController's `domains` state
    // when the provider engine is created, the selectedNetworkController will
    // fetch the globally selected networkClient from the networkController and wrap
    // it in a proxy which can be switched to use its own state if/when the origin
    // is added to the `domains` state
    const proxyClient =
      this.selectedNetworkController.getProviderAndBlockTracker(origin);

    // We create the filter and subscription manager middleware now, but they will
    // be inserted into the engine later.
    const filterMiddleware = createFilterMiddleware(proxyClient);
    const subscriptionManager = createSubscriptionManager(proxyClient);
    subscriptionManager.events.on('notification', (message) =>
      engine.emit('notification', message),
    );

    // Append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }));
    }

    engine.push(createLoggerMiddleware({ origin }));
    engine.push(this.permissionLogController.createMiddleware());

    engine.push(createTracingMiddleware());

    engine.push(
      createOriginThrottlingMiddleware({
        getThrottledOriginState:
          this.appStateController.getThrottledOriginState.bind(
            this.appStateController,
          ),
        updateThrottledOriginState:
          this.appStateController.updateThrottledOriginState.bind(
            this.appStateController,
          ),
      }),
    );

    engine.push(
      createPPOMMiddleware(
        this.ppomController,
        this.preferencesController,
        this.networkController,
        this.appStateController,
        this.accountsController,
        this.updateSecurityAlertResponse.bind(this),
        this.getSecurityAlertsConfig.bind(this),
      ),
    );

    engine.push(
      createTrustSignalsMiddleware(
        this.networkController,
        this.appStateController,
        this.phishingController,
        this.preferencesController,
        this.getPermittedAccounts.bind(this),
      ),
    );

    engine.push(
      createRPCMethodTrackingMiddleware({
        getAccountType: this.getAccountType.bind(this),
        getDeviceModel: this.getDeviceModel.bind(this),
        getHDEntropyIndex: this.getHDEntropyIndex.bind(this),
        getHardwareTypeForMetric: this.getHardwareTypeForMetric.bind(this),
        snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
          name: 'SnapAndHardwareMessenger',
          allowedActions: [
            'KeyringController:getKeyringForAccount',
            'SnapController:get',
            'AccountsController:getSelectedAccount',
          ],
        }),
        appStateController: this.appStateController,
        metaMetricsController: this.metaMetricsController,
      }),
    );

    engine.push(createUnsupportedMethodMiddleware());

    if (subjectType === SubjectType.Snap && isSnapPreinstalled(origin)) {
      engine.push(
        createPreinstalledSnapsMiddleware({
          getPermissions: this.permissionController.getPermissions.bind(
            this.permissionController,
            origin,
          ),
          getAllEvmAccounts: () =>
            this.controllerMessenger
              .call('AccountsController:listAccounts')
              .map((account) => account.address),
          grantPermissions: (approvedPermissions) =>
            this.controllerMessenger.call(
              'PermissionController:grantPermissions',
              { approvedPermissions, subject: { origin } },
            ),
        }),
      );
    }

    // Legacy RPC method that needs to be implemented _ahead of_ the permission
    // middleware.
    engine.push(
      createEthAccountsMethodMiddleware({
        getAccounts: this.getPermittedAccounts.bind(this, origin),
      }),
    );

    if (subjectType !== SubjectType.Internal) {
      engine.push(
        this.permissionController.createPermissionMiddleware({
          origin,
        }),
      );

      // Add Hyperliquid permission monitoring middleware
      engine.push(
        createHyperliquidReferralMiddleware(
          this.handleHyperliquidReferral.bind(this),
        ),
      );
    }

    if (subjectType === SubjectType.Website) {
      engine.push(
        createOnboardingMiddleware({
          location: sender.url,
          registerOnboarding: this.onboardingController.registerOnboarding,
        }),
      );
    }

    // EVM requests and eth permissions should not be passed to non-EVM accounts
    // this middleware intercepts these requests and returns an error.
    engine.push(
      createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: this.controllerMessenger.getRestricted({
          name: 'EvmMethodsToNonEvmAccountFilterMessenger',
          allowedActions: ['AccountsController:getSelectedAccount'],
        }),
      }),
    );

    // Unrestricted/permissionless RPC method implementations.
    // They must nevertheless be placed _behind_ the permission middleware.
    engine.push(
      createEip1193MethodMiddleware({
        subjectType,
        ...this.setupCommonMiddlewareHooks(origin),

        // Miscellaneous
        metamaskState: this.getState(),
        sendMetrics: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),

        // Permission-related
        getAccounts: this.getPermittedAccounts.bind(this, origin),
        getCaip25PermissionFromLegacyPermissionsForOrigin: (
          requestedPermissions,
        ) => getCaip25PermissionFromLegacyPermissions(requestedPermissions),
        getPermissionsForOrigin: this.permissionController.getPermissions.bind(
          this.permissionController,
          origin,
        ),

        requestPermissionsForOrigin: (requestedPermissions) =>
          this.permissionController.requestPermissions(
            { origin },
            requestedPermissions,
            {
              metadata: {
                isEip1193Request: true,
              },
            },
          ),
        revokePermissionsForOrigin: (permissionKeys) => {
          try {
            this.permissionController.revokePermissions({
              [origin]: permissionKeys,
            });
          } catch (e) {
            // we dont want to handle errors here because
            // the revokePermissions api method should just
            // return `null` if the permissions were not
            // successfully revoked or if the permissions
            // for the origin do not exist
            console.log(e);
          }
        },

        updateCaveat: this.permissionController.updateCaveat.bind(
          this.permissionController,
          origin,
        ),
        hasApprovalRequestsForOrigin: () =>
          this.approvalController.has({ origin }),
      }),
    );

    engine.push(
      createSnapsMethodMiddleware(subjectType === SubjectType.Snap, {
        clearSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:clearSnapState',
          origin,
        ),
        getUnlockPromise: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'AppStateController:getUnlockPromise',
        ),
        getSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getPermitted',
          origin,
        ),
        requestPermissions: async (requestedPermissions) =>
          await this.permissionController.requestPermissions(
            { origin },
            requestedPermissions,
          ),
        getPermissions: this.permissionController.getPermissions.bind(
          this.permissionController,
          origin,
        ),
        getSnapFile: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getFile',
          origin,
        ),
        getSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getSnapState',
          origin,
        ),
        updateSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:updateSnapState',
          origin,
        ),
        installSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:install',
          origin,
        ),
        invokeSnap: this.permissionController.executeRestrictedMethod.bind(
          this.permissionController,
          origin,
          RestrictedMethods.wallet_snap,
        ),
        getIsLocked: () => {
          const { isUnlocked } = this.controllerMessenger.call(
            'KeyringController:getState',
          );

          return !isUnlocked;
        },
        getIsActive: () => {
          return this._isClientOpen;
        },
        getInterfaceState: (...args) =>
          this.controllerMessenger.call(
            'SnapInterfaceController:getInterface',
            origin,
            ...args,
          ).state,
        getInterfaceContext: (...args) =>
          this.controllerMessenger.call(
            'SnapInterfaceController:getInterface',
            origin,
            ...args,
          ).context,
        createInterface: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapInterfaceController:createInterface',
          origin,
        ),
        updateInterface: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapInterfaceController:updateInterface',
          origin,
        ),
        resolveInterface: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapInterfaceController:resolveInterface',
          origin,
        ),
        getSnap: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:get',
        ),
        trackError: (error) => {
          // `captureException` imported from `@sentry/browser` does not seem to
          // work in E2E tests. This is a workaround which works in both E2E
          // tests and production.
          return global.sentry?.captureException?.(error);
        },
        trackEvent: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
        getAllSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getAll',
        ),
        openWebSocket: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'WebSocketService:open',
          origin,
        ),
        closeWebSocket: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'WebSocketService:close',
          origin,
        ),
        getWebSockets: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'WebSocketService:getAll',
          origin,
        ),
        sendWebSocketMessage: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'WebSocketService:sendMessage',
          origin,
        ),
        getCurrencyRate: (currency) => {
          const rate = this.multichainRatesController.state.rates[currency];
          const { fiatCurrency } = this.multichainRatesController.state;

          if (!rate) {
            return undefined;
          }

          return {
            ...rate,
            currency: fiatCurrency,
          };
        },
        getEntropySources: () => {
          /**
           * @type {KeyringController['state']}
           */
          const state = this.controllerMessenger.call(
            'KeyringController:getState',
          );

          return state.keyrings
            .map((keyring, index) => {
              if (keyring.type === KeyringTypes.hd) {
                return {
                  id: keyring.metadata.id,
                  name: keyring.metadata.name,
                  type: 'mnemonic',
                  primary: index === 0,
                };
              }

              return null;
            })
            .filter(Boolean);
        },
        hasPermission: this.permissionController.hasPermission.bind(
          this.permissionController,
          origin,
        ),
        scheduleBackgroundEvent: (event) =>
          this.controllerMessenger.call('CronjobController:schedule', {
            ...event,
            snapId: origin,
          }),
        cancelBackgroundEvent: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'CronjobController:cancel',
          origin,
        ),
        getBackgroundEvents: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'CronjobController:get',
          origin,
        ),
        getNetworkConfigurationByChainId: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'NetworkController:getNetworkConfigurationByChainId',
        ),
        getNetworkClientById: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'NetworkController:getNetworkClientById',
        ),
        startTrace: (options) => {
          // We intentionally strip out `_isStandaloneSpan` since it can be undefined
          // eslint-disable-next-line no-unused-vars
          const { _isStandaloneSpan, ...result } = trace(options);
          return result;
        },
        endTrace,
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        handleSnapRpcRequest: (args) =>
          this.handleSnapRequest({ ...args, origin }),
        getAllowedKeyringMethods: keyringSnapPermissionsBuilder(
          this.subjectMetadataController,
          origin,
        ),
        ///: END:ONLY_INCLUDE_IF
      }),
    );

    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);

    engine.push(this.metamaskMiddleware);

    engine.push(this.eip5792Middleware);

    engine.push(providerAsMiddleware(proxyClient.provider));

    return engine;
  }

  /**
   * A method for creating a CAIP Multichain provider that is safely restricted for the requesting subject.
   *
   * @param {object} options - Provider engine options
   * @param {string} options.origin - The origin of the sender
   * @param {MessageSender | SnapSender} options.sender - The sender object.
   * @param {string} options.subjectType - The type of the sender subject.
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   */
  setupProviderEngineCaip({ origin, sender, subjectType, tabId }) {
    const engine = new JsonRpcEngine();

    // Append origin to each request
    engine.push(createOriginMiddleware({ origin }));

    // Append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }));
    }

    engine.push(createLoggerMiddleware({ origin }));

    engine.push((req, _res, next, end) => {
      if (
        ![
          MESSAGE_TYPE.WALLET_CREATE_SESSION,
          MESSAGE_TYPE.WALLET_INVOKE_METHOD,
          MESSAGE_TYPE.WALLET_GET_SESSION,
          MESSAGE_TYPE.WALLET_REVOKE_SESSION,
        ].includes(req.method)
      ) {
        return end(rpcErrors.methodNotFound({ data: { method: req.method } }));
      }
      return next();
    });

    engine.push(
      createRPCMethodTrackingMiddleware({
        getAccountType: this.getAccountType.bind(this),
        getDeviceModel: this.getDeviceModel.bind(this),
        getHDEntropyIndex: this.getHDEntropyIndex.bind(this),
        getHardwareTypeForMetric: this.getHardwareTypeForMetric.bind(this),
        snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
          name: 'SnapAndHardwareMessenger',
          allowedActions: [
            'KeyringController:getKeyringForAccount',
            'SnapController:get',
            'AccountsController:getSelectedAccount',
          ],
        }),
        appStateController: this.appStateController,
        metaMetricsController: this.metaMetricsController,
      }),
    );

    engine.push(multichainMethodCallValidatorMiddleware);
    const middlewareMaker = makeMethodMiddlewareMaker([
      walletRevokeSession,
      walletGetSession,
      walletInvokeMethod,
      walletCreateSession,
    ]);

    engine.push(
      middlewareMaker({
        findNetworkClientIdByChainId:
          this.networkController.findNetworkClientIdByChainId.bind(
            this.networkController,
          ),
        listAccounts: this.accountsController.listAccounts.bind(
          this.accountsController,
        ),
        requestPermissionsForOrigin: (requestedPermissions, options = {}) =>
          this.permissionController.requestPermissions(
            { origin },
            requestedPermissions,
            options,
          ),
        getCaveatForOrigin: this.permissionController.getCaveat.bind(
          this.permissionController,
          origin,
        ),
        updateCaveat: this.permissionController.updateCaveat.bind(
          this.permissionController,
          origin,
        ),
        getSelectedNetworkClientId: () =>
          this.networkController.state.selectedNetworkClientId,
        revokePermissionForOrigin:
          this.permissionController.revokePermission.bind(
            this.permissionController,
            origin,
          ),
        getNonEvmSupportedMethods: this.getNonEvmSupportedMethods.bind(this),
        isNonEvmScopeSupported: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'MultichainRouter:isSupportedScope',
        ),
        handleNonEvmRequestForOrigin: (params) =>
          this.controllerMessenger.call('MultichainRouter:handleRequest', {
            ...params,
            origin,
          }),
        getNonEvmAccountAddresses: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'MultichainRouter:getSupportedAccounts',
        ),
        trackSessionCreatedEvent: (approvedCaip25CaveatValue) =>
          this.metaMetricsController.trackEvent({
            event: MetaMetricsEventName.PermissionsRequested,
            properties: {
              api_source: MetaMetricsRequestedThrough.MultichainApi,
              method: MESSAGE_TYPE.WALLET_CREATE_SESSION,
              chain_id_list: getAllScopesFromCaip25CaveatValue(
                approvedCaip25CaveatValue,
              ),
            },
          }),
      }),
    );

    engine.push(
      createUnsupportedMethodMiddleware(
        new Set([
          ...UNSUPPORTED_RPC_METHODS,
          'eth_requestAccounts',
          'eth_accounts',
        ]),
      ),
    );

    if (subjectType === SubjectType.Website) {
      engine.push(
        createOnboardingMiddleware({
          location: sender.url,
          registerOnboarding: this.onboardingController.registerOnboarding,
        }),
      );
    }

    engine.push(
      createMultichainMethodMiddleware({
        subjectType,
        ...this.setupCommonMiddlewareHooks(origin),
      }),
    );
    engine.push(this.metamaskMiddleware);

    engine.push(this.eip5792Middleware);

    try {
      const caip25Caveat = this.permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );

      // add new notification subscriptions for changed authorizations
      const sessionScopes = getSessionScopes(caip25Caveat.value, {
        getNonEvmSupportedMethods: this.getNonEvmSupportedMethods.bind(this),
      });

      // if the eth_subscription notification is in the scope and eth_subscribe is in the methods
      // then get the subscriptionManager going for that scope
      Object.entries(sessionScopes).forEach(([scope, scopeObject]) => {
        if (
          scopeObject.notifications.includes('eth_subscription') &&
          scopeObject.methods.includes('eth_subscribe')
        ) {
          this.addMultichainApiEthSubscriptionMiddleware({
            scope,
            origin,
            tabId,
          });
        }
      });
    } catch (err) {
      // noop
    }

    this.multichainSubscriptionManager.on(
      'notification',
      (targetOrigin, targetTabId, message) => {
        if (origin === targetOrigin && tabId === targetTabId) {
          engine.emit('notification', message);
        }
      },
    );

    engine.push(
      this.multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        tabId,
      ),
    );

    engine.push(async (req, res, _next, end) => {
      const { provider } = this.networkController.getNetworkClientById(
        req.networkClientId,
      );
      res.result = await provider.request(req);
      return end();
    });

    return engine;
  }

  /**
   * TODO:LegacyProvider: Delete
   * A method for providing our public config info over a stream.
   * This includes info we like to be synchronous if possible, like
   * the current selected account, and network ID.
   *
   * Since synchronous methods have been deprecated in web3,
   * this is a good candidate for deprecation.
   *
   * @param {*} outStream - The stream to provide public config over.
   */
  setupPublicConfig(outStream) {
    const configStream = storeAsStream(this.publicConfigStore);

    pipeline(configStream, outStream, (err) => {
      configStream.destroy();
      // For context and todos related to the error message match, see https://github.com/MetaMask/metamask-extension/issues/26337
      if (err && !err.message?.match('Premature close')) {
        log.error(err);
      }
    });
  }

  /**
   * Adds a reference to a connection by origin. Ignores the 'metamask' origin.
   * Caller must ensure that the returned id is stored such that the reference
   * can be deleted later.
   *
   * @param {string} origin - The connection's origin string.
   * @param {object} options - Data associated with the connection
   * @param {object} options.engine - The connection's JSON Rpc Engine
   * @param {number} options.tabId - The tabId for the connection
   * @param {API_TYPE} options.apiType - The API type for the connection
   * @returns {string} The connection's id (so that it can be deleted later)
   */
  addConnection(origin, { tabId, apiType, engine }) {
    if (origin === ORIGIN_METAMASK) {
      return null;
    }

    if (!this.connections[origin]) {
      this.connections[origin] = {};
    }

    const id = nanoid();
    this.connections[origin][id] = {
      tabId,
      apiType,
      engine,
    };

    return id;
  }

  /**
   * Deletes a reference to a connection, by origin and id.
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {string} id - The connection's id, as returned from addConnection.
   */
  removeConnection(origin, id) {
    const connections = this.connections[origin];
    if (!connections) {
      return;
    }

    delete connections[id];

    if (Object.keys(connections).length === 0) {
      delete this.connections[origin];
    }
  }

  /**
   * Closes all connections for the given origin, and removes the references
   * to them.
   * Ignores unknown origins.
   *
   * @param {string} origin - The origin string.
   */
  removeAllConnections(origin) {
    const connections = this.connections[origin];
    if (!connections) {
      return;
    }

    Object.keys(connections).forEach((id) => {
      this.removeConnection(origin, id);
    });
  }

  /**
   * Causes the RPC engines associated with the connections to the given origin
   * to emit a notification event with the given payload.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {unknown} payload - The event payload.
   * @param apiType
   */
  notifyConnections(origin, payload, apiType) {
    const connections = this.connections[origin];
    if (connections) {
      Object.values(connections).forEach((conn) => {
        if (apiType && conn.apiType !== apiType) {
          return;
        }
        if (conn.engine) {
          conn.engine.emit('notification', payload);
        }
      });
    }
  }

  /**
   * Causes the RPC engines associated with all connections to emit a
   * notification event with the given payload.
   *
   * If the "payload" parameter is a function, the payload for each connection
   * will be the return value of that function called with the connection's
   * origin.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * @param {unknown} payload - The event payload, or payload getter function.
   * @param apiType
   */
  notifyAllConnections(payload, apiType) {
    const getPayload =
      typeof payload === 'function'
        ? (origin) => payload(origin)
        : () => payload;

    Object.keys(this.connections).forEach((origin) => {
      Object.values(this.connections[origin]).forEach(async (conn) => {
        if (apiType && conn.apiType !== apiType) {
          return;
        }
        try {
          this.notifyConnection(conn, await getPayload(origin));
        } catch (err) {
          console.error(err);
        }
      });
    });
  }

  /**
   * Causes the RPC engine for passed connection to emit a
   * notification event with the given payload.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * @param {object} connection - Data associated with the connection
   * @param {object} connection.engine - The connection's JSON Rpc Engine
   * @param {unknown} payload - The event payload
   */
  notifyConnection(connection, payload) {
    try {
      if (connection.engine) {
        connection.engine.emit('notification', payload);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // handlers

  /**
   * Handle a KeyringController update
   *
   * @param {object} state - the KC state
   * @returns {Promise<void>}
   * @private
   */
  async _onKeyringControllerUpdate(state) {
    const { keyrings } = state;

    // The accounts tracker only supports EVM addresses and the keyring
    // controller may pass non-EVM addresses, so we filter them out
    const addresses = keyrings
      .reduce((acc, { accounts }) => acc.concat(accounts), [])
      .filter(isEthAddress);

    if (!addresses.length) {
      return;
    }

    this.accountTrackerController.syncWithAddresses(addresses);
  }

  /**
   * Handle global application unlock.
   */
  _onUnlock() {
    this.unMarkPasswordForgotten();

    // In the current implementation, this handler is triggered by a
    // KeyringController event. Other controllers subscribe to the 'unlock'
    // event of the MetaMaskController itself.
    this.emit('unlock');
  }

  /**
   * Handle global application lock.
   */
  _onLock() {
    // In the current implementation, this handler is triggered by a
    // KeyringController event. Other controllers subscribe to the 'lock'
    // event of the MetaMaskController itself.
    this.emit('lock');
  }

  /**
   * Handle memory state updates.
   * - Ensure isClientOpenAndUnlocked is updated
   * - Notifies all connections with the new provider network state
   *   - The external providers handle diffing the state
   *
   * @param newState
   */
  _onStateUpdate(newState) {
    this.isClientOpenAndUnlocked = newState.isUnlocked && this._isClientOpen;
    this._notifyChainChange();
  }

  /**
   * Execute side effects of a removed account.
   *
   * @param {string} address - The address of the account to remove.
   */
  _onAccountRemoved(address) {
    // Remove all associated permissions
    this.removeAllAccountPermissions(address);
  }

  // misc

  /**
   * A method for emitting the full MetaMask state to all registered listeners.
   *
   * @private
   */
  privateSendUpdate() {
    this.emit('update', this.getState());
  }

  /**
   * @returns {boolean} Whether the extension is unlocked.
   */
  isUnlocked() {
    return this.keyringController.state.isUnlocked;
  }

  //=============================================================================
  // MISCELLANEOUS
  //=============================================================================

  getExternalPendingTransactions(address) {
    return this.smartTransactionsController.getTransactions({
      addressFrom: address,
      status: 'pending',
    });
  }

  /**
   * The chain list is fetched live at runtime, falling back to a cache.
   * This preseeds the cache at startup with a static list provided at build.
   */
  async initializeChainlist() {
    const cacheKey = `cachedFetch:${CHAIN_SPEC_URL}`;
    const { cachedResponse } = (await getStorageItem(cacheKey)) || {};
    if (cachedResponse) {
      // Also initialize the known domains when we have chain data cached
      await initializeRpcProviderDomains();
      return;
    }
    await setStorageItem(cacheKey, {
      cachedResponse: rawChainData(),
      // Cached value is immediately invalidated
      cachedTime: 0,
    });
    // Initialize domains after setting the chainlist cache
    await initializeRpcProviderDomains();
  }

  /**
   * Returns the nonce that will be associated with a transaction once approved
   *
   * @param {string} address - The hex string address for the transaction
   * @param networkClientId - The networkClientId to get the nonce lock with
   * @returns {Promise<number>}
   */
  async getPendingNonce(address, networkClientId) {
    const { nonceDetails, releaseLock } = await this.txController.getNonceLock(
      address,
      networkClientId,
    );

    const pendingNonce = nonceDetails.params.highestSuggested;

    releaseLock();
    return pendingNonce;
  }

  /**
   * Returns the next nonce according to the nonce-tracker
   *
   * @param {string} address - The hex string address for the transaction
   * @param networkClientId - The networkClientId to get the nonce lock with
   * @returns {Promise<number>}
   */
  async getNextNonce(address, networkClientId) {
    const nonceLock = await this.txController.getNonceLock(
      address,
      networkClientId,
    );
    nonceLock.releaseLock();
    return nonceLock.nextNonce;
  }

  /**
   * Throw an artificial error in a timeout handler for testing purposes.
   *
   * @param message - The error message.
   * @deprecated This is only meant to facilitate manual and E2E testing. We should not
   * use this for handling errors.
   */
  throwTestError(message) {
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'TestError';
      throw error;
    });
  }

  /**
   * Capture an artificial error in a timeout handler for testing purposes.
   *
   * @param message - The error message.
   * @deprecated This is only meant to facilitate manual and E2E tests testing. We should not
   * use this for handling errors.
   */
  captureTestError(message) {
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'TestError';
      captureException(error);
    });
  }

  getTransactionMetricsRequest() {
    const controllerActions = {
      // Metametrics Actions
      createEventFragment: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:createEventFragment',
      ),
      finalizeEventFragment: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:finalizeEventFragment',
      ),
      getEventFragmentById: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:getEventFragmentById',
      ),
      getParticipateInMetrics: () =>
        this.controllerMessenger.call('MetaMetricsController:getState')
          .participateInMetaMetrics,
      trackEvent: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:trackEvent',
      ),
      updateEventFragment: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'MetaMetricsController:updateEventFragment',
      ),
      // Other dependencies
      getAccountBalance: (account, chainId) =>
        this.accountTrackerController.state.accountsByChainId?.[chainId]?.[
          account
        ]?.balance,
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      getHardwareTypeForMetric: this.getHardwareTypeForMetric.bind(this),
      getEIP1559GasFeeEstimates: (...args) =>
        this.gasFeeController.fetchGasFeeEstimates(...args),
      getSelectedAddress: () =>
        this.accountsController.getSelectedAccount().address,
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),
      getTransaction: (id) =>
        this.txController.state.transactions.find((tx) => tx.id === id),
      getIsSmartTransaction: (chainId) => {
        return getIsSmartTransaction(this._getMetaMaskState(), chainId);
      },
      getSmartTransactionByMinedTxHash: (txHash) => {
        return this.smartTransactionsController.getSmartTransactionByMinedTxHash(
          txHash,
        );
      },
      getMethodData: (data) => {
        if (!data) {
          return null;
        }
        const { knownMethodData, use4ByteResolution } =
          this.preferencesController.state;
        const prefixedData = addHexPrefix(data);
        return getMethodDataName(
          knownMethodData,
          use4ByteResolution,
          prefixedData,
          this.preferencesController.addKnownMethodData.bind(
            this.preferencesController,
          ),
          this.provider,
        );
      },
      getIsConfirmationAdvancedDetailsOpen: () => {
        return this.preferencesController.state.preferences
          .showConfirmationAdvancedDetails;
      },
      getHDEntropyIndex: this.getHDEntropyIndex.bind(this),
      getNetworkRpcUrl: (chainId) => {
        // TODO: Move to @metamask/network-controller
        try {
          const networkClientId =
            this.networkController.findNetworkClientIdByChainId(chainId);
          const networkConfig =
            this.networkController.getNetworkConfigurationByNetworkClientId(
              networkClientId,
            );

          // Try direct rpcUrl property first
          if (networkConfig.rpcUrl) {
            return networkConfig.rpcUrl;
          }

          // Try rpcEndpoints array
          if (networkConfig.rpcEndpoints?.length > 0) {
            const defaultEndpointIndex =
              networkConfig.defaultRpcEndpointIndex || 0;
            return (
              networkConfig.rpcEndpoints[defaultEndpointIndex]?.url ||
              networkConfig.rpcEndpoints[0].url
            );
          }

          return 'unknown';
        } catch (error) {
          console.error('Error getting RPC URL:', error);
          return 'unknown';
        }
      },
    };

    return {
      ...controllerActions,
      snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
        name: 'SnapAndHardwareMessenger',
        allowedActions: [
          'KeyringController:getKeyringForAccount',
          'SnapController:get',
          'AccountsController:getSelectedAccount',
        ],
      }),
      provider: this.controllerMessenger.call(
        'NetworkController:getSelectedNetworkClient',
      )?.provider,
    };
  }

  updateAccountBalanceForTransactionNetwork(transactionMeta) {
    const {
      networkClientId,
      txParams: { from },
    } = transactionMeta;
    this.accountTrackerController.updateAccountByAddress({
      address: from,
      networkClientId,
    });
  }

  toggleExternalServices(useExternal) {
    this.preferencesController.toggleExternalServices(useExternal);
    this.tokenListController.updatePreventPollingOnNetworkRestart(!useExternal);
    if (useExternal) {
      this.tokenDetectionController.enable();
      this.gasFeeController.enableNonRPCGasFeeApis();
    } else {
      this.tokenDetectionController.disable();
      this.gasFeeController.disableNonRPCGasFeeApis();
    }
  }

  //=============================================================================
  // CONFIG
  //=============================================================================

  /**
   * Sets the Ledger Live preference to use for Ledger hardware wallet support
   *
   * @param keyring
   * @deprecated This method is deprecated and will be removed in the future.
   * Only webhid connections are supported in chrome and u2f in firefox.
   */
  async setLedgerTransportPreference(keyring) {
    const transportType = window.navigator.hid
      ? LedgerTransportTypes.webhid
      : LedgerTransportTypes.u2f;

    if (keyring?.updateTransportMethod) {
      return keyring.updateTransportMethod(transportType).catch((e) => {
        throw e;
      });
    }

    return undefined;
  }

  /**
   * A method for initializing storage the first time.
   *
   * @param {object} initState - The default state to initialize with.
   * @private
   */
  recordFirstTimeInfo(initState) {
    if (!('firstTimeInfo' in initState)) {
      const version = process.env.METAMASK_VERSION;
      initState.firstTimeInfo = {
        version,
        date: Date.now(),
      };
    }
  }

  // TODO: Replace isClientOpen methods with `controllerConnectionChanged` events.
  /* eslint-disable accessor-pairs */
  /**
   * A method for recording whether the MetaMask user interface is open or not.
   *
   * @param {boolean} open
   */
  set isClientOpen(open) {
    this._isClientOpen = open;

    // Notify Snaps that the client is open or closed.
    this.controllerMessenger.call('SnapController:setClientActive', open);
  }
  /* eslint-enable accessor-pairs */

  /**
   * A method that is called by the background when all instances of metamask are closed.
   * Currently used to stop controller polling.
   */
  onClientClosed() {
    try {
      this.gasFeeController.stopAllPolling();
      this.currencyRateController.stopAllPolling();
      this.tokenRatesController.stopAllPolling();
      this.tokenDetectionController.stopAllPolling();
      this.tokenListController.stopAllPolling();
      this.tokenBalancesController.stopAllPolling();
      this.appStateController.clearPollingTokens();
      this.accountTrackerController.stopAllPolling();
      this.deFiPositionsController.stopAllPolling();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * A method that is called by the background when a particular environment type is closed (fullscreen, popup, notification).
   * Currently used to stop polling controllers for only that environement type
   *
   * @param environmentType
   */
  onEnvironmentTypeClosed(environmentType) {
    const appStatePollingTokenType =
      POLLING_TOKEN_ENVIRONMENT_TYPES[environmentType];
    const pollingTokensToDisconnect =
      this.appStateController.state[appStatePollingTokenType];
    pollingTokensToDisconnect.forEach((pollingToken) => {
      // We don't know which controller the token is associated with, so try them all.
      // Consider storing the tokens per controller in state instead.
      this.gasFeeController.stopPollingByPollingToken(pollingToken);
      this.currencyRateController.stopPollingByPollingToken(pollingToken);
      this.tokenRatesController.stopPollingByPollingToken(pollingToken);
      this.tokenDetectionController.stopPollingByPollingToken(pollingToken);
      this.tokenListController.stopPollingByPollingToken(pollingToken);
      this.tokenBalancesController.stopPollingByPollingToken(pollingToken);
      this.accountTrackerController.stopPollingByPollingToken(pollingToken);
      this.appStateController.removePollingToken(
        pollingToken,
        appStatePollingTokenType,
      );
    });
  }

  /**
   * Adds a domain to the PhishingController safelist
   *
   * @param {string} origin - the domain to safelist
   */
  safelistPhishingDomain(origin) {
    const isFirefox = getPlatform() === PLATFORM_FIREFOX;
    if (!isFirefox) {
      this.metaMetricsController.trackEvent(
        {
          category: MetaMetricsEventCategory.Phishing,
          event: MetaMetricsEventName.ProceedAnywayClicked,
          properties: {
            url: origin,
            referrer: {
              url: origin,
            },
          },
        },
        {
          excludeMetaMetricsId: true,
        },
      );
    }

    return this.phishingController.bypass(origin);
  }

  async backToSafetyPhishingWarning() {
    const portfolioBaseURL = process.env.PORTFOLIO_URL;
    const portfolioURL = `${portfolioBaseURL}/?metamaskEntry=phishing_page_portfolio_button`;

    this.metaMetricsController.trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PortfolioLinkClicked,
      properties: {
        location: 'phishing_page',
        text: 'Back to safety',
      },
    });

    await this.platform.switchToAnotherURL(undefined, portfolioURL);
  }

  /**
   * Locks MetaMask
   *
   * @param {object} options - The options for setting the locked state.
   * @param {boolean} options.skipSeedlessOperationLock - If true, the seedless operation mutex will not be locked.
   */
  async setLocked(options = { skipSeedlessOperationLock: false }) {
    const { skipSeedlessOperationLock } = options;
    const isSocialLoginFlow = this.onboardingController.getIsSocialLoginFlow();

    let releaseLock;
    if (isSocialLoginFlow && !skipSeedlessOperationLock) {
      releaseLock = await this.seedlessOperationMutex.acquire();
    }

    try {
      if (isSocialLoginFlow) {
        await this.seedlessOnboardingController.setLocked();
      }
      await this.keyringController.setLocked();
    } catch (error) {
      log.error('Error setting locked state', error);
      throw error;
    } finally {
      if (releaseLock) {
        releaseLock();
      }
    }
  }

  removePermissionsFor = (subjects) => {
    try {
      this.permissionController.revokePermissions(subjects);
    } catch (exp) {
      if (!(exp instanceof PermissionsRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  updateCaveat = (origin, target, caveatType, caveatValue) => {
    try {
      this.controllerMessenger.call(
        'PermissionController:updateCaveat',
        origin,
        target,
        caveatType,
        caveatValue,
      );
    } catch (exp) {
      if (!(exp instanceof PermissionsRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  updateNetworksList = (chainIds) => {
    try {
      this.networkOrderController.updateNetworksList(chainIds);
    } catch (err) {
      log.error(err.message);
      throw err;
    }
  };

  updateAccountsList = (pinnedAccountList) => {
    try {
      this.accountOrderController.updateAccountsList(pinnedAccountList);
    } catch (err) {
      log.error(err.message);
      throw err;
    }
  };

  setEnabledNetworks = (chainIds, networkId) => {
    try {
      this.networkOrderController.setEnabledNetworks(chainIds, networkId);
    } catch (err) {
      log.error(err.message);
      throw err;
    }
  };

  setEnabledNetworksMultichain = (chainIds, namespace) => {
    try {
      this.networkOrderController.setEnabledNetworksMultichain(
        chainIds,
        namespace,
      );
    } catch (err) {
      log.error(err.message);
      throw err;
    }
  };

  updateHiddenAccountsList = (hiddenAccountList) => {
    try {
      this.accountOrderController.updateHiddenAccountsList(hiddenAccountList);
    } catch (err) {
      log.error(err.message);
      throw err;
    }
  };

  rejectPermissionsRequest = (requestId) => {
    try {
      this.permissionController.rejectPermissionsRequest(requestId);
    } catch (exp) {
      if (!(exp instanceof PermissionsRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  acceptPermissionsRequest = (request) => {
    try {
      this.permissionController.acceptPermissionsRequest(request);
    } catch (exp) {
      if (!(exp instanceof PermissionsRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  resolvePendingApproval = async (id, value, options) => {
    try {
      await this.approvalController.accept(id, value, options);
    } catch (exp) {
      if (!(exp instanceof ApprovalRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  rejectPendingApproval = (id, error) => {
    try {
      this.approvalController.reject(
        id,
        new JsonRpcError(error.code, error.message, error.data),
      );
    } catch (exp) {
      if (!(exp instanceof ApprovalRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  rejectAllPendingApprovals() {
    const deleteInterface = (id) =>
      this.controllerMessenger.call(
        'SnapInterfaceController:deleteInterface',
        id,
      );

    rejectAllApprovals({
      approvalController: this.approvalController,
      deleteInterface,
    });
  }

  async getCode(address, networkClientId) {
    const { provider } =
      this.networkController.getNetworkClientById(networkClientId);

    return await provider.request({
      method: 'eth_getCode',
      params: [address],
    });
  }

  async _onAccountChange(newAddress) {
    const permittedAccountsMap = getPermittedAccountsByOrigin(
      this.permissionController.state,
    );

    for (const [origin, accounts] of permittedAccountsMap.entries()) {
      if (accounts.includes(newAddress)) {
        this._notifyAccountsChange(origin, accounts);
      }
    }
  }

  _notifyAccountsChange(origin, newAccounts) {
    this.notifyConnections(
      origin,
      {
        method: NOTIFICATION_NAMES.accountsChanged,
        // This should be the same as the return value of `eth_accounts`,
        // namely an array of the current / most recently selected Ethereum
        // account.
        params:
          newAccounts.length < 2
            ? // If the length is 1 or 0, the accounts are sorted by definition.
              newAccounts
            : // If the length is 2 or greater, we have to execute
              // `eth_accounts` vi this method.
              this.getPermittedAccounts(origin),
      },
      API_TYPE.EIP1193,
    );

    this.permissionLogController.updateAccountsHistory(origin, newAccounts);
  }

  async _notifyAuthorizationChange(origin, newAuthorization) {
    this.notifyConnections(
      origin,
      {
        method: MultichainApiNotifications.sessionChanged,
        params: {
          sessionScopes: getSessionScopes(newAuthorization, {
            getNonEvmSupportedMethods:
              this.getNonEvmSupportedMethods.bind(this),
          }),
        },
      },
      API_TYPE.CAIP_MULTICHAIN,
    );
  }

  async _notifySolanaAccountChange(origin, accountAddressArray) {
    this.notifyConnections(
      origin,
      {
        method: MultichainApiNotifications.walletNotify,
        params: {
          scope: MultichainNetworks.SOLANA,
          notification: {
            method: NOTIFICATION_NAMES.accountsChanged,
            params: accountAddressArray,
          },
        },
      },
      API_TYPE.CAIP_MULTICHAIN,
    );
  }

  async _notifyChainChange() {
    this.notifyAllConnections(
      async (origin) => ({
        method: NOTIFICATION_NAMES.chainChanged,
        params: await this.getProviderNetworkState({ origin }),
      }),
      API_TYPE.EIP1193,
    );
  }

  async _notifyChainChangeForConnection(connection, origin) {
    this.notifyConnection(connection, {
      method: NOTIFICATION_NAMES.chainChanged,
      params: await this.getProviderNetworkState({ origin }),
    });
  }

  /**
   * @deprecated
   * Controllers should subscribe to messenger events internally rather than relying on the client.
   * @param transactionMeta - Metadata for the transaction.
   */
  async _onFinishedTransaction(transactionMeta) {
    if (
      ![TransactionStatus.confirmed, TransactionStatus.failed].includes(
        transactionMeta.status,
      )
    ) {
      return;
    }
    const startTime = performance.now();

    const traceContext = trace({
      name: TraceName.OnFinishedTransaction,
      startTime: performance.timeOrigin,
    });

    trace({
      name: TraceName.OnFinishedTransaction,
      startTime: performance.timeOrigin,
      parentContext: traceContext,
      data: {
        transactionMeta,
      },
    });

    await this._createTransactionNotifcation(transactionMeta);
    await this._updateNFTOwnership(transactionMeta);
    this._trackTransactionFailure(transactionMeta);
    await this.tokenBalancesController.updateBalances({
      chainIds: [transactionMeta.chainId],
    });
    endTrace({
      name: TraceName.OnFinishedTransaction,
      timestamp: performance.timeOrigin + startTime,
    });
  }

  async _createTransactionNotifcation(transactionMeta) {
    const { chainId } = transactionMeta;
    let rpcPrefs = {};

    if (chainId) {
      const networkConfiguration =
        this.networkController.state.networkConfigurationsByChainId?.[chainId];

      const blockExplorerUrl =
        networkConfiguration?.blockExplorerUrls?.[
          networkConfiguration?.defaultBlockExplorerUrlIndex
        ];

      rpcPrefs = { blockExplorerUrl };
    }

    try {
      await this.platform.showTransactionNotification(
        transactionMeta,
        rpcPrefs,
      );
    } catch (error) {
      log.error('Failed to create transaction notification', error);
    }
  }

  async _updateNFTOwnership(transactionMeta) {
    // if this is a transferFrom method generated from within the app it may be an NFT transfer transaction
    // in which case we will want to check and update ownership status of the transferred NFT.

    const { type, txParams, chainId, txReceipt } = transactionMeta;
    const selectedAddress =
      this.accountsController.getSelectedAccount().address;

    const { allNfts } = this.nftController.state;
    const txReceiptLogs = txReceipt?.logs;

    const isContractInteractionTx =
      type === TransactionType.contractInteraction && txReceiptLogs;
    const isTransferFromTx =
      (type === TransactionType.tokenMethodTransferFrom ||
        type === TransactionType.tokenMethodSafeTransferFrom) &&
      txParams !== undefined;

    if (!isContractInteractionTx && !isTransferFromTx) {
      return;
    }

    const networkClientId =
      this.networkController?.state?.networkConfigurationsByChainId?.[chainId]
        ?.rpcEndpoints[
        this.networkController?.state?.networkConfigurationsByChainId?.[chainId]
          ?.defaultRpcEndpointIndex
      ]?.networkClientId;

    if (isTransferFromTx) {
      const { data, to: contractAddress, from: userAddress } = txParams;
      const transactionData = parseStandardTokenTransactionData(data);
      // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
      // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
      // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
      const transactionDataTokenId =
        getTokenIdParam(transactionData) ?? getTokenValueParam(transactionData);

      // check if its a known NFT
      const knownNft = allNfts?.[userAddress]?.[chainId]?.find(
        ({ address, tokenId }) =>
          isEqualCaseInsensitive(address, contractAddress) &&
          tokenId === transactionDataTokenId,
      );

      // if it is we check and update ownership status.
      if (knownNft) {
        this.nftController.checkAndUpdateSingleNftOwnershipStatus(
          knownNft,
          false,
          networkClientId,
          // TODO add networkClientId once it is available in the transactionMeta
          // the chainId previously passed here didn't actually allow us to check for ownership on a non globally selected network
          // because the check would use the provider for the globally selected network, not the chainId passed here.
          { userAddress },
        );
      }
    } else {
      // Else if contract interaction we will parse the logs

      const allNftTransferLog = txReceiptLogs.map((txReceiptLog) => {
        const isERC1155NftTransfer =
          txReceiptLog.topics &&
          txReceiptLog.topics[0] === TRANSFER_SINFLE_LOG_TOPIC_HASH;
        const isERC721NftTransfer =
          txReceiptLog.topics &&
          txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH;
        let isTransferToSelectedAddress;

        if (isERC1155NftTransfer) {
          isTransferToSelectedAddress =
            txReceiptLog.topics &&
            txReceiptLog.topics[3] &&
            txReceiptLog.topics[3].match(selectedAddress?.slice(2));
        }

        if (isERC721NftTransfer) {
          isTransferToSelectedAddress =
            txReceiptLog.topics &&
            txReceiptLog.topics[2] &&
            txReceiptLog.topics[2].match(selectedAddress?.slice(2));
        }

        return {
          isERC1155NftTransfer,
          isERC721NftTransfer,
          isTransferToSelectedAddress,
          ...txReceiptLog,
        };
      });
      if (allNftTransferLog.length !== 0) {
        const allNftParsedLog = [];
        allNftTransferLog.forEach((singleLog) => {
          if (
            singleLog.isTransferToSelectedAddress &&
            (singleLog.isERC1155NftTransfer || singleLog.isERC721NftTransfer)
          ) {
            let iface;
            if (singleLog.isERC1155NftTransfer) {
              iface = new Interface(abiERC1155);
            } else {
              iface = new Interface(abiERC721);
            }
            try {
              const parsedLog = iface.parseLog({
                data: singleLog.data,
                topics: singleLog.topics,
              });
              allNftParsedLog.push({
                contract: singleLog.address,
                ...parsedLog,
              });
            } catch (err) {
              // ignore
            }
          }
        });
        // Filter known nfts and new Nfts
        const knownNFTs = [];
        const newNFTs = [];
        allNftParsedLog.forEach((single) => {
          const tokenIdFromLog = getTokenIdParam(single);
          const existingNft = allNfts?.[selectedAddress]?.[chainId]?.find(
            ({ address, tokenId }) => {
              return (
                isEqualCaseInsensitive(address, single.contract) &&
                tokenId === tokenIdFromLog
              );
            },
          );
          if (existingNft) {
            knownNFTs.push(existingNft);
          } else {
            newNFTs.push({
              tokenId: tokenIdFromLog,
              ...single,
            });
          }
        });
        // For known nfts only refresh ownership
        const refreshOwnershipNFts = knownNFTs.map(async (singleNft) => {
          return this.nftController.checkAndUpdateSingleNftOwnershipStatus(
            singleNft,
            false,
            networkClientId,
            // TODO add networkClientId once it is available in the transactionMeta
            // the chainId previously passed here didn't actually allow us to check for ownership on a non globally selected network
            // because the check would use the provider for the globally selected network, not the chainId passed here.
            { selectedAddress },
          );
        });
        await Promise.allSettled(refreshOwnershipNFts);
        // For new nfts, add them to state
        const addNftPromises = newNFTs.map(async (singleNft) => {
          return this.nftController.addNft(
            singleNft.contract,
            singleNft.tokenId,
            networkClientId,
          );
        });
        await Promise.allSettled(addNftPromises);
      }
    }
  }

  _trackTransactionFailure(transactionMeta) {
    const { txReceipt } = transactionMeta;
    const metamaskState = this.getState();
    const { allTokens } = this.tokensController.state;
    const selectedAccount = this.accountsController.getSelectedAccount();
    const tokens =
      allTokens?.[transactionMeta.chainId]?.[selectedAccount.address] || [];

    if (!txReceipt || txReceipt.status !== '0x0') {
      return;
    }

    this.metaMetricsController.trackEvent(
      {
        event: 'Tx Status Update: On-Chain Failure',
        category: MetaMetricsEventCategory.Background,
        properties: {
          action: 'Transactions',
          errorMessage: transactionMeta.simulationFails?.reason,
          numberOfTokens: tokens.length,
          // TODO: remove this once we have migrated to the new account balances state
          numberOfAccounts: Object.keys(metamaskState.accounts).length,
        },
      },
      {
        matomoEvent: true,
      },
    );
  }

  _onUserOperationAdded(userOperationMeta) {
    const transactionMeta = this.txController.state.transactions.find(
      (tx) => tx.id === userOperationMeta.id,
    );

    if (!transactionMeta) {
      return;
    }

    if (transactionMeta.type === TransactionType.swap) {
      this.controllerMessenger.publish(
        'TransactionController:transactionNewSwap',
        { transactionMeta },
      );
    } else if (transactionMeta.type === TransactionType.swapApproval) {
      this.controllerMessenger.publish(
        'TransactionController:transactionNewSwapApproval',
        { transactionMeta },
      );
    }
  }

  _onUserOperationTransactionUpdated(transactionMeta) {
    const updatedTransactionMeta = {
      ...transactionMeta,
      txParams: {
        ...transactionMeta.txParams,
        from: this.accountsController.getSelectedAccount().address,
      },
    };

    const transactionExists = this.txController.state.transactions.some(
      (tx) => tx.id === updatedTransactionMeta.id,
    );

    if (!transactionExists) {
      this.txController.update((state) => {
        state.transactions.push(updatedTransactionMeta);
      });
    }

    this.txController.updateTransaction(
      updatedTransactionMeta,
      'Generated from user operation',
    );

    this.controllerMessenger.publish(
      'TransactionController:transactionStatusUpdated',
      { transactionMeta: updatedTransactionMeta },
    );
  }

  _getMetaMaskState() {
    return {
      metamask: this.getState(),
    };
  }

  /**
   * Select a hardware wallet device and execute a
   * callback with the keyring for that device.
   *
   * Note that KeyringController state is not updated before
   * the end of the callback execution, and calls to KeyringController
   * methods within the callback can lead to deadlocks.
   *
   * @param {object} options - The options for the device
   * @param {string} options.name - The device name to select
   * @param {string} options.hdPath - An optional hd path to be set on the device
   * keyring
   * @param {*} callback - The callback to execute with the keyring
   * @returns {*} The result of the callback
   */
  async #withKeyringForDevice(options, callback) {
    const keyringOverrides = this.opts.overrides?.keyrings;
    let keyringType = null;
    switch (options.name) {
      case HardwareDeviceNames.trezor:
        keyringType = keyringOverrides?.trezor?.type || TrezorKeyring.type;
        break;
      case HardwareDeviceNames.oneKey:
        keyringType = keyringOverrides?.oneKey?.type || OneKeyKeyring?.type;
        break;
      case HardwareDeviceNames.ledger:
        keyringType = keyringOverrides?.ledger?.type || LedgerKeyring.type;
        break;
      case HardwareDeviceNames.qr:
        keyringType = QrKeyring.type;
        break;
      case HardwareDeviceNames.lattice:
        keyringType = keyringOverrides?.lattice?.type || LatticeKeyring.type;
        break;
      default:
        throw new Error(
          'MetamaskController:#withKeyringForDevice - Unknown device',
        );
    }

    return this.keyringController.withKeyring(
      { type: keyringType },
      async ({ keyring }) => {
        if (options.hdPath && keyring.setHdPath) {
          keyring.setHdPath(options.hdPath);
        }

        if (options.name === HardwareDeviceNames.lattice) {
          keyring.appName = 'MetaMask';
        }

        if (options.name === HardwareDeviceNames.ledger) {
          await this.setLedgerTransportPreference(keyring);
        }

        if (
          options.name === HardwareDeviceNames.trezor ||
          options.name === HardwareDeviceNames.oneKey
        ) {
          const model = keyring.getModel();
          this.appStateController.setTrezorModel(model);
        }

        keyring.network = getProviderConfig({
          metamask: this.networkController.state,
        }).type;

        return await callback(keyring);
      },
      {
        createIfMissing: true,
      },
    );
  }

  /**
   * @deprecated Avoid new references to the global network.
   * Will be removed once multi-chain support is fully implemented.
   * @returns {string} The chain ID of the currently selected network.
   */
  #getGlobalChainId() {
    const globalNetworkClientId = this.#getGlobalNetworkClientId();

    const globalNetworkClient = this.networkController.getNetworkClientById(
      globalNetworkClientId,
    );

    return globalNetworkClient.configuration.chainId;
  }

  /**
   * @deprecated Avoid new references to the global network.
   * Will be removed once multi-chain support is fully implemented.
   * @returns {string} The network client ID of the currently selected network client.
   */
  #getGlobalNetworkClientId() {
    return this.networkController.state.selectedNetworkClientId;
  }

  #initControllers({ existingControllers, initFunctions, initState }) {
    const initRequest = {
      encryptor: this.opts.encryptor,
      extension: this.extension,
      getCronjobControllerStorageManager: () =>
        this.opts.cronjobControllerStorageManager,
      getFlatState: this.getState.bind(this),
      getPermittedAccounts: this.getPermittedAccounts.bind(this),
      getStateUI: this._getMetaMaskState.bind(this),
      getTransactionMetricsRequest:
        this.getTransactionMetricsRequest.bind(this),
      infuraProjectId: this.opts.infuraProjectId,
      initLangCode: this.opts.initLangCode,
      keyringOverrides: this.opts.overrides?.keyrings,
      updateAccountBalanceForTransactionNetwork:
        this.updateAccountBalanceForTransactionNetwork.bind(this),
      offscreenPromise: this.offscreenPromise,
      preinstalledSnaps: this.opts.preinstalledSnaps,
      persistedState: initState,
      removeAccount: this.removeAccount.bind(this),
      removeAllConnections: this.removeAllConnections.bind(this),
      setupUntrustedCommunicationEip1193:
        this.setupUntrustedCommunicationEip1193.bind(this),
      setLocked: this.setLocked.bind(this),
      showNotification: this.platform._showNotification,
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      getHardwareTypeForMetric: this.getHardwareTypeForMetric.bind(this),
      trace,
    };

    return initControllers({
      baseControllerMessenger: this.controllerMessenger,
      existingControllers,
      initFunctions,
      initRequest,
    });
  }
}

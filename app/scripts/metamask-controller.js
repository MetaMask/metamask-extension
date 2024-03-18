import EventEmitter from 'events';
import pump from 'pump';
import {
  AssetsContractController,
  CurrencyRateController,
  NftController,
  NftDetectionController,
  TokenDetectionController,
  TokenListController,
  TokenRatesController,
  TokensController,
  CodefiTokenPricesServiceV2,
} from '@metamask/assets-controllers';
import { ObservableStore } from '@metamask/obs-store';
import { storeAsStream } from '@metamask/obs-store/dist/asStream';
import { JsonRpcEngine } from 'json-rpc-engine';
import { createEngineStream } from 'json-rpc-middleware-stream';
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  debounce,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  throttle,
  memoize,
  wrap,
  ///: END:ONLY_INCLUDE_IF
} from 'lodash';
import { keyringBuilderFactory } from '@metamask/eth-keyring-controller';
import { KeyringController } from '@metamask/keyring-controller';
import createFilterMiddleware from '@metamask/eth-json-rpc-filters';
import createSubscriptionManager from '@metamask/eth-json-rpc-filters/subscriptionManager';
import {
  errorCodes as rpcErrorCodes,
  EthereumRpcError,
  ethErrors,
} from 'eth-rpc-errors';

import { Mutex } from 'await-semaphore';
import log from 'loglevel';
import {
  TrezorConnectBridge,
  TrezorKeyring,
} from '@metamask/eth-trezor-keyring';
import {
  LedgerKeyring,
  LedgerIframeBridge,
} from '@metamask/eth-ledger-bridge-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';
import EthQuery from '@metamask/eth-query';
import EthJSQuery from '@metamask/ethjs-query';
import nanoid from 'nanoid';
import { captureException } from '@sentry/browser';
import { AddressBookController } from '@metamask/address-book-controller';
import {
  ApprovalController,
  ApprovalRequestNotFoundError,
} from '@metamask/approval-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { EnsController } from '@metamask/ens-controller';
import { PhishingController } from '@metamask/phishing-controller';
import { AnnouncementController } from '@metamask/announcement-controller';
import { NetworkController } from '@metamask/network-controller';
import { GasFeeController } from '@metamask/gas-fee-controller';
import {
  PermissionController,
  PermissionsRequestNotFoundError,
  SubjectMetadataController,
  SubjectType,
} from '@metamask/permission-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import {
  METAMASK_DOMAIN,
  SelectedNetworkController,
  createSelectedNetworkMiddleware,
} from '@metamask/selected-network-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';
import { PermissionLogController } from '@metamask/permission-log-controller';

///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { RateLimitController } from '@metamask/rate-limit-controller';
import { NotificationController } from '@metamask/notification-controller';
import {
  CronjobController,
  JsonSnapsRegistry,
  SnapController,
  IframeExecutionService,
  SnapInterfaceController,
  OffscreenExecutionService,
} from '@metamask/snaps-controllers';
import {
  createSnapsMethodMiddleware,
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF

import { AccountsController } from '@metamask/accounts-controller';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  CUSTODIAN_TYPES,
  MmiConfigurationController,
} from '@metamask-institutional/custody-keyring';
import { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
///: END:ONLY_INCLUDE_IF
import { SignatureController } from '@metamask/signature-controller';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { PPOMController } from '@metamask/ppom-validator';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(desktop)
// eslint-disable-next-line import/order
import { DesktopController } from '@metamask/desktop/dist/controllers/desktop';
///: END:ONLY_INCLUDE_IF

import {
  ApprovalType,
  ERC1155,
  ERC20,
  ERC721,
} from '@metamask/controller-utils';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

import {
  NameController,
  ENSNameProvider,
  EtherscanNameProvider,
  TokenNameProvider,
  LensNameProvider,
} from '@metamask/name-controller';

import {
  QueuedRequestController,
  createQueuedRequestMiddleware,
} from '@metamask/queued-request-controller';

import { UserOperationController } from '@metamask/user-operation-controller';

import {
  TransactionController,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import {
  getLocalizedSnapManifest,
  stripSnapPrefix,
} from '@metamask/snaps-utils';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IF

import {
  AssetType,
  TokenStandard,
  SIGNING_METHODS,
} from '../../shared/constants/transaction';
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_CLIENT_ID,
} from '../../shared/constants/swaps';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
  NetworkStatus,
} from '../../shared/constants/network';
import {
  HardwareDeviceNames,
  LedgerTransportTypes,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import {
  CaveatTypes,
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  EndowmentPermissions,
  ExcludedSnapPermissions,
  ExcludedSnapEndowments,
  ///: END:ONLY_INCLUDE_IF
} from '../../shared/constants/permissions';
import { UI_NOTIFICATIONS } from '../../shared/notifications';
import { MILLISECOND, SECOND } from '../../shared/constants/time';
import {
  ORIGIN_METAMASK,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  SNAP_DIALOG_TYPES,
  ///: END:ONLY_INCLUDE_IF
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { LOG_EVENT } from '../../shared/constants/logs';

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
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { convertNetworkId } from '../../shared/modules/network.utils';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  handleMMITransactionUpdate,
  ///: END:ONLY_INCLUDE_IF
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionFailed,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionRejected,
  handleTransactionSubmitted,
  handlePostTransactionBalanceUpdate,
  createTransactionEventFragmentWithTxId,
} from './lib/transaction/metrics';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  afterTransactionSign as afterTransactionSignMMI,
  beforeCheckPendingTransaction as beforeCheckPendingTransactionMMI,
  beforeTransactionPublish as beforeTransactionPublishMMI,
  beforeTransactionApproveOnInit as beforeApproveOnInitMMI,
  getAdditionalSignArguments as getAdditionalSignArgumentsMMI,
} from './lib/transaction/mmi-hooks';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { keyringSnapPermissionsBuilder } from './lib/keyring-snaps-permissions';
///: END:ONLY_INCLUDE_IF

import { SnapsNameProvider } from './lib/SnapsNameProvider';
import { AddressBookPetnamesBridge } from './lib/AddressBookPetnamesBridge';
import { AccountIdentitiesPetnamesBridge } from './lib/AccountIdentitiesPetnamesBridge';

///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { createPPOMMiddleware } from './lib/ppom/ppom-middleware';
import * as PPOMModule from './lib/ppom/ppom';
///: END:ONLY_INCLUDE_IF
import {
  onMessageReceived,
  checkForMultipleVersionsRunning,
} from './detect-multiple-instances';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import MMIController from './controllers/mmi-controller';
import { mmiKeyringBuilderFactory } from './mmi-keyring-builder-factory';
///: END:ONLY_INCLUDE_IF
import ComposableObservableStore from './lib/ComposableObservableStore';
import AccountTracker from './lib/account-tracker';
import createDupeReqFilterMiddleware from './lib/createDupeReqFilterMiddleware';
import createLoggerMiddleware from './lib/createLoggerMiddleware';
import { createMethodMiddleware } from './lib/rpc-method-middleware';
import createOriginMiddleware from './lib/createOriginMiddleware';
import createTabIdMiddleware from './lib/createTabIdMiddleware';
import { NetworkOrderController } from './controllers/network-order';
import { AccountOrderController } from './controllers/account-order';
import createOnboardingMiddleware from './lib/createOnboardingMiddleware';
import { setupMultiplex } from './lib/stream-utils';
import PreferencesController from './controllers/preferences';
import AppStateController from './controllers/app-state';
import AlertController from './controllers/alert';
import OnboardingController from './controllers/onboarding';
import Backup from './lib/backup';
import DecryptMessageController from './controllers/decrypt-message';
import SwapsController from './controllers/swaps';
import MetaMetricsController from './controllers/metametrics';
import { segment } from './lib/segment';
import createMetaRPCHandler from './lib/createMetaRPCHandler';
import { previousValueComparator } from './lib/util';
import createMetamaskMiddleware from './lib/createMetamaskMiddleware';
import { hardwareKeyringBuilderFactory } from './lib/hardware-keyring-builder-factory';
import EncryptionPublicKeyController from './controllers/encryption-public-key';
import AppMetadataController from './controllers/app-metadata';

import {
  CaveatMutatorFactories,
  getCaveatSpecifications,
  getChangedAccounts,
  getPermissionBackgroundApiMethods,
  getPermissionSpecifications,
  getPermittedAccountsByOrigin,
  NOTIFICATION_NAMES,
  unrestrictedMethods,
} from './controllers/permissions';
import createRPCMethodTrackingMiddleware from './lib/createRPCMethodTrackingMiddleware';
import { securityProviderCheck } from './lib/security-provider-helpers';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { IndexedDBPPOMStorage } from './lib/ppom/indexed-db-backend';
///: END:ONLY_INCLUDE_IF
import { updateCurrentLocale } from './translate';
import { TrezorOffscreenBridge } from './lib/offscreen-bridge/trezor-offscreen-bridge';
import { LedgerOffscreenBridge } from './lib/offscreen-bridge/ledger-offscreen-bridge';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { snapKeyringBuilder, getAccountsBySnapId } from './lib/snap-keyring';
///: END:ONLY_INCLUDE_IF
import { encryptorFactory } from './lib/encryptor-factory';
import { addDappTransaction, addTransaction } from './lib/transaction/util';
import { LatticeKeyringOffscreen } from './lib/offscreen-bridge/lattice-offscreen-keyring';

export const METAMASK_CONTROLLER_EVENTS = {
  // Fired after state changes that impact the extension badge (unapproved msg count)
  // The process of updating the badge happens in app/scripts/background.js.
  UPDATE_BADGE: 'updateBadge',
  // TODO: Add this and similar enums to the `controllers` repo and export them
  APPROVAL_STATE_CHANGE: 'ApprovalController:stateChange',
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
    this.extension = opts.browser;
    this.platform = opts.platform;
    this.notificationManager = opts.notificationManager;
    const initState = opts.initState || {};
    const version = this.platform.getVersion();
    this.recordFirstTimeInfo(initState);
    this.featureFlags = opts.featureFlags;

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0;

    this.getRequestAccountTabIds = opts.getRequestAccountTabIds;
    this.getOpenMetamaskTabsIds = opts.getOpenMetamaskTabsIds;

    this.controllerMessenger = new ControllerMessenger();

    this.loggingController = new LoggingController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'LoggingController',
      }),
      state: initState.LoggingController,
    });

    // instance of a class that wraps the extension's storage local API.
    this.localStoreApiWrapper = opts.localStore;

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
      currentMigrationVersion: this.currentMigrationVersion,
      currentAppVersion: version,
    });

    // next, we will initialize the controllers
    // controller initialization order matters

    this.queuedRequestController = new QueuedRequestController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'QueuedRequestController',
      }),
    });

    this.approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: opts.showUserConfirmation,
      typesExcludedFromRateLimiting: [
        ApprovalType.EthSign,
        ApprovalType.PersonalSign,
        ApprovalType.EthSignTypedData,
        ApprovalType.Transaction,
        ApprovalType.WatchAsset,
        ApprovalType.EthGetEncryptionPublicKey,
        ApprovalType.EthDecrypt,
      ],
    });

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.mmiConfigurationController = new MmiConfigurationController({
      initState: initState.MmiConfigurationController,
      mmiConfigurationServiceUrl: process.env.MMI_CONFIGURATION_SERVICE_URL,
    });
    ///: END:ONLY_INCLUDE_IF

    const networkControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'NetworkController',
    });

    let initialNetworkControllerState = {};
    if (initState.NetworkController) {
      initialNetworkControllerState = initState.NetworkController;
    } else if (process.env.IN_TEST) {
      const networkConfig = {
        chainId: CHAIN_IDS.LOCALHOST,
        nickname: 'Localhost 8545',
        rpcPrefs: {},
        rpcUrl: 'http://localhost:8545',
        ticker: 'ETH',
        id: 'networkConfigurationId',
      };
      initialNetworkControllerState = {
        providerConfig: {
          ...networkConfig,
          type: 'rpc',
        },
        networkConfigurations: {
          networkConfigurationId: {
            ...networkConfig,
          },
        },
      };
    } else if (
      process.env.METAMASK_DEBUG ||
      process.env.METAMASK_ENVIRONMENT === 'test'
    ) {
      initialNetworkControllerState = {
        providerConfig: {
          type: NETWORK_TYPES.SEPOLIA,
          chainId: CHAIN_IDS.SEPOLIA,
          ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
        },
      };
    }
    this.networkController = new NetworkController({
      messenger: networkControllerMessenger,
      state: initialNetworkControllerState,
      infuraProjectId: opts.infuraProjectId,
      trackMetaMetricsEvent: (...args) =>
        this.metaMetricsController.trackEvent(...args),
    });
    this.networkController.initializeProvider();
    this.provider =
      this.networkController.getProviderAndBlockTracker().provider;
    this.blockTracker =
      this.networkController.getProviderAndBlockTracker().blockTracker;

    // TODO: Delete when ready to remove `networkVersion` from provider object
    this.deprecatedNetworkId = null;
    this.updateDeprecatedNetworkId();
    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      () => this.updateDeprecatedNetworkId(),
    );

    const tokenListMessenger = this.controllerMessenger.getRestricted({
      name: 'TokenListController',
      allowedEvents: ['NetworkController:stateChange'],
    });

    this.tokenListController = new TokenListController({
      chainId: this.networkController.state.providerConfig.chainId,
      preventPollingOnNetworkRestart: initState.TokenListController
        ? initState.TokenListController.preventPollingOnNetworkRestart
        : true,
      messenger: tokenListMessenger,
      state: initState.TokenListController,
    });

    const preferencesMessenger = this.controllerMessenger.getRestricted({
      name: 'PreferencesController',
      allowedActions: ['PreferencesController:getState'],
      allowedEvents: ['PreferencesController:stateChange'],
    });

    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
      initLangCode: opts.initLangCode,
      messenger: preferencesMessenger,
      tokenListController: this.tokenListController,
      provider: this.provider,
      networkConfigurations: this.networkController.state.networkConfigurations,
      onKeyringStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          'KeyringController:stateChange',
          listener,
        ),
    });

    this.assetsContractController = new AssetsContractController(
      {
        chainId: this.networkController.state.providerConfig.chainId,
        onPreferencesStateChange: (listener) =>
          this.preferencesController.store.subscribe(listener),
        onNetworkDidChange: (cb) =>
          networkControllerMessenger.subscribe(
            'NetworkController:networkDidChange',
            () => {
              const networkState = this.networkController.state;
              return cb(networkState);
            },
          ),
        getNetworkClientById: this.networkController.getNetworkClientById.bind(
          this.networkController,
        ),
      },
      {
        provider: this.provider,
      },
      initState.AssetsContractController,
    );

    const tokensControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'TokensController',
      allowedActions: [
        'ApprovalController:addRequest',
        'NetworkController:getNetworkClientById',
      ],
      allowedEvents: [
        'NetworkController:networkDidChange',
        'AccountsController:selectedAccountChange',
        'PreferencesController:stateChange',
        'TokenListController:stateChange',
      ],
    });
    this.tokensController = new TokensController({
      messenger: tokensControllerMessenger,
      chainId: this.networkController.state.providerConfig.chainId,
      // TODO: The tokens controller currently does not support internalAccounts. This is done to match the behavior of the previous tokens controller subscription.
      onPreferencesStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          `AccountsController:selectedAccountChange`,
          (newlySelectedInternalAccount) => {
            listener({ selectedAddress: newlySelectedInternalAccount.address });
          },
        ),
      onNetworkDidChange: (cb) =>
        networkControllerMessenger.subscribe(
          'NetworkController:networkDidChange',
          () => {
            const networkState = this.networkController.state;
            return cb(networkState);
          },
        ),
      onTokenListStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          `${this.tokenListController.name}:stateChange`,
          listener,
        ),
      getNetworkClientById: this.networkController.getNetworkClientById.bind(
        this.networkController,
      ),
      config: {
        provider: this.provider,
        selectedAddress:
          initState.AccountsController?.internalAccounts?.accounts[
            initState.AccountsController?.internalAccounts?.selectedAccount
          ]?.address ?? '',
      },
      state: initState.TokensController,
    });
    // TODO: Remove once `TokensController` is upgraded to extend from `BaseControllerV2`
    this.controllerMessenger.registerActionHandler(
      'TokensController:getState',
      () => this.tokensController.state,
    );

    const nftControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'NftController',
      allowedActions: [`${this.approvalController.name}:addRequest`],
    });
    this.nftController = new NftController(
      {
        messenger: nftControllerMessenger,
        chainId: this.networkController.state.providerConfig.chainId,
        onPreferencesStateChange:
          this.preferencesController.store.subscribe.bind(
            this.preferencesController.store,
          ),
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
        getERC721AssetName:
          this.assetsContractController.getERC721AssetName.bind(
            this.assetsContractController,
          ),
        getERC721AssetSymbol:
          this.assetsContractController.getERC721AssetSymbol.bind(
            this.assetsContractController,
          ),
        getERC721TokenURI: this.assetsContractController.getERC721TokenURI.bind(
          this.assetsContractController,
        ),
        getERC721OwnerOf: this.assetsContractController.getERC721OwnerOf.bind(
          this.assetsContractController,
        ),
        getERC1155BalanceOf:
          this.assetsContractController.getERC1155BalanceOf.bind(
            this.assetsContractController,
          ),
        getERC1155TokenURI:
          this.assetsContractController.getERC1155TokenURI.bind(
            this.assetsContractController,
          ),
        onNftAdded: ({ address, symbol, tokenId, standard, source }) =>
          this.metaMetricsController.trackEvent({
            event: MetaMetricsEventName.NftAdded,
            category: MetaMetricsEventCategory.Wallet,
            sensitiveProperties: {
              token_contract_address: address,
              token_symbol: symbol,
              token_id: tokenId,
              token_standard: standard,
              asset_type: AssetType.NFT,
              source,
            },
          }),
        getNetworkClientById: this.networkController.getNetworkClientById.bind(
          this.networkController,
        ),
      },
      {},
      initState.NftController,
    );

    this.nftController.setApiKey(process.env.OPENSEA_KEY);

    this.nftDetectionController = new NftDetectionController({
      chainId: this.networkController.state.providerConfig.chainId,
      onNftsStateChange: (listener) => this.nftController.subscribe(listener),
      onPreferencesStateChange: this.preferencesController.store.subscribe.bind(
        this.preferencesController.store,
      ),
      onNetworkStateChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
      getOpenSeaApiKey: () => this.nftController.openSeaApiKey,
      getBalancesInSingleCall:
        this.assetsContractController.getBalancesInSingleCall.bind(
          this.assetsContractController,
        ),
      addNft: this.nftController.addNft.bind(this.nftController),
      getNftApi: this.nftController.getNftApi.bind(this.nftController),
      getNftState: () => this.nftController.state,
    });

    this.metaMetricsController = new MetaMetricsController({
      segment,
      preferencesStore: this.preferencesController.store,
      onNetworkDidChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:networkDidChange',
      ),
      getNetworkIdentifier: () => {
        const { type, rpcUrl } = this.networkController.state.providerConfig;
        return type === NETWORK_TYPES.RPC ? rpcUrl : type;
      },
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      version: this.platform.getVersion(),
      environment: process.env.METAMASK_ENVIRONMENT,
      extension: this.extension,
      initState: initState.MetaMetricsController,
      captureException,
    });

    this.on('update', (update) => {
      this.metaMetricsController.handleMetaMaskStateUpdate(update);
    });

    const gasFeeMessenger = this.controllerMessenger.getRestricted({
      name: 'GasFeeController',
      allowedActions: [
        'NetworkController:getEIP1559Compatibility',
        'NetworkController:getNetworkClientById',
        'NetworkController:getState',
      ],
      allowedEvents: ['NetworkController:stateChange'],
    });

    const gasApiBaseUrl = process.env.SWAPS_USE_DEV_APIS
      ? GAS_DEV_API_BASE_URL
      : GAS_API_BASE_URL;

    this.gasFeeController = new GasFeeController({
      state: initState.GasFeeController,
      interval: 10000,
      messenger: gasFeeMessenger,
      clientId: SWAPS_CLIENT_ID,
      getProvider: () =>
        this.networkController.getProviderAndBlockTracker().provider,
      onNetworkDidChange: (eventHandler) => {
        networkControllerMessenger.subscribe(
          'NetworkController:networkDidChange',
          () => eventHandler(this.networkController.state),
        );
      },
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      getCurrentAccountEIP1559Compatibility:
        this.getCurrentAccountEIP1559Compatibility.bind(this),
      legacyAPIEndpoint: `${gasApiBaseUrl}/networks/<chain_id>/gasPrices`,
      EIP1559APIEndpoint: `${gasApiBaseUrl}/networks/<chain_id>/suggestedGasFees`,
      getCurrentNetworkLegacyGasAPICompatibility: () => {
        const { chainId } = this.networkController.state.providerConfig;
        return chainId === CHAIN_IDS.BSC;
      },
      getChainId: () => this.networkController.state.providerConfig.chainId,
    });

    this.appStateController = new AppStateController({
      addUnlockListener: this.on.bind(this, 'unlock'),
      isUnlocked: this.isUnlocked.bind(this),
      initState: initState.AppStateController,
      onInactiveTimeout: () => this.setLocked(),
      preferencesStore: this.preferencesController.store,
      messenger: this.controllerMessenger.getRestricted({
        name: 'AppStateController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
        ],
        allowedEvents: [`KeyringController:qrKeyringStateChange`],
      }),
      extension: this.extension,
    });

    const currencyRateMessenger = this.controllerMessenger.getRestricted({
      name: 'CurrencyRateController',
      allowedActions: [`${this.networkController.name}:getNetworkClientById`],
    });
    this.currencyRateController = new CurrencyRateController({
      includeUsdRate: true,
      messenger: currencyRateMessenger,
      state: initState.CurrencyController,
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

    this.phishingController.maybeUpdateState();

    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    this.ppomController = new PPOMController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PPOMController',
        allowedEvents: ['NetworkController:stateChange'],
      }),
      storageBackend: new IndexedDBPPOMStorage('PPOMDB', 1),
      provider: this.provider,
      ppomProvider: { PPOM: PPOMModule.PPOM, ppomInit: PPOMModule.default },
      state: initState.PPOMController,
      chainId: this.networkController.state.providerConfig.chainId,
      securityAlertsEnabled:
        this.preferencesController.store.getState().securityAlertsEnabled,
      onPreferencesChange: this.preferencesController.store.subscribe.bind(
        this.preferencesController.store,
      ),
      cdnBaseUrl: process.env.BLOCKAID_FILE_CDN,
      blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY,
    });
    ///: END:ONLY_INCLUDE_IF

    const announcementMessenger = this.controllerMessenger.getRestricted({
      name: 'AnnouncementController',
    });

    this.announcementController = new AnnouncementController({
      messenger: announcementMessenger,
      allAnnouncements: UI_NOTIFICATIONS,
      state: initState.AnnouncementController,
    });

    const networkOrderMessenger = this.controllerMessenger.getRestricted({
      name: 'NetworkOrderController',
      allowedEvents: ['NetworkController:stateChange'],
    });
    this.networkOrderController = new NetworkOrderController({
      messenger: networkOrderMessenger,
      state: initState.NetworkOrderController,
    });

    const accountOrderMessenger = this.controllerMessenger.getRestricted({
      name: 'AccountOrderController',
    });
    this.accountOrderController = new AccountOrderController({
      messenger: accountOrderMessenger,
      state: initState.AccountOrderController,
    });

    const accountsControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'AccountsController',
      allowedEvents: [
        'SnapController:stateChange',
        'KeyringController:accountRemoved',
        'KeyringController:stateChange',
        'AccountsController:selectedAccountChange',
      ],
      allowedActions: [
        'AccountsController:setCurrentAccount',
        'AccountsController:setAccountName',
        'AccountsController:listAccounts',
        'AccountsController:getSelectedAccount',
        'AccountsController:getAccountByAddress',
        'AccountsController:updateAccounts',
        'KeyringController:getAccounts',
        'KeyringController:getKeyringsByType',
        'KeyringController:getKeyringForAccount',
      ],
    });

    this.accountsController = new AccountsController({
      messenger: accountsControllerMessenger,
      state: initState.AccountsController,
    });

    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController(
      {
        chainId: this.networkController.state.providerConfig.chainId,
        ticker: this.networkController.state.providerConfig.ticker,
        selectedAddress: this.accountsController.getSelectedAccount().address,
        onTokensStateChange: (listener) =>
          this.tokensController.subscribe(listener),
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
        onPreferencesStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            `AccountsController:selectedAccountChange`,
            (newlySelectedInternalAccount) => {
              listener({
                selectedAddress: newlySelectedInternalAccount.address,
              });
            },
          ),
        tokenPricesService: new CodefiTokenPricesServiceV2(),
        getNetworkClientById: this.networkController.getNetworkClientById.bind(
          this.networkController,
        ),
      },
      {
        allTokens: this.tokensController.state.allTokens,
        allDetectedTokens: this.tokensController.state.allDetectedTokens,
      },
      initState.TokenRatesController,
    );
    if (this.preferencesController.store.getState().useCurrencyRateCheck) {
      this.tokenRatesController.start();
    }

    this.preferencesController.store.subscribe(
      previousValueComparator((prevState, currState) => {
        const { useCurrencyRateCheck: prevUseCurrencyRateCheck } = prevState;
        const { useCurrencyRateCheck: currUseCurrencyRateCheck } = currState;
        if (currUseCurrencyRateCheck && !prevUseCurrencyRateCheck) {
          this.currencyRateController.startPollingByNetworkClientId(
            this.networkController.state.selectedNetworkClientId,
          );
          this.tokenRatesController.start();
        } else if (!currUseCurrencyRateCheck && prevUseCurrencyRateCheck) {
          this.currencyRateController.stopAllPolling();
          this.tokenRatesController.stop();
        }
      }, this.preferencesController.store.getState()),
    );

    this.ensController = new EnsController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'EnsController',
      }),
      provider: this.provider,
      onNetworkDidChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:networkDidChange',
      ),
    });

    this.onboardingController = new OnboardingController({
      initState: initState.OnboardingController,
    });

    let additionalKeyrings = [keyringBuilderFactory(QRHardwareKeyring)];

    if (isManifestV3 === false) {
      const keyringOverrides = this.opts.overrides?.keyrings;

      const additionalKeyringTypes = [
        keyringOverrides?.lattice || LatticeKeyring,
        QRHardwareKeyring,
      ];

      const additionalBridgedKeyringTypes = [
        {
          keyring: keyringOverrides?.trezor || TrezorKeyring,
          bridge: keyringOverrides?.trezorBridge || TrezorConnectBridge,
        },
        {
          keyring: keyringOverrides?.ledger || LedgerKeyring,
          bridge: keyringOverrides?.ledgerBridge || LedgerIframeBridge,
        },
      ];

      additionalKeyrings = additionalKeyringTypes.map((keyringType) =>
        keyringBuilderFactory(keyringType),
      );

      additionalBridgedKeyringTypes.forEach((keyringType) =>
        additionalKeyrings.push(
          hardwareKeyringBuilderFactory(
            keyringType.keyring,
            keyringType.bridge,
          ),
        ),
      );
    } else {
      additionalKeyrings.push(
        hardwareKeyringBuilderFactory(TrezorKeyring, TrezorOffscreenBridge),
        hardwareKeyringBuilderFactory(LedgerKeyring, LedgerOffscreenBridge),
        keyringBuilderFactory(LatticeKeyringOffscreen),
      );
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    for (const custodianType of Object.keys(CUSTODIAN_TYPES)) {
      additionalKeyrings.push(
        mmiKeyringBuilderFactory(CUSTODIAN_TYPES[custodianType].keyringClass, {
          mmiConfigurationController: this.mmiConfigurationController,
        }),
      );
    }
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const snapKeyringBuildMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapKeyringBuilder',
      allowedActions: [
        'ApprovalController:addRequest',
        'ApprovalController:acceptRequest',
        'ApprovalController:rejectRequest',
        'ApprovalController:startFlow',
        'ApprovalController:endFlow',
        'ApprovalController:showSuccess',
        'ApprovalController:showError',
        'PhishingController:test',
        'PhishingController:maybeUpdateState',
        'KeyringController:getAccounts',
        'AccountsController:setSelectedAccount',
        'AccountsController:getAccountByAddress',
      ],
    });

    const getSnapController = () => this.snapController;

    // Necessary to persist the keyrings and update the accounts both within the keyring controller and accounts controller
    const persistAndUpdateAccounts = async () => {
      await this.keyringController.persistAllKeyrings();
      await this.accountsController.updateAccounts();
    };

    const getSnapName = (id) => {
      if (!id) {
        return null;
      }

      const currentLocale = this.getLocale();
      const { snaps } = this.snapController.state;
      const snap = snaps[id];

      if (!snap) {
        return stripSnapPrefix(id);
      }

      if (snap.localizationFiles) {
        const localizedManifest = getLocalizedSnapManifest(
          snap.manifest,
          currentLocale,
          snap.localizationFiles,
        );
        return localizedManifest.proposedName;
      }

      return snap.manifest.proposedName;
    };

    additionalKeyrings.push(
      snapKeyringBuilder(
        snapKeyringBuildMessenger,
        getSnapController,
        persistAndUpdateAccounts,
        (address) => this.preferencesController.setSelectedAddress(address),
        (address) => this.removeAccount(address),
        this.metaMetricsController.trackEvent.bind(this.metaMetricsController),
        getSnapName,
      ),
    );

    ///: END:ONLY_INCLUDE_IF

    const keyringControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'KeyringController',
    });

    this.keyringController = new KeyringController({
      cacheEncryptionKey: true,
      keyringBuilders: additionalKeyrings,
      state: initState.KeyringController,
      encryptor: opts.encryptor || encryptorFactory(600_000),
      messenger: keyringControllerMessenger,
      removeIdentity: this.preferencesController.removeAddress.bind(
        this.preferencesController,
      ),
      setAccountLabel: (address, label) => {
        const accountToBeNamed =
          this.accountsController.getAccountByAddress(address);
        if (accountToBeNamed === undefined) {
          throw new Error(`No account found for address: ${address}`);
        }
        this.accountsController.setAccountName(accountToBeNamed.id, label);

        this.preferencesController.setAccountLabel(address, label);
      },
      setSelectedAddress: (address) => {
        const accountToBeSet =
          this.accountsController.getAccountByAddress(address);
        if (accountToBeSet === undefined) {
          throw new Error(`No account found for address: ${address}`);
        }

        this.accountsController.setSelectedAccount(accountToBeSet.id);
        this.preferencesController.setSelectedAddress(address);
      },
      syncIdentities: (identities) => {
        this.preferencesController.syncAddresses(identities);
      },
      updateIdentities: this.preferencesController.setAddresses.bind(
        this.preferencesController,
      ),
    });

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

    this.permissionController = new PermissionController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PermissionController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:hasRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
          `SnapController:getPermitted`,
          `SnapController:install`,
          `SubjectMetadataController:getSubjectMetadata`,
        ],
      }),
      state: initState.PermissionController,
      caveatSpecifications: getCaveatSpecifications({
        getInternalAccounts: this.accountsController.listAccounts.bind(
          this.accountsController,
        ),
      }),
      permissionSpecifications: {
        ...getPermissionSpecifications({
          getInternalAccounts: this.accountsController.listAccounts.bind(
            this.accountsController,
          ),
          getAllAccounts: this.keyringController.getAccounts.bind(
            this.keyringController,
          ),
          captureKeyringTypesWithMissingIdentities: (
            internalAccounts = [],
            accounts = [],
          ) => {
            const accountsMissingIdentities = accounts.filter(
              (address) =>
                !internalAccounts.some(
                  (account) =>
                    account.address.toLowerCase() === address.toLowerCase(),
                ),
            );
            const keyringTypesWithMissingIdentities =
              accountsMissingIdentities.map((address) =>
                this.keyringController.getAccountKeyringType(address),
              );

            const internalAccountCount = internalAccounts.length;

            const accountTrackerCount = Object.keys(
              this.accountTracker.store.getState().accounts || {},
            ).length;

            captureException(
              new Error(
                `Attempt to get permission specifications failed because their were ${accounts.length} accounts, but ${internalAccountCount} identities, and the ${keyringTypesWithMissingIdentities} keyrings included accounts with missing identities. Meanwhile, there are ${accountTrackerCount} accounts in the account tracker.`,
              ),
            );
          },
        }),
        ///: BEGIN:ONLY_INCLUDE_IF(snaps)
        ...this.getSnapPermissionSpecifications(),
        ///: END:ONLY_INCLUDE_IF
      },
      unrestrictedMethods,
    });

    this.selectedNetworkController = new SelectedNetworkController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SelectedNetworkController',
        allowedActions: [
          'NetworkController:getNetworkClientById',
          'NetworkController:getState',
          'PermissionController:hasPermissions',
          'PermissionController:getSubjectNames',
        ],
        allowedEvents: [
          'NetworkController:stateChange',
          'PermissionController:stateChange',
        ],
      }),
      state: initState.SelectedNetworkController,
      getUseRequestQueue: this.preferencesController.getUseRequestQueue.bind(
        this.preferencesController,
      ),
    });

    this.permissionLogController = new PermissionLogController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PermissionLogController',
      }),
      restrictedMethods: new Set(Object.keys(RestrictedMethods)),
      state: initState.PermissionLogController,
    });

    this.subjectMetadataController = new SubjectMetadataController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SubjectMetadataController',
        allowedActions: [`${this.permissionController.name}:hasPermissions`],
      }),
      state: initState.SubjectMetadataController,
      subjectCacheLimit: 100,
    });

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    const shouldUseOffscreenExecutionService =
      isManifestV3 &&
      typeof chrome !== 'undefined' &&
      // eslint-disable-next-line no-undef
      typeof chrome.offscreen !== 'undefined';

    const snapExecutionServiceArgs = {
      messenger: this.controllerMessenger.getRestricted({
        name: 'ExecutionService',
      }),
      setupSnapProvider: this.setupSnapProvider.bind(this),
    };

    this.snapExecutionService =
      shouldUseOffscreenExecutionService === false
        ? new IframeExecutionService({
            ...snapExecutionServiceArgs,
            iframeUrl: new URL(process.env.IFRAME_EXECUTION_ENVIRONMENT_URL),
          })
        : new OffscreenExecutionService({
            // eslint-disable-next-line no-undef
            documentUrl: chrome.runtime.getURL('./offscreen.html'),
            ...snapExecutionServiceArgs,
          });

    const snapControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapController',
      allowedEvents: [
        'ExecutionService:unhandledError',
        'ExecutionService:outboundRequest',
        'ExecutionService:outboundResponse',
      ],
      allowedActions: [
        `${this.permissionController.name}:getEndowments`,
        `${this.permissionController.name}:getPermissions`,
        `${this.permissionController.name}:hasPermission`,
        `${this.permissionController.name}:hasPermissions`,
        `${this.permissionController.name}:requestPermissions`,
        `${this.permissionController.name}:revokeAllPermissions`,
        `${this.permissionController.name}:revokePermissions`,
        `${this.permissionController.name}:revokePermissionForAllSubjects`,
        `${this.permissionController.name}:getSubjectNames`,
        `${this.permissionController.name}:updateCaveat`,
        `${this.approvalController.name}:addRequest`,
        `${this.approvalController.name}:updateRequestState`,
        `${this.permissionController.name}:grantPermissions`,
        `${this.subjectMetadataController.name}:getSubjectMetadata`,
        `${this.subjectMetadataController.name}:addSubjectMetadata`,
        'ExecutionService:executeSnap',
        'ExecutionService:getRpcRequestHandler',
        'ExecutionService:terminateSnap',
        'ExecutionService:terminateAllSnaps',
        'ExecutionService:handleRpcRequest',
        'SnapsRegistry:get',
        'SnapsRegistry:getMetadata',
        'SnapsRegistry:update',
        'SnapsRegistry:resolveVersion',
        `SnapInterfaceController:createInterface`,
        `SnapInterfaceController:getInterface`,
      ],
    });

    const allowLocalSnaps = process.env.ALLOW_LOCAL_SNAPS;
    const requireAllowlist = process.env.REQUIRE_SNAPS_ALLOWLIST;

    this.snapController = new SnapController({
      environmentEndowmentPermissions: Object.values(EndowmentPermissions),
      excludedPermissions: {
        ...ExcludedSnapPermissions,
        ...ExcludedSnapEndowments,
      },
      closeAllConnections: this.removeAllConnections.bind(this),
      state: initState.SnapController,
      messenger: snapControllerMessenger,
      featureFlags: {
        dappsCanUpdateSnaps: true,
        allowLocalSnaps,
        requireAllowlist,
      },
    });

    this.notificationController = new NotificationController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'NotificationController',
      }),
      state: initState.NotificationController,
    });

    this.rateLimitController = new RateLimitController({
      state: initState.RateLimitController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'RateLimitController',
      }),
      implementations: {
        showNativeNotification: {
          method: (origin, message) => {
            const subjectMetadataState = this.controllerMessenger.call(
              'SubjectMetadataController:getState',
            );

            const originMetadata = subjectMetadataState.subjectMetadata[origin];

            this.platform
              ._showNotification(originMetadata?.name ?? origin, message)
              .catch((error) => {
                log.error('Failed to create notification', error);
              });

            return null;
          },
          // 2 calls per 5 minutes
          rateLimitCount: 2,
          rateLimitTimeout: 300000,
        },
        showInAppNotification: {
          method: (origin, message) => {
            this.controllerMessenger.call(
              'NotificationController:show',
              origin,
              message,
            );

            return null;
          },
          // 5 calls per minute
          rateLimitCount: 5,
          rateLimitTimeout: 60000,
        },
      },
    });
    const cronjobControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'CronjobController',
      allowedEvents: [
        'SnapController:snapInstalled',
        'SnapController:snapUpdated',
        'SnapController:snapUninstalled',
        'SnapController:snapEnabled',
        'SnapController:snapDisabled',
      ],
      allowedActions: [
        `${this.permissionController.name}:getPermissions`,
        'SnapController:handleRequest',
        'SnapController:getAll',
      ],
    });
    this.cronjobController = new CronjobController({
      state: initState.CronjobController,
      messenger: cronjobControllerMessenger,
    });

    const snapsRegistryMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapsRegistry',
      allowedEvents: [],
      allowedActions: [],
    });

    this.snapsRegistry = new JsonSnapsRegistry({
      state: initState.SnapsRegistry,
      messenger: snapsRegistryMessenger,
      refetchOnAllowlistMiss: requireAllowlist,
      failOnUnavailableRegistry: requireAllowlist,
      url: {
        registry: 'https://acl.execution.metamask.io/latest/registry.json',
        signature: 'https://acl.execution.metamask.io/latest/signature.json',
      },
      publicKey:
        '0x025b65308f0f0fb8bc7f7ff87bfc296e0330eee5d3c1d1ee4a048b2fd6a86fa0a6',
    });

    const snapInterfaceControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'SnapInterfaceController',
        allowedActions: [
          `${this.phishingController.name}:maybeUpdateState`,
          `${this.phishingController.name}:testOrigin`,
        ],
      });

    this.snapInterfaceController = new SnapInterfaceController({
      state: initState.SnapInterfaceController,
      messenger: snapInterfaceControllerMessenger,
    });

    ///: END:ONLY_INCLUDE_IF

    // account tracker watches balances, nonces, and any code at their address
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      getNetworkIdentifier: (providerConfig) => {
        const { type, rpcUrl } =
          providerConfig ?? this.networkController.state.providerConfig;
        return type === NETWORK_TYPES.RPC ? rpcUrl : type;
      },
      preferencesController: this.preferencesController,
      onboardingController: this.onboardingController,
      controllerMessenger: this.controllerMessenger.getRestricted({
        name: 'AccountTracker',
        allowedEvents: ['AccountsController:selectedAccountChange'],
        allowedActions: ['AccountsController:getSelectedAccount'],
      }),
      initState: { accounts: {} },
      onAccountRemoved: this.controllerMessenger.subscribe.bind(
        this.controllerMessenger,
        'KeyringController:accountRemoved',
      ),
    });

    // start and stop polling for balances based on activeControllerConnections
    this.on('controllerConnectionChanged', (activeControllerConnections) => {
      const { completedOnboarding } =
        this.onboardingController.store.getState();
      if (activeControllerConnections > 0 && completedOnboarding) {
        this.triggerNetworkrequests();
      } else {
        this.stopNetworkRequests();
      }
    });

    this.onboardingController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { completedOnboarding: prevCompletedOnboarding } = prevState;
        const { completedOnboarding: currCompletedOnboarding } = currState;
        if (!prevCompletedOnboarding && currCompletedOnboarding) {
          this.triggerNetworkrequests();
        }
      }, this.onboardingController.store.getState()),
    );

    ///: BEGIN:ONLY_INCLUDE_IF(desktop)
    this.desktopController = new DesktopController({
      initState: initState.DesktopController,
    });
    ///: END:ONLY_INCLUDE_IF

    const tokenDetectionControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'TokenDetectionController',
        allowedActions: [
          'AccountsController:getSelectedAccount',
          'KeyringController:getState',
          'NetworkController:getNetworkClientById',
          'NetworkController:getNetworkConfigurationByNetworkClientId',
          'NetworkController:getState',
          'PreferencesController:getState',
          'TokenListController:getState',
          'TokensController:getState',
          'TokensController:addDetectedTokens',
        ],
        allowedEvents: [
          'AccountsController:selectedAccountChange',
          'KeyringController:lock',
          'KeyringController:unlock',
          'NetworkController:networkDidChange',
          'PreferencesController:stateChange',
          'TokenListController:stateChange',
        ],
      });

    this.tokenDetectionController = new TokenDetectionController({
      messenger: tokenDetectionControllerMessenger,
      getBalancesInSingleCall:
        this.assetsContractController.getBalancesInSingleCall.bind(
          this.assetsContractController,
        ),
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    this.addressBookController = new AddressBookController(
      undefined,
      initState.AddressBookController,
    );

    this.alertController = new AlertController({
      initState: initState.AlertController,
      preferencesStore: this.preferencesController.store,
      controllerMessenger: this.controllerMessenger.getRestricted({
        name: 'AlertController',
        allowedEvents: ['AccountsController:selectedAccountChange'],
        allowedActions: ['AccountsController:getSelectedAccount'],
      }),
    });

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.custodyController = new CustodyController({
      initState: initState.CustodyController,
      captureException,
    });
    this.institutionalFeaturesController = new InstitutionalFeaturesController({
      initState: initState.InstitutionalFeaturesController,
      showConfirmRequest: opts.showUserConfirmation,
    });
    this.transactionUpdateController = new TransactionUpdateController({
      initState: initState.TransactionUpdateController,
      getCustodyKeyring: this.getCustodyKeyringIfExists.bind(this),
      mmiConfigurationController: this.mmiConfigurationController,
      captureException,
    });
    ///: END:ONLY_INCLUDE_IF

    this.backup = new Backup({
      preferencesController: this.preferencesController,
      addressBookController: this.addressBookController,
      accountsController: this.accountsController,
      networkController: this.networkController,
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    // This gets used as a ...spread parameter in two places: new TransactionController() and createRPCMethodTrackingMiddleware()
    this.snapAndHardwareMetricsParams = {
      getSelectedAccount: this.accountsController.getSelectedAccount.bind(
        this.accountsController,
      ),
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
        name: 'SnapAndHardwareMessenger',
        allowedActions: [
          'KeyringController:getKeyringForAccount',
          'SnapController:get',
          'AccountsController:getSelectedAccount',
        ],
      }),
    };

    const transactionControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'TransactionController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          'NetworkController:findNetworkClientIdByChainId',
          'NetworkController:getNetworkClientById',
        ],
        allowedEvents: [`NetworkController:stateChange`],
      });
    this.txController = new TransactionController({
      blockTracker: this.blockTracker,
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      getCurrentAccountEIP1559Compatibility:
        this.getCurrentAccountEIP1559Compatibility.bind(this),
      getExternalPendingTransactions:
        this.getExternalPendingTransactions.bind(this),
      getGasFeeEstimates: this.gasFeeController.fetchGasFeeEstimates.bind(
        this.gasFeeController,
      ),
      getNetworkClientRegistry:
        this.networkController.getNetworkClientRegistry.bind(
          this.networkController,
        ),
      getNetworkState: () => this.networkController.state,
      getPermittedAccounts: this.getPermittedAccounts.bind(this),
      getSavedGasFees: () =>
        this.preferencesController.store.getState().advancedGasFee[
          this.networkController.state.providerConfig.chainId
        ],
      getSelectedAddress: () =>
        this.accountsController.getSelectedAccount().address,
      incomingTransactions: {
        includeTokenTransfers: false,
        isEnabled: () =>
          Boolean(
            this.preferencesController.store.getState()
              .incomingTransactionsPreferences?.[
              this.networkController.state.providerConfig.chainId
            ] && this.onboardingController.store.getState().completedOnboarding,
          ),
        queryEntireHistory: false,
        updateTransactions: false,
      },
      isMultichainEnabled: process.env.TRANSACTION_MULTICHAIN,
      isSimulationEnabled: () => false,
      messenger: transactionControllerMessenger,
      onNetworkStateChange: (listener) => {
        networkControllerMessenger.subscribe(
          'NetworkController:networkDidChange',
          () => listener(),
        );
      },
      provider: this.provider,
      hooks: {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        afterSign: (txMeta, signedEthTx) =>
          afterTransactionSignMMI(
            txMeta,
            signedEthTx,
            this.transactionUpdateController.addTransactionToWatchList.bind(
              this.transactionUpdateController,
            ),
          ),
        beforeCheckPendingTransaction:
          beforeCheckPendingTransactionMMI.bind(this),
        beforeApproveOnInit: beforeApproveOnInitMMI.bind(this),
        beforePublish: beforeTransactionPublishMMI.bind(this),
        getAdditionalSignArguments: getAdditionalSignArgumentsMMI.bind(this),
        ///: END:ONLY_INCLUDE_IF
      },
      sign: (...args) => this.keyringController.signTransaction(...args),
      state: initState.TransactionController,
    });

    this._addTransactionControllerListeners();

    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      async () => {
        try {
          if (
            this.preferencesController.store.getState().useCurrencyRateCheck
          ) {
            await this.currencyRateController.stopAllPolling();
            this.currencyRateController.startPollingByNetworkClientId(
              this.networkController.state.selectedNetworkClientId,
            );
          }
        } catch (error) {
          // TODO: Handle failure to get conversion rate more gracefully
          console.error(error);
        }
      },
    );

    this.networkController.lookupNetwork();
    this.decryptMessageController = new DecryptMessageController({
      getState: this.getState.bind(this),
      messenger: this.controllerMessenger.getRestricted({
        name: 'DecryptMessageController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
          `${this.keyringController.name}:decryptMessage`,
        ],
      }),
      metricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
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
      }),
      getEncryptionPublicKey:
        this.keyringController.getEncryptionPublicKey.bind(
          this.keyringController,
        ),
      getAccountKeyringType: this.keyringController.getAccountKeyringType.bind(
        this.keyringController,
      ),
      getState: this.getState.bind(this),
      metricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    this.signatureController = new SignatureController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SignatureController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.keyringController.name}:signMessage`,
          `${this.keyringController.name}:signPersonalMessage`,
          `${this.keyringController.name}:signTypedMessage`,
          `${this.loggingController.name}:add`,
        ],
      }),
      isEthSignEnabled: () =>
        this.preferencesController.store.getState()
          ?.disabledRpcMethodPreferences?.eth_sign,
      getAllState: this.getState.bind(this),
      securityProviderRequest: this.securityProviderRequest.bind(this),
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
    });

    this.signatureController.hub.on(
      'cancelWithReason',
      ({ message, reason }) => {
        this.metaMetricsController.trackEvent({
          event: reason,
          category: MetaMetricsEventCategory.Transactions,
          properties: {
            action: 'Sign Request',
            type: message.type,
          },
        });
      },
    );

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const transactionMetricsRequest = this.getTransactionMetricsRequest();

    const mmiControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'MMIController',
      allowedActions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:listAccounts',
      ],
    });

    this.mmiController = new MMIController({
      messenger: mmiControllerMessenger,
      mmiConfigurationController: this.mmiConfigurationController,
      keyringController: this.keyringController,
      preferencesController: this.preferencesController,
      appStateController: this.appStateController,
      transactionUpdateController: this.transactionUpdateController,
      custodyController: this.custodyController,
      getState: this.getState.bind(this),
      getPendingNonce: this.getPendingNonce.bind(this),
      accountTracker: this.accountTracker,
      metaMetricsController: this.metaMetricsController,
      networkController: this.networkController,
      permissionController: this.permissionController,
      signatureController: this.signatureController,
      platform: this.platform,
      extension: this.extension,
      getTransactions: this.txController.getTransactions.bind(
        this.txController,
      ),
      setTxStatusSigned: (id) =>
        this.txController.updateCustodialTransaction(id, {
          status: TransactionStatus.signed,
        }),
      setTxStatusSubmitted: (id) =>
        this.txController.updateCustodialTransaction(id, {
          status: TransactionStatus.submitted,
        }),
      setTxStatusFailed: (id, reason) =>
        this.txController.updateCustodialTransaction(id, {
          status: TransactionStatus.failed,
          errorMessage: reason,
        }),
      trackTransactionEvents: handleMMITransactionUpdate.bind(
        null,
        transactionMetricsRequest,
      ),
      updateTransaction: (txMeta, note) =>
        this.txController.updateTransaction(txMeta, note),
      updateTransactionHash: (id, hash) =>
        this.txController.updateCustodialTransaction(id, { hash }),
    });
    ///: END:ONLY_INCLUDE_IF

    this.swapsController = new SwapsController(
      {
        getBufferedGasLimit: async (txMeta, multiplier) => {
          const { gas: gasLimit, simulationFails } =
            await this.txController.estimateGasBuffered(
              txMeta.txParams,
              multiplier,
            );

          return { gasLimit, simulationFails };
        },
        provider: this.provider,
        getProviderConfig: () => this.networkController.state.providerConfig,
        getTokenRatesState: () => this.tokenRatesController.state,
        getCurrentChainId: () =>
          this.networkController.state.providerConfig.chainId,
        getEIP1559GasFeeEstimates:
          this.gasFeeController.fetchGasFeeEstimates.bind(
            this.gasFeeController,
          ),
        trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
      },
      initState.SwapsController,
    );
    this.smartTransactionsController = new SmartTransactionsController(
      {
        getNetworkClientById: this.networkController.getNetworkClientById.bind(
          this.networkController,
        ),
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
        getNonceLock: this.txController.nonceTracker.getNonceLock.bind(
          this.txController.nonceTracker,
        ),
        confirmExternalTransaction:
          this.txController.confirmExternalTransaction.bind(this.txController),
        provider: this.provider,
        trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
      },
      {
        supportedChainIds: [CHAIN_IDS.MAINNET, CHAIN_IDS.GOERLI],
      },
      initState.SmartTransactionsController,
    );

    const isExternalNameSourcesEnabled = () =>
      this.preferencesController.store.getState().useExternalNameSources;

    this.nameController = new NameController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'NameController',
        allowedActions: [],
      }),
      providers: [
        new ENSNameProvider({
          reverseLookup: this.ensController.reverseResolveAddress.bind(
            this.ensController,
          ),
        }),
        new EtherscanNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
        new TokenNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
        new LensNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
        new SnapsNameProvider({
          messenger: this.controllerMessenger.getRestricted({
            name: 'SnapsNameProvider',
            allowedActions: [
              'SnapController:getAll',
              'SnapController:get',
              'SnapController:handleRequest',
              'PermissionController:getState',
            ],
          }),
        }),
      ],
      state: initState.NameController,
    });

    const petnamesBridgeMessenger = this.controllerMessenger.getRestricted({
      name: 'PetnamesBridge',
      allowedEvents: [
        'NameController:stateChange',
        'AccountsController:stateChange',
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

    this.userOperationController = new UserOperationController({
      entrypoint: process.env.EIP_4337_ENTRYPOINT,
      getGasFeeEstimates: this.gasFeeController.fetchGasFeeEstimates.bind(
        this.gasFeeController,
      ),
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

    // ensure accountTracker updates balances after network change
    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      () => {
        this.accountTracker.updateAccounts();
      },
    );

    // clear unapproved transactions and messages when the network will change
    networkControllerMessenger.subscribe(
      'NetworkController:networkWillChange',
      () => {
        this.encryptionPublicKeyController.clearUnapproved();
        this.decryptMessageController.clearUnapproved();
        this.signatureController.clearUnapproved();
        this.approvalController.clear(ethErrors.provider.userRejectedRequest());
      },
    );

    this.metamaskMiddleware = createMetamaskMiddleware({
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      version,
      // account mgmt
      getAccounts: async (
        { origin: innerOrigin },
        { suppressUnauthorizedError = true } = {},
      ) => {
        if (innerOrigin === ORIGIN_METAMASK) {
          const selectedAddress =
            this.accountsController.getSelectedAccount().address;
          return selectedAddress ? [selectedAddress] : [];
        } else if (this.isUnlocked()) {
          return await this.getPermittedAccounts(innerOrigin, {
            suppressUnauthorizedError,
          });
        }
        return []; // changing this is a breaking change
      },
      // tx signing
      processTransaction: (transactionParams, dappRequest) =>
        addDappTransaction(
          this.getAddTransactionRequest({ transactionParams, dappRequest }),
        ),
      // msg signing
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      processEthSignMessage: this.signatureController.newUnsignedMessage.bind(
        this.signatureController,
      ),
      processTypedMessage:
        this.signatureController.newUnsignedTypedMessage.bind(
          this.signatureController,
        ),
      processTypedMessageV3:
        this.signatureController.newUnsignedTypedMessage.bind(
          this.signatureController,
        ),
      processTypedMessageV4:
        this.signatureController.newUnsignedTypedMessage.bind(
          this.signatureController,
        ),
      processPersonalMessage:
        this.signatureController.newUnsignedPersonalMessage.bind(
          this.signatureController,
        ),
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      /* eslint-disable no-dupe-keys */
      processEthSignMessage: this.mmiController.newUnsignedMessage.bind(
        this.mmiController,
      ),
      processTypedMessage: this.mmiController.newUnsignedMessage.bind(
        this.mmiController,
      ),
      processTypedMessageV3: this.mmiController.newUnsignedMessage.bind(
        this.mmiController,
      ),
      processTypedMessageV4: this.mmiController.newUnsignedMessage.bind(
        this.mmiController,
      ),
      processPersonalMessage: this.mmiController.newUnsignedMessage.bind(
        this.mmiController,
      ),
      setTypedMessageInProgress:
        this.signatureController.setTypedMessageInProgress.bind(
          this.signatureController,
        ),
      setPersonalMessageInProgress:
        this.signatureController.setPersonalMessageInProgress.bind(
          this.signatureController,
        ),
      /* eslint-enable no-dupe-keys */
      ///: END:ONLY_INCLUDE_IF

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
    });

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => this._onStateUpdate(memState));

    /**
     * All controllers in Memstore but not in store. They are not persisted.
     * On chrome profile re-start, they will be re-initialized.
     */
    const resetOnRestartStore = {
      AccountTracker: this.accountTracker.store,
      TokenRatesController: this.tokenRatesController,
      DecryptMessageController: this.decryptMessageController,
      EncryptionPublicKeyController: this.encryptionPublicKeyController,
      SignatureController: this.signatureController,
      SwapsController: this.swapsController.store,
      EnsController: this.ensController,
      ApprovalController: this.approvalController,
      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      PPOMController: this.ppomController,
      ///: END:ONLY_INCLUDE_IF
    };

    this.store.updateStructure({
      AccountsController: this.accountsController,
      AppStateController: this.appStateController.store,
      AppMetadataController: this.appMetadataController.store,
      TransactionController: this.txController,
      KeyringController: this.keyringController,
      PreferencesController: this.preferencesController.store,
      MetaMetricsController: this.metaMetricsController.store,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      NetworkController: this.networkController,
      AlertController: this.alertController.store,
      OnboardingController: this.onboardingController.store,
      PermissionController: this.permissionController,
      PermissionLogController: this.permissionLogController,
      SubjectMetadataController: this.subjectMetadataController,
      AnnouncementController: this.announcementController,
      NetworkOrderController: this.networkOrderController,
      AccountOrderController: this.accountOrderController,
      GasFeeController: this.gasFeeController,
      TokenListController: this.tokenListController,
      TokensController: this.tokensController,
      SmartTransactionsController: this.smartTransactionsController,
      NftController: this.nftController,
      PhishingController: this.phishingController,
      SelectedNetworkController: this.selectedNetworkController,
      LoggingController: this.loggingController,
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      SnapController: this.snapController,
      CronjobController: this.cronjobController,
      SnapsRegistry: this.snapsRegistry,
      NotificationController: this.notificationController,
      SnapInterfaceController: this.snapInterfaceController,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(desktop)
      DesktopController: this.desktopController.store,
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      CustodyController: this.custodyController.store,
      InstitutionalFeaturesController:
        this.institutionalFeaturesController.store,
      MmiConfigurationController: this.mmiConfigurationController.store,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      PPOMController: this.ppomController,
      ///: END:ONLY_INCLUDE_IF
      NameController: this.nameController,
      UserOperationController: this.userOperationController,
      ...resetOnRestartStore,
    });

    this.memStore = new ComposableObservableStore({
      config: {
        AccountsController: this.accountsController,
        AppStateController: this.appStateController.store,
        AppMetadataController: this.appMetadataController.store,
        NetworkController: this.networkController,
        KeyringController: this.keyringController,
        PreferencesController: this.preferencesController.store,
        MetaMetricsController: this.metaMetricsController.store,
        AddressBookController: this.addressBookController,
        CurrencyController: this.currencyRateController,
        AlertController: this.alertController.store,
        OnboardingController: this.onboardingController.store,
        PermissionController: this.permissionController,
        PermissionLogController: this.permissionLogController,
        SubjectMetadataController: this.subjectMetadataController,
        AnnouncementController: this.announcementController,
        NetworkOrderController: this.networkOrderController,
        AccountOrderController: this.accountOrderController,
        GasFeeController: this.gasFeeController,
        TokenListController: this.tokenListController,
        TokensController: this.tokensController,
        SmartTransactionsController: this.smartTransactionsController,
        NftController: this.nftController,
        SelectedNetworkController: this.selectedNetworkController,
        LoggingController: this.loggingController,
        TxController: this.txController,
        ///: BEGIN:ONLY_INCLUDE_IF(snaps)
        SnapController: this.snapController,
        CronjobController: this.cronjobController,
        SnapsRegistry: this.snapsRegistry,
        NotificationController: this.notificationController,
        SnapInterfaceController: this.snapInterfaceController,
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(desktop)
        DesktopController: this.desktopController.store,
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        CustodyController: this.custodyController.store,
        InstitutionalFeaturesController:
          this.institutionalFeaturesController.store,
        MmiConfigurationController: this.mmiConfigurationController.store,
        ///: END:ONLY_INCLUDE_IF
        NameController: this.nameController,
        UserOperationController: this.userOperationController,
        ...resetOnRestartStore,
      },
      controllerMessenger: this.controllerMessenger,
    });

    // if this is the first time, clear the state of by calling these methods
    const resetMethods = [
      this.accountTracker.resetState,
      this.decryptMessageController.resetState.bind(
        this.decryptMessageController,
      ),
      this.encryptionPublicKeyController.resetState.bind(
        this.encryptionPublicKeyController,
      ),
      this.signatureController.resetState.bind(this.signatureController),
      this.swapsController.resetState,
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
      this.onboardingController.store.getState().completedOnboarding &&
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

    // For more information about these legacy streams, see here:
    // https://github.com/MetaMask/metamask-extension/issues/15491
    // TODO:LegacyProvider: Delete
    this.publicConfigStore = this.createPublicConfigStore();

    // Multiple MetaMask instances launched warning
    this.extension.runtime.onMessageExternal.addListener(onMessageReceived);
    // Fire a ping message to check if other extensions are running
    checkForMultipleVersionsRunning();
  }

  triggerNetworkrequests() {
    this.accountTracker.start();
    this.txController.startIncomingTransactionPolling();
    if (this.preferencesController.store.getState().useCurrencyRateCheck) {
      this.currencyRateController.startPollingByNetworkClientId(
        this.networkController.state.selectedNetworkClientId,
      );
    }
    if (this.preferencesController.store.getState().useTokenDetection) {
      this.tokenListController.start();
    }
  }

  stopNetworkRequests() {
    this.accountTracker.stop();
    this.txController.stopIncomingTransactionPolling();
    if (this.preferencesController.store.getState().useCurrencyRateCheck) {
      this.currencyRateController.stopAllPolling();
    }
    if (this.preferencesController.store.getState().useTokenDetection) {
      this.tokenListController.stop();
      this.tokenRatesController.stop();
    }
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
    let [snapKeyring] = this.keyringController.getKeyringsByType(
      KeyringType.snap,
    );
    if (!snapKeyring) {
      snapKeyring = await this.keyringController.addNewKeyring(
        KeyringType.snap,
      );
    }
    return snapKeyring;
  }
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  trackInsightSnapView(snapId) {
    this.metaMetricsController.trackEvent({
      event: MetaMetricsEventName.InsightSnapViewed,
      category: MetaMetricsEventCategory.Snaps,
      properties: {
        snap_id: snapId,
      },
    });
  }
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)

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
   * Tracks snaps export usage.
   * Note: This function is throttled to 1 call per 60 seconds per snap id + handler combination.
   *
   * @param {string} snapId - The ID of the snap the handler is being triggered on.
   * @param {string} handler - The handler to trigger on the snap for the request.
   * @param {boolean} success - Whether the invocation was successful or not.
   * @param {string} origin - The origin of the request.
   */
  _trackSnapExportUsage = wrap(
    memoize(
      () =>
        throttle(
          (snapId, handler, success, origin) =>
            this.metaMetricsController.trackEvent({
              event: MetaMetricsEventName.SnapExportUsed,
              category: MetaMetricsEventCategory.Snaps,
              properties: {
                snap_id: snapId,
                export: handler,
                snap_category: this._getSnapMetadata(snapId)?.category,
                success,
                origin,
              },
            }),
          SECOND * 60,
        ),
      (snapId, handler, _, origin) => `${snapId}${handler}${origin}`,
    ),
    (getFunc, ...args) => getFunc(...args)(...args),
  );

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
    try {
      const response = await this.controllerMessenger.call(
        'SnapController:handleRequest',
        args,
      );
      this._trackSnapExportUsage(args.snapId, args.handler, true, args.origin);
      return response;
    } catch (error) {
      this._trackSnapExportUsage(args.snapId, args.handler, false, args.origin);
      throw error;
    }
  }

  /**
   * Gets the currently selected locale from the PreferencesController.
   *
   * @returns The currently selected locale.
   */
  getLocale() {
    const { currentLocale } = this.preferencesController.store.getState();

    return currentLocale;
  }

  /**
   * Constructor helper for getting Snap permission specifications.
   */
  getSnapPermissionSpecifications() {
    const snapEncryptor = encryptorFactory(600_000);

    return {
      ...buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
      ...buildSnapRestrictedMethodSpecifications(
        Object.keys(ExcludedSnapPermissions),
        {
          encrypt: snapEncryptor.encrypt,
          decrypt: snapEncryptor.decrypt,
          getLocale: this.getLocale.bind(this),
          clearSnapState: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapController:clearSnapState',
          ),
          getMnemonic: this.getPrimaryKeyringMnemonic.bind(this),
          getUnlockPromise: this.appStateController.getUnlockPromise.bind(
            this.appStateController,
          ),
          getSnap: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapController:get',
          ),
          handleSnapRpcRequest: this.handleSnapRequest.bind(this),
          getSnapState: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapController:getSnapState',
          ),
          showDialog: (origin, type, id, placeholder) =>
            this.approvalController.addAndShowApprovalRequest({
              origin,
              type: SNAP_DIALOG_TYPES[type],
              requestData: { id, placeholder },
            }),
          showNativeNotification: (origin, args) =>
            this.controllerMessenger.call(
              'RateLimitController:call',
              origin,
              'showNativeNotification',
              origin,
              args.message,
            ),
          showInAppNotification: (origin, args) =>
            this.controllerMessenger.call(
              'RateLimitController:call',
              origin,
              'showInAppNotification',
              origin,
              args.message,
            ),
          updateSnapState: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapController:updateSnapState',
          ),
          maybeUpdatePhishingList: () => {
            const { usePhishDetect } =
              this.preferencesController.store.getState();

            if (!usePhishDetect) {
              return;
            }

            this.controllerMessenger.call(
              'PhishingController:maybeUpdateState',
            );
          },
          isOnPhishingList: (origin) => {
            const { usePhishDetect } =
              this.preferencesController.store.getState();

            if (!usePhishDetect) {
              return false;
            }

            return this.controllerMessenger.call(
              'PhishingController:testOrigin',
              origin,
            ).result;
          },
          createInterface: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapInterfaceController:createInterface',
          ),
          getInterface: this.controllerMessenger.call.bind(
            this.controllerMessenger,
            'SnapInterfaceController:getInterface',
          ),
          ///: END:ONLY_INCLUDE_IF
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          getSnapKeyring: this.getSnapKeyring.bind(this),
          ///: END:ONLY_INCLUDE_IF
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
        },
      ),
    };
  }

  /**
   * Deletes the specified notifications from state.
   *
   * @param {string[]} ids - The notifications ids to delete.
   */
  dismissNotifications(ids) {
    this.notificationController.dismiss(ids);
  }

  /**
   * Updates the readDate attribute of the specified notifications.
   *
   * @param {string[]} ids - The notifications ids to mark as read.
   */
  markNotificationsAsRead(ids) {
    this.notificationController.markRead(ids);
  }

  ///: END:ONLY_INCLUDE_IF

  /**
   * Sets up BaseController V2 event subscriptions. Currently, this includes
   * the subscriptions necessary to notify permission subjects of account
   * changes.
   *
   * Some of the subscriptions in this method are ControllerMessenger selector
   * event subscriptions. See the relevant documentation for
   * `@metamask/base-controller` for more information.
   *
   * Note that account-related notifications emitted when the extension
   * becomes unlocked are handled in MetaMaskController._onUnlock.
   */
  setupControllerEventSubscriptions() {
    let lastSelectedAddress;

    this.preferencesController.store.subscribe(async (state) => {
      const { currentLocale } = state;

      const { chainId } = this.networkController.state.providerConfig;
      await updateCurrentLocale(currentLocale);

      if (state.incomingTransactionsPreferences?.[chainId]) {
        this.txController.startIncomingTransactionPolling();
      } else {
        this.txController.stopIncomingTransactionPolling();
      }

      // TODO: Remove once the preferences controller has been replaced with the core monorepo implementation
      this.controllerMessenger.publish(
        `${this.preferencesController.name}:stateChange`,
        [state, []],
      );
    });

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
        const changedAccounts = getChangedAccounts(currentValue, previousValue);

        for (const [origin, accounts] of changedAccounts.entries()) {
          this._notifyAccountsChange(origin, accounts);
        }
      },
      getPermittedAccountsByOrigin,
    );

    this.controllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      async () => {
        await this.txController.updateIncomingTransactions();
      },
    );

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)

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
      (truncatedSnap, origin) => {
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
      (newSnap, oldVersion, origin) => {
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
        const notificationIds = Object.values(
          this.notificationController.state.notifications,
        ).reduce((idList, notification) => {
          if (notification.origin === truncatedSnap.id) {
            idList.push(notification.id);
          }
          return idList;
        }, []);

        this.dismissNotifications(notificationIds);

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

    ///: END:ONLY_INCLUDE_IF
  }

  /**
   * TODO:LegacyProvider: Delete
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  createPublicConfigStore() {
    // subset of state for metamask inpage provider
    const publicConfigStore = new ObservableStore();

    const selectPublicState = (chainId, { isUnlocked }) => {
      return {
        isUnlocked,
        chainId,
        networkVersion: this.deprecatedNetworkId ?? 'loading',
      };
    };

    const updatePublicConfigStore = (memState) => {
      const networkStatus =
        memState.networksMetadata[memState.selectedNetworkClientId]?.status;
      const { chainId } = this.networkController.state.providerConfig;
      if (networkStatus === NetworkStatus.Available) {
        publicConfigStore.putState(selectPublicState(chainId, memState));
      }
    };

    // setup memStore subscription hooks
    this.on('update', updatePublicConfigStore);
    updatePublicConfigStore(this.getState());

    return publicConfigStore;
  }

  /**
   * Gets relevant state for the provider of an external origin.
   *
   * @param {string} origin - The origin to get the provider state for.
   * @returns {Promise<{ isUnlocked: boolean, networkVersion: string, chainId: string, accounts: string[] }>} An object with relevant state properties.
   */
  async getProviderState(origin) {
    return {
      isUnlocked: this.isUnlocked(),
      accounts: await this.getPermittedAccounts(origin),
      ...this.getProviderNetworkState(
        this.preferencesController.getUseRequestQueue() ? origin : undefined,
      ),
    };
  }

  /**
   * Retrieves network state information relevant for external providers.
   *
   * @param {string} origin - The origin identifier for which network state is requested (default: 'metamask').
   * @returns {object} An object containing important network state properties, including chainId and networkVersion.
   */
  getProviderNetworkState(origin = METAMASK_DOMAIN) {
    let chainId;
    if (
      this.preferencesController.getUseRequestQueue() &&
      origin !== METAMASK_DOMAIN
    ) {
      const networkClientId = this.controllerMessenger.call(
        'SelectedNetworkController:getNetworkClientIdForDomain',
        origin,
      );

      const networkClient = this.controllerMessenger.call(
        'NetworkController:getNetworkClientById',
        networkClientId,
      );
      chainId = networkClient.configuration.chainId;
    } else {
      chainId = this.networkController.state.providerConfig.chainId;
    }

    return {
      chainId,
      networkVersion: this.deprecatedNetworkId ?? 'loading',
    };
  }

  /**
   * TODO: Delete when ready to remove `networkVersion` from provider object
   * Updates the `deprecatedNetworkId` value
   */
  async updateDeprecatedNetworkId() {
    try {
      this.deprecatedNetworkId = await this.deprecatedGetNetworkId();
    } catch (error) {
      console.error(error);
      this.deprecatedNetworkId = null;
    }
    this._notifyChainChange();
  }

  /**
   * TODO: Delete when ready to remove `networkVersion` from provider object
   * Gets current networkId as returned by `net_version`
   *
   * @returns {string} The networkId for the current network or null on failure
   * @throws Will throw if there is a problem getting the network version
   */
  async deprecatedGetNetworkId() {
    const ethQuery = this.controllerMessenger.call(
      'NetworkController:getEthQuery',
    );

    if (!ethQuery) {
      throw new Error('Provider has not been initialized');
    }

    return new Promise((resolve, reject) => {
      ethQuery.sendAsync({ method: 'net_version' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(convertNetworkId(result));
        }
      });
    });
  }

  //=============================================================================
  // EXPOSED TO THE UI SUBSYSTEM
  //=============================================================================

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * @returns {object} status
   */
  getState() {
    const { vault } = this.keyringController.state;
    const isInitialized = Boolean(vault);

    const flatState = this.memStore.getFlatState();

    // The vault should not be exposed to the UI
    delete flatState.vault;

    return {
      isInitialized,
      ...flatState,
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      // Snap state, source code and other files are stripped out to prevent piping to the MetaMask UI.
      snapStates: {},
      unencryptedSnapStates: {},
      snaps: Object.values(flatState.snaps ?? {}).reduce((acc, snap) => {
        // eslint-disable-next-line no-unused-vars
        const { sourceCode, auxiliaryFiles, ...rest } = snap;
        acc[snap.id] = rest;
        return acc;
      }, {}),
      ///: END:ONLY_INCLUDE_IF
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
      keyringController,
      nftController,
      nftDetectionController,
      currencyRateController,
      tokenDetectionController,
      ensController,
      gasFeeController,
      metaMetricsController,
      networkController,
      announcementController,
      onboardingController,
      permissionController,
      preferencesController,
      swapsController,
      tokensController,
      smartTransactionsController,
      txController,
      assetsContractController,
      backup,
      approvalController,
      phishingController,
    } = this;

    return {
      // etc
      getState: this.getState.bind(this),
      setCurrentCurrency: currencyRateController.setCurrentCurrency.bind(
        currencyRateController,
      ),
      setUseBlockie: preferencesController.setUseBlockie.bind(
        preferencesController,
      ),
      setUseNonceField: preferencesController.setUseNonceField.bind(
        preferencesController,
      ),
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
      getUseRequestQueue: this.preferencesController.getUseRequestQueue.bind(
        this.preferencesController,
      ),
      getProviderConfig: () => this.networkController.state.providerConfig,

      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      setSecurityAlertsEnabled:
        preferencesController.setSecurityAlertsEnabled.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      setAddSnapAccountEnabled:
        preferencesController.setAddSnapAccountEnabled.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF
      setUseExternalNameSources:
        preferencesController.setUseExternalNameSources.bind(
          preferencesController,
        ),
      setUseRequestQueue: this.setUseRequestQueue.bind(this),
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
      setCurrentLocale: preferencesController.setCurrentLocale.bind(
        preferencesController,
      ),
      setIncomingTransactionsPreferences:
        preferencesController.setIncomingTransactionsPreferences.bind(
          preferencesController,
        ),
      markPasswordForgotten: this.markPasswordForgotten.bind(this),
      unMarkPasswordForgotten: this.unMarkPasswordForgotten.bind(this),
      getRequestAccountTabIds: this.getRequestAccountTabIds,
      getOpenMetamaskTabsIds: this.getOpenMetamaskTabsIds,
      markNotificationPopupAsAutomaticallyClosed: () =>
        this.notificationManager.markAsAutomaticallyClosed(),

      // approval
      requestUserApproval:
        approvalController.addAndShowApprovalRequest.bind(approvalController),

      // primary keyring management
      addNewAccount: this.addNewAccount.bind(this),
      getSeedPhrase: this.getSeedPhrase.bind(this),
      resetAccount: this.resetAccount.bind(this),
      removeAccount: this.removeAccount.bind(this),
      importAccountWithStrategy: this.importAccountWithStrategy.bind(this),
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      getAccountsBySnapId: (snapId) => getAccountsBySnapId(this, snapId),
      ///: END:ONLY_INCLUDE_IF

      // hardware wallets
      connectHardware: this.connectHardware.bind(this),
      forgetDevice: this.forgetDevice.bind(this),
      checkHardwareStatus: this.checkHardwareStatus.bind(this),
      unlockHardwareWalletAccount: this.unlockHardwareWalletAccount.bind(this),
      attemptLedgerTransportCreation:
        this.attemptLedgerTransportCreation.bind(this),

      // qr hardware devices
      submitQRHardwareCryptoHDKey:
        keyringController.submitQRCryptoHDKey.bind(keyringController),
      submitQRHardwareCryptoAccount:
        keyringController.submitQRCryptoAccount.bind(keyringController),
      cancelSyncQRHardware:
        keyringController.cancelQRSynchronization.bind(keyringController),
      submitQRHardwareSignature:
        keyringController.submitQRSignature.bind(keyringController),
      cancelQRHardwareSignRequest:
        keyringController.cancelQRSignRequest.bind(keyringController),

      // vault management
      submitPassword: this.submitPassword.bind(this),
      verifyPassword: this.verifyPassword.bind(this),

      // network management
      setProviderType: (type) => {
        return this.networkController.setProviderType(type);
      },
      setActiveNetwork: (networkConfigurationId) => {
        return this.networkController.setActiveNetwork(networkConfigurationId);
      },
      rollbackToPreviousProvider:
        networkController.rollbackToPreviousProvider.bind(networkController),
      removeNetworkConfiguration:
        networkController.removeNetworkConfiguration.bind(networkController),
      upsertNetworkConfiguration:
        this.networkController.upsertNetworkConfiguration.bind(
          this.networkController,
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
          this.preferencesController.setSelectedAddress(address);
        } else {
          throw new Error(`No account found for address: ${address}`);
        }
      },
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
      setDisabledRpcMethodPreference:
        preferencesController.setDisabledRpcMethodPreference.bind(
          preferencesController,
        ),
      getRpcMethodPreferences:
        preferencesController.getRpcMethodPreferences.bind(
          preferencesController,
        ),
      setAdvancedGasFee: preferencesController.setAdvancedGasFee.bind(
        preferencesController,
      ),
      setTheme: preferencesController.setTheme.bind(preferencesController),
      setTransactionSecurityCheckEnabled:
        preferencesController.setTransactionSecurityCheckEnabled.bind(
          preferencesController,
        ),
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      setSnapsAddSnapAccountModalDismissed:
        preferencesController.setSnapsAddSnapAccountModalDismissed.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IF

      // AccountsController
      setSelectedInternalAccount: (id) => {
        const account = this.accountsController.getAccount(id);
        if (account) {
          this.preferencesController.setSelectedAddress(account.address);
          this.accountsController.setSelectedAccount(id);
        }
      },

      setAccountName:
        accountsController.setAccountName.bind(accountsController),

      setAccountLabel: (address, label) => {
        this.preferencesController.setAccountLabel(address, label);
        const account = this.accountsController.getAccountByAddress(address);
        if (account === undefined) {
          throw new Error(`No account found for address: ${address}`);
        }
        this.accountsController.setAccountName(account.id, label);
      },

      // AssetsContractController
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),
      getTokenSymbol: this.getTokenSymbol.bind(this),

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

      isNftOwner: nftController.isNftOwner.bind(nftController),

      // AddressController
      setAddressBook: addressBookController.set.bind(addressBookController),
      removeFromAddressBook: addressBookController.delete.bind(
        addressBookController,
      ),

      // AppStateController
      setLastActiveTime:
        appStateController.setLastActiveTime.bind(appStateController),
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
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      setSnapsInstallPrivacyWarningShownStatus:
        appStateController.setSnapsInstallPrivacyWarningShownStatus.bind(
          appStateController,
        ),
      ///: END:ONLY_INCLUDE_IF
      setOutdatedBrowserWarningLastShown:
        appStateController.setOutdatedBrowserWarningLastShown.bind(
          appStateController,
        ),
      setShowTestnetMessageInDropdown:
        appStateController.setShowTestnetMessageInDropdown.bind(
          appStateController,
        ),
      setShowBetaHeader:
        appStateController.setShowBetaHeader.bind(appStateController),
      setShowPermissionsTour:
        appStateController.setShowPermissionsTour.bind(appStateController),
      setShowProductTour:
        appStateController.setShowProductTour.bind(appStateController),
      setShowAccountBanner:
        appStateController.setShowAccountBanner.bind(appStateController),
      setShowNetworkBanner:
        appStateController.setShowNetworkBanner.bind(appStateController),
      updateNftDropDownState:
        appStateController.updateNftDropDownState.bind(appStateController),
      setFirstTimeUsedNetwork:
        appStateController.setFirstTimeUsedNetwork.bind(appStateController),

      // EnsController
      tryReverseResolveAddress:
        ensController.reverseResolveAddress.bind(ensController),

      // KeyringController
      setLocked: this.setLocked.bind(this),
      createNewVaultAndKeychain: this.createNewVaultAndKeychain.bind(this),
      createNewVaultAndRestore: this.createNewVaultAndRestore.bind(this),
      exportAccount: this.exportAccount.bind(this),

      // txController
      updateTransaction: txController.updateTransaction.bind(txController),
      approveTransactionsWithSameNonce:
        txController.approveTransactionsWithSameNonce.bind(txController),
      createCancelTransaction: this.createCancelTransaction.bind(this),
      createSpeedUpTransaction: this.createSpeedUpTransaction.bind(this),
      estimateGas: this.estimateGas.bind(this),
      getNextNonce: this.getNextNonce.bind(this),
      addTransaction: (transactionParams, transactionOptions) =>
        addTransaction(
          this.getAddTransactionRequest({
            transactionParams,
            transactionOptions,
            waitForSubmit: false,
          }),
          this.updateSecurityAlertResponseByTxId.bind(this),
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
          this.updateSecurityAlertResponseByTxId.bind(this),
        ),
      createTransactionEventFragment:
        createTransactionEventFragmentWithTxId.bind(
          null,
          this.getTransactionMetricsRequest(),
        ),
      getTransactions: this.txController.getTransactions.bind(
        this.txController,
      ),
      updateEditableParams: this.txController.updateEditableParams.bind(
        this.txController,
      ),
      updateTransactionGasFees:
        txController.updateTransactionGasFees.bind(txController),
      updateTransactionSendFlowHistory:
        txController.updateTransactionSendFlowHistory.bind(txController),
      updatePreviousGasParams:
        txController.updatePreviousGasParams.bind(txController),
      abortTransactionSigning:
        txController.abortTransactionSigning.bind(txController),

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
      ...getPermissionBackgroundApiMethods(permissionController),

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      connectCustodyAddresses: this.mmiController.connectCustodyAddresses.bind(
        this.mmiController,
      ),
      getCustodianAccounts: this.mmiController.getCustodianAccounts.bind(
        this.mmiController,
      ),
      getCustodianAccountsByAddress:
        this.mmiController.getCustodianAccountsByAddress.bind(
          this.mmiController,
        ),
      getCustodianTransactionDeepLink:
        this.mmiController.getCustodianTransactionDeepLink.bind(
          this.mmiController,
        ),
      getCustodianConfirmDeepLink:
        this.mmiController.getCustodianConfirmDeepLink.bind(this.mmiController),
      getCustodianSignMessageDeepLink:
        this.mmiController.getCustodianSignMessageDeepLink.bind(
          this.mmiController,
        ),
      getCustodianToken: this.mmiController.getCustodianToken.bind(
        this.mmiController,
      ),
      getCustodianJWTList: this.mmiController.getCustodianJWTList.bind(
        this.mmiController,
      ),
      getAllCustodianAccountsWithToken:
        this.mmiController.getAllCustodianAccountsWithToken.bind(
          this.mmiController,
        ),
      setCustodianNewRefreshToken:
        this.mmiController.setCustodianNewRefreshToken.bind(this.mmiController),
      setWaitForConfirmDeepLinkDialog:
        this.custodyController.setWaitForConfirmDeepLinkDialog.bind(
          this.custodyController,
        ),
      getMmiConfiguration:
        this.mmiConfigurationController.getConfiguration.bind(
          this.mmiConfigurationController,
        ),
      removeAddTokenConnectRequest:
        this.institutionalFeaturesController.removeAddTokenConnectRequest.bind(
          this.institutionalFeaturesController,
        ),
      showInteractiveReplacementTokenBanner:
        appStateController.showInteractiveReplacementTokenBanner.bind(
          appStateController,
        ),
      setCustodianDeepLink:
        appStateController.setCustodianDeepLink.bind(appStateController),
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
      dismissNotifications: this.dismissNotifications.bind(this),
      markNotificationsAsRead: this.markNotificationsAsRead.bind(this),
      disconnectOriginFromSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:disconnectOrigin',
      ),
      updateNetworksList: this.updateNetworksList.bind(this),
      updateAccountsList: this.updateAccountsList.bind(this),
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
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(desktop)
      // Desktop
      getDesktopEnabled: this.desktopController.getDesktopEnabled.bind(
        this.desktopController,
      ),
      setDesktopEnabled: this.desktopController.setDesktopEnabled.bind(
        this.desktopController,
      ),
      generateDesktopOtp: this.desktopController.generateOtp.bind(
        this.desktopController,
      ),
      testDesktopConnection: this.desktopController.testDesktopConnection.bind(
        this.desktopController,
      ),
      disableDesktop: this.desktopController.disableDesktop.bind(
        this.desktopController,
      ),
      ///: END:ONLY_INCLUDE_IF

      // swaps
      fetchAndSetQuotes:
        swapsController.fetchAndSetQuotes.bind(swapsController),
      setSelectedQuoteAggId:
        swapsController.setSelectedQuoteAggId.bind(swapsController),
      resetSwapsState: swapsController.resetSwapsState.bind(swapsController),
      setSwapsTokens: swapsController.setSwapsTokens.bind(swapsController),
      clearSwapsQuotes: swapsController.clearSwapsQuotes.bind(swapsController),
      setApproveTxId: swapsController.setApproveTxId.bind(swapsController),
      setTradeTxId: swapsController.setTradeTxId.bind(swapsController),
      setSwapsTxGasPrice:
        swapsController.setSwapsTxGasPrice.bind(swapsController),
      setSwapsTxGasLimit:
        swapsController.setSwapsTxGasLimit.bind(swapsController),
      setSwapsTxMaxFeePerGas:
        swapsController.setSwapsTxMaxFeePerGas.bind(swapsController),
      setSwapsTxMaxFeePriorityPerGas:
        swapsController.setSwapsTxMaxFeePriorityPerGas.bind(swapsController),
      safeRefetchQuotes:
        swapsController.safeRefetchQuotes.bind(swapsController),
      stopPollingForQuotes:
        swapsController.stopPollingForQuotes.bind(swapsController),
      setBackgroundSwapRouteState:
        swapsController.setBackgroundSwapRouteState.bind(swapsController),
      resetPostFetchState:
        swapsController.resetPostFetchState.bind(swapsController),
      setSwapsErrorKey: swapsController.setSwapsErrorKey.bind(swapsController),
      setInitialGasEstimate:
        swapsController.setInitialGasEstimate.bind(swapsController),
      setCustomApproveTxData:
        swapsController.setCustomApproveTxData.bind(swapsController),
      setSwapsLiveness: swapsController.setSwapsLiveness.bind(swapsController),
      setSwapsFeatureFlags:
        swapsController.setSwapsFeatureFlags.bind(swapsController),
      setSwapsUserFeeLevel:
        swapsController.setSwapsUserFeeLevel.bind(swapsController),
      setSwapsQuotesPollingLimitEnabled:
        swapsController.setSwapsQuotesPollingLimitEnabled.bind(swapsController),

      // Smart Transactions
      setSmartTransactionsOptInStatus:
        smartTransactionsController.setOptInState.bind(
          smartTransactionsController,
        ),
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
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      trackInsightSnapView: this.trackInsightSnapView.bind(this),
      ///: END:ONLY_INCLUDE_IF
      // approval controller
      resolvePendingApproval: this.resolvePendingApproval,
      rejectPendingApproval: this.rejectPendingApproval,

      // Notifications
      updateViewedNotifications: announcementController.updateViewed.bind(
        announcementController,
      ),

      // GasFeeController
      gasFeeStartPollingByNetworkClientId:
        gasFeeController.startPollingByNetworkClientId.bind(gasFeeController),

      gasFeeStopPollingByPollingToken:
        gasFeeController.stopPollingByPollingToken.bind(gasFeeController),

      getGasFeeEstimatesAndStartPolling:
        gasFeeController.getGasFeeEstimatesAndStartPolling.bind(
          gasFeeController,
        ),

      disconnectGasFeeEstimatePoller:
        gasFeeController.disconnectPoller.bind(gasFeeController),

      getGasFeeTimeEstimate:
        gasFeeController.getTimeEstimate.bind(gasFeeController),

      addPollingTokenToAppState:
        appStateController.addPollingToken.bind(appStateController),

      removePollingTokenFromAppState:
        appStateController.removePollingToken.bind(appStateController),

      // Backup
      backupUserData: backup.backupUserData.bind(backup),
      restoreUserData: backup.restoreUserData.bind(backup),

      // TokenDetectionController
      detectTokens: tokenDetectionController.detectTokens.bind(
        tokenDetectionController,
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
      getBalancesInSingleCall:
        assetsContractController.getBalancesInSingleCall.bind(
          assetsContractController,
        ),

      // E2E testing
      throwTestError: this.throwTestError.bind(this),

      updateProposedNames: this.nameController.updateProposedNames.bind(
        this.nameController,
      ),
      setName: this.nameController.setName.bind(this.nameController),
    };
  }

  async exportAccount(address, password) {
    await this.verifyPassword(password);
    return this.keyringController.exportAccount(password, address);
  }

  async getTokenStandardAndDetails(address, userAddress, tokenId) {
    const { tokenList } = this.tokenListController.state;
    const { tokens } = this.tokensController.state;

    const staticTokenListDetails =
      STATIC_MAINNET_TOKEN_LIST[address.toLowerCase()] || {};
    const tokenListDetails = tokenList[address.toLowerCase()] || {};
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

    const tokenCanBeTreatedAsAnERC20 =
      tokenDetailsStandardIsERC20 ||
      (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

    let details;
    if (tokenCanBeTreatedAsAnERC20) {
      try {
        const balance = await fetchTokenBalance(
          address,
          userAddress,
          this.provider,
        );

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
      details = await this.assetsContractController.getTokenStandardAndDetails(
        address,
        userAddress,
        tokenId,
      );
    }

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
   * @returns {object} vault
   */
  async createNewVaultAndKeychain(password) {
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      const vault = await this.keyringController.createNewVaultAndKeychain(
        password,
      );

      const accounts = await this.keyringController.getAccounts();
      this.preferencesController.setAddresses(accounts);
      this.selectFirstAccount();

      return vault;
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
      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);

      // clear known identities
      this.preferencesController.setAddresses([]);

      // clear permissions
      this.permissionController.clearState();

      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      // Clear snap state
      this.snapController.clearState();
      // Clear notification state
      this.notificationController.clear();
      ///: END:ONLY_INCLUDE_IF

      // clear accounts in accountTracker
      this.accountTracker.clearAccounts();

      this.txController.clearUnapprovedTransactions();

      // create new vault
      const vault = await this.keyringController.createNewVaultAndRestore(
        password,
        this._convertMnemonicToWordlistIndices(seedPhraseAsBuffer),
      );

      // Scan accounts until we find an empty one
      const { chainId } = this.networkController.state.providerConfig;
      const ethQuery = new EthQuery(this.provider);
      const accounts = await this.keyringController.getAccounts();
      let address = accounts[accounts.length - 1];

      for (let count = accounts.length; ; count++) {
        const balance = await this.getBalance(address, ethQuery);

        if (balance === '0x0') {
          // This account has no balance, so check for tokens
          await this.tokenDetectionController.detectTokens({
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
        ({ addedAccountAddress: address } =
          await this.keyringController.addNewAccount(count));
      }

      // This must be set as soon as possible to communicate to the
      // keyring's iframe and have the setting initialized properly
      // Optimistically called to not block MetaMask login due to
      // Ledger Keyring GitHub downtime
      this.setLedgerTransportPreference();

      this.selectFirstAccount();

      return vault;
    } finally {
      releaseLock();
    }
  }

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
   * Get an account balance from the AccountTracker or request it directly from the network.
   *
   * @param {string} address - The account address
   * @param {EthQuery} ethQuery - The EthQuery instance to use when asking the network
   */
  getBalance(address, ethQuery) {
    return new Promise((resolve, reject) => {
      const cached = this.accountTracker.store.getState().accounts[address];

      if (cached && cached.balance) {
        resolve(cached.balance);
      } else {
        ethQuery.getBalance(address, (error, balance) => {
          if (error) {
            reject(error);
            log.error(error);
          } else {
            resolve(balance || '0x0');
          }
        });
      }
    });
  }

  /**
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   */
  async submitPassword(password) {
    await this.keyringController.submitPassword(password);

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.mmiController.onSubmitPassword();
    ///: END:ONLY_INCLUDE_IF

    try {
      await this.blockTracker.checkForLatestBlock();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    await this.accountsController.updateAccounts();

    // This must be set as soon as possible to communicate to the
    // keyring's iframe and have the setting initialized properly
    // Optimistically called to not block MetaMask login due to
    // Ledger Keyring GitHub downtime
    this.setLedgerTransportPreference();
  }

  async _loginUser(password) {
    try {
      // Automatic login via config password
      await this.submitPassword(password);

      // Updating accounts in this.accountTracker before starting UI syncing ensure that
      // state has account balance before it is synced with UI
      await this.accountTracker.updateAccountsAllActiveNetworks();
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
  async submitEncryptionKey() {
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
   * Sets the first account in the state to the selected address
   */
  selectFirstAccount() {
    const { identities } = this.preferencesController.store.getState();
    const [address] = Object.keys(identities);
    this.preferencesController.setSelectedAddress(address);

    const [account] = this.accountsController.listAccounts();
    this.accountsController.setSelectedAccount(account.id);
  }

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

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  async getCustodyKeyringIfExists(address) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = this.keyringController.getKeyringsByType(custodyType)[0];
    return keyring?.getAccountDetails(address) ? keyring : undefined;
  }
  ///: END:ONLY_INCLUDE_IF

  //
  // Hardware
  //

  async getKeyringForDevice(deviceName, hdPath = null) {
    const keyringOverrides = this.opts.overrides?.keyrings;
    let keyringName = null;
    switch (deviceName) {
      case HardwareDeviceNames.trezor:
        keyringName = keyringOverrides?.trezor?.type || TrezorKeyring.type;
        break;
      case HardwareDeviceNames.ledger:
        keyringName = keyringOverrides?.ledger?.type || LedgerKeyring.type;
        break;
      case HardwareDeviceNames.qr:
        keyringName = QRHardwareKeyring.type;
        break;
      case HardwareDeviceNames.lattice:
        keyringName = keyringOverrides?.lattice?.type || LatticeKeyring.type;
        break;
      default:
        throw new Error(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
    }
    let [keyring] = await this.keyringController.getKeyringsByType(keyringName);
    if (!keyring) {
      keyring = await this.keyringController.addNewKeyring(keyringName);
    }
    if (hdPath && keyring.setHdPath) {
      keyring.setHdPath(hdPath);
    }
    if (deviceName === HardwareDeviceNames.lattice) {
      keyring.appName = 'MetaMask';
    }
    if (deviceName === HardwareDeviceNames.trezor) {
      const model = keyring.getModel();
      this.appStateController.setTrezorModel(model);
    }

    keyring.network = this.networkController.state.providerConfig.type;

    return keyring;
  }

  async attemptLedgerTransportCreation() {
    const keyring = await this.getKeyringForDevice(HardwareDeviceNames.ledger);
    return await keyring.attemptMakeApp();
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
    const keyring = await this.getKeyringForDevice(deviceName, hdPath);

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
    this.accountTracker.syncWithAddresses(accountsToTrack);
    return accounts;
  }

  /**
   * Check if the device is unlocked
   *
   * @param deviceName
   * @param hdPath
   * @returns {Promise<boolean>}
   */
  async checkHardwareStatus(deviceName, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath);
    return keyring.isUnlocked();
  }

  /**
   * Clear
   *
   * @param deviceName
   * @returns {Promise<boolean>}
   */
  async forgetDevice(deviceName) {
    const keyring = await this.getKeyringForDevice(deviceName);

    for (const address of keyring.accounts) {
      await this.removeAccount(address);
    }

    keyring.forgetDevice();
    return true;
  }

  /**
   * Retrieves the keyring for the selected address and using the .type returns
   * a subtype for the account. Either 'hardware', 'imported', 'snap', or 'MetaMask'.
   *
   * @param {string} address - Address to retrieve keyring for
   * @returns {'hardware' | 'imported' | 'snap' | 'MetaMask'}
   */
  async getAccountType(address) {
    const keyringType = await this.keyringController.getAccountKeyringType(
      address,
    );
    switch (keyringType) {
      case KeyringType.trezor:
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
    const keyring = await this.keyringController.getKeyringForAccount(address);
    switch (keyring.type) {
      case KeyringType.trezor:
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
  }

  /**
   * get hardware account label
   *
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
    const keyring = await this.getKeyringForDevice(deviceName, hdPath);

    keyring.setAccountToUnlock(index);
    const oldAccounts = await this.keyringController.getAccounts();
    const keyState = await this.keyringController.addNewAccountForKeyring(
      keyring,
    );
    const newAccounts = await this.keyringController.getAccounts();
    this.preferencesController.setAddresses(newAccounts);
    newAccounts.forEach((address) => {
      if (!oldAccounts.includes(address)) {
        const label = this.getAccountLabel(
          deviceName === HardwareDeviceNames.qr
            ? keyring.getName()
            : deviceName,
          index,
          hdPathDescription,
        );
        // Set the account label to Trezor 1 /  Ledger 1 / QR Hardware 1, etc
        this.preferencesController.setAccountLabel(address, label);
        // Select the account
        this.preferencesController.setSelectedAddress(address);

        // It is expected that the account also exist in the accounts-controller
        // in other case, an error shall be thrown
        const account = this.accountsController.getAccountByAddress(address);
        this.accountsController.setAccountName(account.id, label);
      }
    });

    const accounts = this.accountsController.listAccounts();

    const { identities } = this.preferencesController.store.getState();
    return { ...keyState, identities, accounts };
  }

  //
  // Account Management
  //

  /**
   * Adds a new account to the default (first) HD seed phrase Keyring.
   *
   * @param accountCount
   * @returns {Promise<string>} The address of the newly-created account.
   */
  async addNewAccount(accountCount) {
    const oldAccounts = await this.keyringController.getAccounts();

    const { addedAccountAddress } = await this.keyringController.addNewAccount(
      accountCount,
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
   * @param password
   * @returns {Promise<number[]>} The seed phrase to be confirmed by the user,
   * encoded as an array of UTF-8 bytes.
   */
  async getSeedPhrase(password) {
    return this._convertEnglishWordlistIndicesToCodepoints(
      await this.keyringController.exportSeedPhrase(password),
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
    this.txController.wipeTransactions(true, selectedAddress);
    this.networkController.resetConnection();

    return selectedAddress;
  }

  /**
   * Gets the permitted accounts for the specified origin. Returns an empty
   * array if no accounts are permitted.
   *
   * @param {string} origin - The origin whose exposed accounts to retrieve.
   * @param {boolean} [suppressUnauthorizedError] - Suppresses the unauthorized error.
   * @returns {Promise<string[]>} The origin's permitted accounts, or an empty
   * array.
   */
  async getPermittedAccounts(
    origin,
    { suppressUnauthorizedError = true } = {},
  ) {
    try {
      return await this.permissionController.executeRestrictedMethod(
        origin,
        RestrictedMethods.eth_accounts,
      );
    } catch (error) {
      if (
        suppressUnauthorizedError &&
        error.code === rpcErrorCodes.provider.unauthorized
      ) {
        return [];
      }
      throw error;
    }
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
      CaveatTypes.restrictReturnedAccounts,
      (existingAccounts) =>
        CaveatMutatorFactories[
          CaveatTypes.restrictReturnedAccounts
        ].removeAccount(targetAccount, existingAccounts),
    );
  }

  /**
   * Removes an account from state / storage.
   *
   * @param {string[]} address - A hex address
   */
  async removeAccount(address) {
    // Remove all associated permissions
    this.removeAllAccountPermissions(address);

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.custodyController.removeAccount(address);
    ///: END:ONLY_INCLUDE_IF(build-mmi)

    const keyring = await this.keyringController.getKeyringForAccount(address);
    // Remove account from the keyring
    await this.keyringController.removeAccount(address);
    const updatedKeyringAccounts = keyring ? await keyring.getAccounts() : {};
    if (updatedKeyringAccounts?.length === 0) {
      keyring.destroy?.();
    }

    return address;
  }

  /**
   * Imports an account with the specified import strategy.
   * These are defined in app/scripts/account-import-strategies
   * Each strategy represents a different way of serializing an Ethereum key pair.
   *
   * @param {'privateKey' | 'json'} strategy - A unique identifier for an account import strategy.
   * @param {any} args - The data required by that strategy to import an account.
   */
  async importAccountWithStrategy(strategy, args) {
    const { importedAccountAddress } =
      await this.keyringController.importAccountWithStrategy(strategy, args);
    // set new account as selected
    this.preferencesController.setSelectedAddress(importedAccountAddress);
  }

  // ---------------------------------------------------------------------------
  // Identity Management (signature operations)

  getAddTransactionRequest({
    transactionParams,
    transactionOptions,
    dappRequest,
  }) {
    return {
      dappRequest,
      networkClientId:
        dappRequest?.networkClientId ??
        this.networkController.state.selectedNetworkClientId,
      selectedAccount: this.accountsController.getAccountByAddress(
        transactionParams.from,
      ),
      transactionController: this.txController,
      transactionOptions,
      transactionParams,
      userOperationController: this.userOperationController,
      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      ppomController: this.ppomController,
      securityAlertsEnabled:
        this.preferencesController.store.getState()?.securityAlertsEnabled,
      chainId: this.networkController.state.providerConfig.chainId,
      ///: END:ONLY_INCLUDE_IF
    };
  }

  /**
   * @returns {boolean} true if the keyring type supports EIP-1559
   */
  async getCurrentAccountEIP1559Compatibility() {
    return true;
  }

  //=============================================================================
  // END (VAULT / KEYRING RELATED METHODS)
  //=============================================================================

  /**
   * Allows a user to attempt to cancel a previously submitted transaction
   * by creating a new transaction.
   *
   * @param {number} originalTxId - the id of the txMeta that you want to
   *  attempt to cancel
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
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
   *  attempt to speed up
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
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
      return new EthJSQuery(this.provider).estimateGas(
        estimateGasParams,
        (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res.toString(16));
        },
      );
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
        return this.nftController.watchNft(asset, type, origin);
      default:
        throw new Error(`Asset type ${type} not supported`);
    }
  };

  async updateSecurityAlertResponseByTxId(req, securityAlertResponse) {
    let foundConfirmation = false;

    while (!foundConfirmation) {
      if (SIGNING_METHODS.includes(req.method)) {
        foundConfirmation = Object.values(
          this.signatureController.messages,
        ).find(
          (message) =>
            message.securityAlertResponse?.securityAlertId ===
            req.securityAlertResponse.securityAlertId,
        );
      } else {
        foundConfirmation = this.txController.state.transactions.find(
          (meta) =>
            meta.securityAlertResponse?.securityAlertId ===
            req.securityAlertResponse.securityAlertId,
        );
      }
      if (!foundConfirmation) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (SIGNING_METHODS.includes(req.method)) {
      this.appStateController.addSignatureSecurityAlertResponse(
        securityAlertResponse,
      );
    } else {
      this.txController.updateSecurityAlertResponse(
        foundConfirmation.id,
        securityAlertResponse,
      );
    }
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
  // REQUEST QUEUE
  //=============================================================================

  setUseRequestQueue(value) {
    this.preferencesController.setUseRequestQueue(value);
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
  setupUntrustedCommunication({ connectionStream, sender, subjectType }) {
    const { usePhishDetect } = this.preferencesController.store.getState();

    let _subjectType;
    if (subjectType) {
      _subjectType = subjectType;
    } else if (sender.id && sender.id !== this.extension.runtime.id) {
      _subjectType = SubjectType.Extension;
    } else {
      _subjectType = SubjectType.Website;
    }

    if (sender.url) {
      const { hostname } = new URL(sender.url);
      this.phishingController.maybeUpdateState();
      // Check if new connection is blocked if phishing detection is on
      const phishingTestResponse = this.phishingController.test(hostname);
      if (usePhishDetect && phishingTestResponse?.result) {
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

    // setup multiplexing
    const mux = setupMultiplex(connectionStream);

    // messages between inpage and background
    this.setupProviderConnection(
      mux.createStream('metamask-provider'),
      sender,
      _subjectType,
    );

    // TODO:LegacyProvider: Delete
    if (sender.url) {
      // legacy streams
      this.setupPublicConfig(mux.createStream('publicConfig'));
    }
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
    this.setupProviderConnection(
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
    const { usePhishDetect } = this.preferencesController.store.getState();

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
    const api = this.getApi();

    // report new active controller connection
    this.activeControllerConnections += 1;
    this.emit('controllerConnectionChanged', this.activeControllerConnections);

    // set up postStream transport
    outStream.on(
      'data',
      createMetaRPCHandler(
        api,
        outStream,
        this.store,
        this.localStoreApiWrapper,
      ),
    );
    const handleUpdate = (update) => {
      if (outStream._writableState.ended) {
        return;
      }
      // send notification to client-side
      outStream.write({
        jsonrpc: '2.0',
        method: 'sendUpdate',
        params: [update],
      });
    };
    this.on('update', handleUpdate);
    const startUISync = () => {
      if (outStream._writableState.ended) {
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

    outStream.on('end', () => {
      this.activeControllerConnections -= 1;
      this.emit(
        'controllerConnectionChanged',
        this.activeControllerConnections,
      );
      this.removeListener('update', handleUpdate);
    });
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   *
   * @param {*} outStream - The stream to provide over.
   * @param {MessageSender | SnapSender} sender - The sender of the messages on this stream
   * @param {SubjectType} subjectType - The type of the sender, i.e. subject.
   */
  setupProviderConnection(outStream, sender, subjectType) {
    let origin;
    if (subjectType === SubjectType.Internal) {
      origin = ORIGIN_METAMASK;
    }
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    else if (subjectType === SubjectType.Snap) {
      origin = sender.snapId;
    }
    ///: END:ONLY_INCLUDE_IF
    else {
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

    const engine = this.setupProviderEngine({
      origin,
      sender,
      subjectType,
      tabId,
    });

    // setup connection
    const providerStream = createEngineStream({ engine });

    const connectionId = this.addConnection(origin, { engine });

    pump(outStream, providerStream, outStream, (err) => {
      // handle any middleware cleanup
      engine._middleware.forEach((mid) => {
        if (mid.destroy && typeof mid.destroy === 'function') {
          mid.destroy();
        }
      });
      connectionId && this.removeConnection(origin, connectionId);
      if (err) {
        log.error(err);
      }
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  /**
   * For snaps running in workers.
   *
   * @param snapId
   * @param connectionStream
   */
  setupSnapProvider(snapId, connectionStream) {
    this.setupUntrustedCommunication({
      connectionStream,
      sender: { snapId },
      subjectType: SubjectType.Snap,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * A method for creating a provider that is safely restricted for the requesting subject.
   *
   * @param {object} options - Provider engine options
   * @param {string} options.origin - The origin of the sender
   * @param {MessageSender | SnapSender} options.sender - The sender object.
   * @param {string} options.subjectType - The type of the sender subject.
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   */
  setupProviderEngine({ origin, subjectType, sender, tabId }) {
    // setup json rpc engine stack
    const engine = new JsonRpcEngine();

    // append origin to each request
    engine.push(createOriginMiddleware({ origin }));

    // append selectedNetworkClientId to each request
    engine.push(createSelectedNetworkMiddleware(this.controllerMessenger));

    let proxyClient;
    if (
      this.preferencesController.getUseRequestQueue() &&
      this.selectedNetworkController.state.domains[origin]
    ) {
      proxyClient =
        this.selectedNetworkController.getProviderAndBlockTracker(origin);
    } else {
      // if useRequestQueue is false we want to use the globally selected network provider/blockTracker
      // since this means the per domain network feature is disabled

      // if the origin is not in the selectedNetworkController's `domains` state,
      // this means that origin does not have permissions (is not connected to the wallet)
      // and will therefore not have its own selected network even if useRequestQueue is true
      // and so in this case too we want to use the globally selected network provider/blockTracker
      proxyClient = this.networkController.getProviderAndBlockTracker();
    }

    const requestQueueMiddleware = createQueuedRequestMiddleware({
      messenger: this.controllerMessenger,
      useRequestQueue: this.preferencesController.getUseRequestQueue.bind(
        this.preferencesController,
      ),
    });
    // add some middleware that will switch chain on each request (as needed)
    engine.push(requestQueueMiddleware);

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware(proxyClient);

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager(proxyClient);
    subscriptionManager.events.on('notification', (message) =>
      engine.emit('notification', message),
    );

    if (isManifestV3) {
      engine.push(createDupeReqFilterMiddleware());
    }

    // append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }));
    }

    // logging
    engine.push(createLoggerMiddleware({ origin }));
    engine.push(this.permissionLogController.createMiddleware());

    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    engine.push(
      createPPOMMiddleware(
        this.ppomController,
        this.preferencesController,
        this.networkController,
        this.appStateController,
        this.updateSecurityAlertResponseByTxId.bind(this),
      ),
    );
    ///: END:ONLY_INCLUDE_IF

    engine.push(
      createRPCMethodTrackingMiddleware({
        trackEvent: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
        getMetricsState: this.metaMetricsController.store.getState.bind(
          this.metaMetricsController.store,
        ),
        securityProviderRequest: this.securityProviderRequest.bind(this),
        getAccountType: this.getAccountType.bind(this),
        getDeviceModel: this.getDeviceModel.bind(this),
        snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
          name: 'SnapAndHardwareMessenger',
          allowedActions: [
            'KeyringController:getKeyringForAccount',
            'SnapController:get',
            'AccountsController:getSelectedAccount',
          ],
        }),
        ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
        appStateController: this.appStateController,
        ///: END:ONLY_INCLUDE_IF
      }),
    );

    // onboarding
    if (subjectType === SubjectType.Website) {
      engine.push(
        createOnboardingMiddleware({
          location: sender.url,
          registerOnboarding: this.onboardingController.registerOnboarding,
        }),
      );
    }

    // Unrestricted/permissionless RPC method implementations
    engine.push(
      createMethodMiddleware({
        origin,

        subjectType,

        // Miscellaneous
        addSubjectMetadata:
          this.subjectMetadataController.addSubjectMetadata.bind(
            this.subjectMetadataController,
          ),
        metamaskState: this.getState(),
        getProviderState: this.getProviderState.bind(this),
        getUnlockPromise: this.appStateController.getUnlockPromise.bind(
          this.appStateController,
        ),
        handleWatchAssetRequest: this.handleWatchAssetRequest.bind(this),
        requestUserApproval:
          this.approvalController.addAndShowApprovalRequest.bind(
            this.approvalController,
          ),
        startApprovalFlow: this.approvalController.startFlow.bind(
          this.approvalController,
        ),
        endApprovalFlow: this.approvalController.endFlow.bind(
          this.approvalController,
        ),
        setApprovalFlowLoadingText:
          this.approvalController.setFlowLoadingText.bind(
            this.approvalController,
          ),
        showApprovalSuccess: this.approvalController.success.bind(
          this.approvalController,
        ),
        showApprovalError: this.approvalController.error.bind(
          this.approvalController,
        ),
        sendMetrics: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
        // Permission-related
        getAccounts: this.getPermittedAccounts.bind(this, origin),
        getPermissionsForOrigin: this.permissionController.getPermissions.bind(
          this.permissionController,
          origin,
        ),
        hasPermission: this.permissionController.hasPermission.bind(
          this.permissionController,
          origin,
        ),
        hasPermissions: this.permissionController.hasPermissions.bind(
          this.permissionController,
          origin,
        ),
        requestAccountsPermission:
          this.permissionController.requestPermissions.bind(
            this.permissionController,
            { origin },
            { eth_accounts: {} },
          ),
        requestPermissionsForOrigin:
          this.permissionController.requestPermissions.bind(
            this.permissionController,
            { origin },
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
        getCurrentChainId: () =>
          this.networkController.state.providerConfig.chainId,
        getCurrentRpcUrl: () =>
          this.networkController.state.providerConfig.rpcUrl,
        // network configuration-related
        getNetworkConfigurations: () =>
          this.networkController.state.networkConfigurations,
        upsertNetworkConfiguration:
          this.networkController.upsertNetworkConfiguration.bind(
            this.networkController,
          ),
        setActiveNetwork: (networkClientId) => {
          this.networkController.setActiveNetwork(networkClientId);
        },
        findNetworkClientIdByChainId:
          this.networkController.findNetworkClientIdByChainId.bind(
            this.networkController,
          ),
        findNetworkConfigurationBy: this.findNetworkConfigurationBy.bind(this),
        getNetworkClientIdForDomain:
          this.selectedNetworkController.getNetworkClientIdForDomain.bind(
            this.selectedNetworkController,
          ),
        setNetworkClientIdForDomain:
          this.selectedNetworkController.setNetworkClientIdForDomain.bind(
            this.selectedNetworkController,
          ),

        getUseRequestQueue: this.preferencesController.getUseRequestQueue.bind(
          this.preferencesController,
        ),
        getProviderConfig: () => this.networkController.state.providerConfig,
        setProviderType: (type) => {
          return this.networkController.setProviderType(type);
        },

        // Web3 shim-related
        getWeb3ShimUsageState: this.alertController.getWeb3ShimUsageState.bind(
          this.alertController,
        ),
        setWeb3ShimUsageRecorded:
          this.alertController.setWeb3ShimUsageRecorded.bind(
            this.alertController,
          ),

        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        handleMmiAuthenticate:
          this.institutionalFeaturesController.handleMmiAuthenticate.bind(
            this.institutionalFeaturesController,
          ),
        handleMmiCheckIfTokenIsPresent:
          this.mmiController.handleMmiCheckIfTokenIsPresent.bind(
            this.mmiController,
          ),
        handleMmiDashboardData: this.mmiController.handleMmiDashboardData.bind(
          this.mmiController,
        ),
        handleMmiSetAccountAndNetwork:
          this.mmiController.setAccountAndNetwork.bind(this.mmiController),
        handleMmiOpenAddHardwareWallet:
          this.mmiController.handleMmiOpenAddHardwareWallet.bind(
            this.mmiController,
          ),
        ///: END:ONLY_INCLUDE_IF
      }),
    );

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    engine.push(
      createSnapsMethodMiddleware(subjectType === SubjectType.Snap, {
        getUnlockPromise: this.appStateController.getUnlockPromise.bind(
          this.appStateController,
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
        installSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:install',
          origin,
        ),
        getIsLocked: () => {
          return !this.appStateController.isUnlocked();
        },
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        hasPermission: this.permissionController.hasPermission.bind(
          this.permissionController,
          origin,
        ),
        getSnap: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:get',
        ),
        getAllSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getAll',
        ),
        handleSnapRpcRequest: (args) =>
          this.handleSnapRequest({ ...args, origin }),
        getAllowedKeyringMethods: keyringSnapPermissionsBuilder(
          this.subjectMetadataController,
          origin,
        ),
        createInterface: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapInterfaceController:createInterface',
          origin,
        ),
        getInterfaceState: (...args) =>
          this.controllerMessenger.call(
            'SnapInterfaceController:getInterface',
            origin,
            ...args,
          ).state,
        updateInterface: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapInterfaceController:updateInterface',
          origin,
        ),
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      }),
    );
    ///: END:ONLY_INCLUDE_IF

    // filter and subscription polyfills
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);
    if (subjectType !== SubjectType.Internal) {
      // permissions
      engine.push(
        this.permissionController.createPermissionMiddleware({
          origin,
        }),
      );
    }

    engine.push(this.metamaskMiddleware);

    engine.push(providerAsMiddleware(proxyClient.provider));

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

    pump(configStream, outStream, (err) => {
      configStream.destroy();
      if (err) {
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
   * @returns {string} The connection's id (so that it can be deleted later)
   */
  addConnection(origin, { engine }) {
    if (origin === ORIGIN_METAMASK) {
      return null;
    }

    if (!this.connections[origin]) {
      this.connections[origin] = {};
    }

    const id = nanoid();
    this.connections[origin][id] = {
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
   */
  notifyConnections(origin, payload) {
    const connections = this.connections[origin];

    if (connections) {
      Object.values(connections).forEach((conn) => {
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
   */
  notifyAllConnections(payload) {
    const getPayload =
      typeof payload === 'function'
        ? (origin) => payload(origin)
        : () => payload;

    Object.keys(this.connections).forEach((origin) => {
      Object.values(this.connections[origin]).forEach(async (conn) => {
        if (conn.engine) {
          conn.engine.emit('notification', await getPayload(origin));
        }
      });
    });
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
    const addresses = keyrings.reduce(
      (acc, { accounts }) => acc.concat(accounts),
      [],
    );

    if (!addresses.length) {
      return;
    }

    // Ensure preferences + identities controller know about all addresses
    this.preferencesController.syncAddresses(addresses);
    this.accountTracker.syncWithAddresses(addresses);
  }

  /**
   * Handle global application unlock.
   * Notifies all connections that the extension is unlocked, and which
   * account(s) are currently accessible, if any.
   */
  _onUnlock() {
    this.notifyAllConnections(async (origin) => {
      return {
        method: NOTIFICATION_NAMES.unlockStateChanged,
        params: {
          isUnlocked: true,
          accounts: await this.getPermittedAccounts(origin),
        },
      };
    });

    this.unMarkPasswordForgotten();

    // In the current implementation, this handler is triggered by a
    // KeyringController event. Other controllers subscribe to the 'unlock'
    // event of the MetaMaskController itself.
    this.emit('unlock');
  }

  /**
   * Handle global application lock.
   * Notifies all connections that the extension is locked.
   */
  _onLock() {
    this.notifyAllConnections({
      method: NOTIFICATION_NAMES.unlockStateChanged,
      params: {
        isUnlocked: false,
      },
    });

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
   * Returns the nonce that will be associated with a transaction once approved
   *
   * @param {string} address - The hex string address for the transaction
   * @param networkClientId - The optional networkClientId to get the nonce lock with
   * @returns {Promise<number>}
   */
  async getPendingNonce(address, networkClientId) {
    const { nonceDetails, releaseLock } = await this.txController.getNonceLock(
      address,
      process.env.TRANSACTION_MULTICHAIN ? networkClientId : undefined,
    );

    const pendingNonce = nonceDetails.params.highestSuggested;

    releaseLock();
    return pendingNonce;
  }

  /**
   * Returns the next nonce according to the nonce-tracker
   *
   * @param {string} address - The hex string address for the transaction
   * @param networkClientId - The optional networkClientId to get the nonce lock with
   * @returns {Promise<number>}
   */
  async getNextNonce(address, networkClientId) {
    const nonceLock = await this.txController.getNonceLock(
      address,
      process.env.TRANSACTION_MULTICHAIN ? networkClientId : undefined,
    );
    nonceLock.releaseLock();
    return nonceLock.nextNonce;
  }

  /**
   * Throw an artificial error in a timeout handler for testing purposes.
   *
   * @param message - The error message.
   * @deprecated This is only mean to facilitiate E2E testing. We should not
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
   * A method for setting TransactionController event listeners
   */
  _addTransactionControllerListeners() {
    const transactionMetricsRequest = this.getTransactionMetricsRequest();

    this.controllerMessenger.subscribe(
      'TransactionController:postTransactionBalanceUpdated',
      handlePostTransactionBalanceUpdate.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:unapprovedTransactionAdded',
      (transactionMeta) =>
        handleTransactionAdded(transactionMetricsRequest, { transactionMeta }),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionApproved',
      handleTransactionApproved.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionDropped',
      handleTransactionDropped.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionConfirmed',
      handleTransactionConfirmed.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionFailed',
      handleTransactionFailed.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionNewSwap',
      ({ transactionMeta }) =>
        this.swapsController.setTradeTxId(transactionMeta.id),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionNewSwapApproval',
      ({ transactionMeta }) =>
        this.swapsController.setApproveTxId(transactionMeta.id),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionRejected',
      handleTransactionRejected.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionSubmitted',
      handleTransactionSubmitted.bind(null, transactionMetricsRequest),
    );

    this.controllerMessenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      ({ transactionMeta }) => {
        this._onFinishedTransaction(transactionMeta);
      },
    );
  }

  getTransactionMetricsRequest() {
    const controllerActions = {
      // Metametrics Actions
      createEventFragment: this.metaMetricsController.createEventFragment.bind(
        this.metaMetricsController,
      ),
      finalizeEventFragment:
        this.metaMetricsController.finalizeEventFragment.bind(
          this.metaMetricsController,
        ),
      getEventFragmentById:
        this.metaMetricsController.getEventFragmentById.bind(
          this.metaMetricsController,
        ),
      getParticipateInMetrics: () =>
        this.metaMetricsController.state.participateInMetaMetrics,
      trackEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
      updateEventFragment: this.metaMetricsController.updateEventFragment.bind(
        this.metaMetricsController,
      ),
      // Other dependencies
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      getEIP1559GasFeeEstimates:
        this.gasFeeController.fetchGasFeeEstimates.bind(this.gasFeeController),
      getSelectedAddress: () =>
        this.preferencesController.store.getState().selectedAddress,
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),
      getTransaction: (id) =>
        this.txController.state.transactions.find((tx) => tx.id === id),
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
      provider: this.provider,
    };
  }

  //=============================================================================
  // CONFIG
  //=============================================================================

  /**
   * Returns the first network configuration object that matches at least one field of the
   * provided search criteria. Returns null if no match is found
   *
   * @param {object} rpcInfo - The RPC endpoint properties and values to check.
   * @returns {object} rpcInfo found in the network configurations list
   */
  findNetworkConfigurationBy(rpcInfo) {
    const { networkConfigurations } = this.networkController.state;
    const networkConfiguration = Object.values(networkConfigurations).find(
      (configuration) => {
        return Object.keys(rpcInfo).some((key) => {
          return configuration[key] === rpcInfo[key];
        });
      },
    );

    return networkConfiguration || null;
  }

  /**
   * Sets the Ledger Live preference to use for Ledger hardware wallet support
   *
   * @deprecated This method is deprecated and will be removed in the future.
   * Only webhid connections are supported in chrome and u2f in firefox.
   */
  async setLedgerTransportPreference() {
    const transportType = window.navigator.hid
      ? LedgerTransportTypes.webhid
      : LedgerTransportTypes.u2f;
    const keyring = await this.getKeyringForDevice(HardwareDeviceNames.ledger);
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
      const version = this.platform.getVersion();
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
    if (open) {
      this.tokenDetectionController.enable();
    } else {
      this.tokenDetectionController.disable();
    }
  }
  /* eslint-enable accessor-pairs */

  /**
   * A method that is called by the background when all instances of metamask are closed.
   * Currently used to stop polling in the gasFeeController.
   */
  onClientClosed() {
    try {
      this.gasFeeController.stopPolling();
      this.appStateController.clearPollingTokens();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * A method that is called by the background when a particular environment type is closed (fullscreen, popup, notification).
   * Currently used to stop polling in the gasFeeController for only that environement type
   *
   * @param environmentType
   */
  onEnvironmentTypeClosed(environmentType) {
    const appStatePollingTokenType =
      POLLING_TOKEN_ENVIRONMENT_TYPES[environmentType];
    const pollingTokensToDisconnect =
      this.appStateController.store.getState()[appStatePollingTokenType];
    pollingTokensToDisconnect.forEach((pollingToken) => {
      this.gasFeeController.disconnectPoller(pollingToken);
      this.appStateController.removePollingToken(
        pollingToken,
        appStatePollingTokenType,
      );
    });
  }

  /**
   * Adds a domain to the PhishingController safelist
   *
   * @param {string} hostname - the domain to safelist
   */
  safelistPhishingDomain(hostname) {
    return this.phishingController.bypass(hostname);
  }

  async backToSafetyPhishingWarning() {
    const extensionURL = this.platform.getExtensionURL();
    await this.platform.switchToAnotherURL(undefined, extensionURL);
  }

  /**
   * Locks MetaMask
   */
  setLocked() {
    return this.keyringController.setLocked();
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

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
  ///: END:ONLY_INCLUDE_IF

  updateNetworksList = (sortedNetworkList) => {
    try {
      this.networkOrderController.updateNetworksList(sortedNetworkList);
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
        new EthereumRpcError(error.code, error.message, error.data),
      );
    } catch (exp) {
      if (!(exp instanceof ApprovalRequestNotFoundError)) {
        throw exp;
      }
    }
  };

  async securityProviderRequest(requestData, methodName) {
    const { currentLocale, transactionSecurityCheckEnabled } =
      this.preferencesController.store.getState();

    if (transactionSecurityCheckEnabled) {
      const chainId = Number(
        hexToDecimal(this.networkController.state.providerConfig.chainId),
      );

      try {
        const securityProviderResponse = await securityProviderCheck(
          requestData,
          methodName,
          chainId,
          currentLocale,
        );

        return securityProviderResponse;
      } catch (err) {
        log.error(err.message);
        throw err;
      }
    }

    return null;
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

    await this.txController.updateIncomingTransactions();
  }

  async _notifyAccountsChange(origin, newAccounts) {
    if (this.isUnlocked()) {
      this.notifyConnections(origin, {
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
              await this.getPermittedAccounts(origin),
      });
    }

    this.permissionLogController.updateAccountsHistory(origin, newAccounts);
  }

  _notifyChainChange() {
    if (this.preferencesController.getUseRequestQueue()) {
      this.notifyAllConnections((origin) => ({
        method: NOTIFICATION_NAMES.chainChanged,
        params: this.getProviderNetworkState(origin),
      }));
    } else {
      this.notifyAllConnections({
        method: NOTIFICATION_NAMES.chainChanged,
        params: this.getProviderNetworkState(),
      });
    }
  }

  async _onFinishedTransaction(transactionMeta) {
    if (
      ![TransactionStatus.confirmed, TransactionStatus.failed].includes(
        transactionMeta.status,
      )
    ) {
      return;
    }

    await this._createTransactionNotifcation(transactionMeta);
    this._updateNFTOwnership(transactionMeta);
    this._trackTransactionFailure(transactionMeta);
  }

  async _createTransactionNotifcation(transactionMeta) {
    const { chainId } = transactionMeta;
    let rpcPrefs = {};

    if (chainId) {
      const { networkConfigurations } = this.networkController.state;

      const matchingNetworkConfig = Object.values(networkConfigurations).find(
        (networkConfiguration) => networkConfiguration.chainId === chainId,
      );

      rpcPrefs = matchingNetworkConfig?.rpcPrefs ?? {};
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

  _updateNFTOwnership(transactionMeta) {
    // if this is a transferFrom method generated from within the app it may be an NFT transfer transaction
    // in which case we will want to check and update ownership status of the transferred NFT.

    const { type, txParams, chainId } = transactionMeta;

    if (
      type !== TransactionType.tokenMethodTransferFrom ||
      txParams === undefined
    ) {
      return;
    }

    const { data, to: contractAddress, from: userAddress } = txParams;
    const transactionData = parseStandardTokenTransactionData(data);

    // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
    // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
    // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
    const transactionDataTokenId =
      getTokenIdParam(transactionData) ?? getTokenValueParam(transactionData);

    const { allNfts } = this.nftController.state;

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
        // TODO add networkClientId once it is available in the transactionMeta
        // the chainId previously passed here didn't actually allow us to check for ownership on a non globally selected network
        // because the check would use the provider for the globally selected network, not the chainId passed here.
        { userAddress },
      );
    }
  }

  _trackTransactionFailure(transactionMeta) {
    const { txReceipt } = transactionMeta;
    const metamaskState = this.getState();

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
          numberOfTokens: metamaskState.tokens.length,
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
        from: this.preferencesController.getSelectedAddress(),
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
      { updatedTransactionMeta },
    );
  }
}

import EventEmitter from 'events';
import pump from 'pump';
import { ObservableStore } from '@metamask/obs-store';
import { storeAsStream } from '@metamask/obs-store/dist/asStream';
import { JsonRpcEngine } from 'json-rpc-engine';
import { createEngineStream } from 'json-rpc-middleware-stream';
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  debounce,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  throttle,
  ///: END:ONLY_INCLUDE_IN
} from 'lodash';
import { keyringBuilderFactory } from '@metamask/eth-keyring-controller';
import { KeyringController } from '@metamask/keyring-controller';
import createFilterMiddleware from 'eth-json-rpc-filters';
import createSubscriptionManager from 'eth-json-rpc-filters/subscriptionManager';
import { errorCodes as rpcErrorCodes, EthereumRpcError } from 'eth-rpc-errors';
import { Mutex } from 'await-semaphore';
import log from 'loglevel';
import { TrezorKeyring } from '@metamask/eth-trezor-keyring';
import LedgerBridgeKeyring from '@metamask/eth-ledger-bridge-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';
import EthQuery from 'eth-query';
import nanoid from 'nanoid';
import { captureException } from '@sentry/browser';
import { AddressBookController } from '@metamask/address-book-controller';
import {
  ApprovalController,
  ApprovalRequestNotFoundError,
} from '@metamask/approval-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  AssetsContractController,
  CurrencyRateController,
  NftController,
  NftDetectionController,
  TokenListController,
  TokenRatesController,
  TokensController,
} from '@metamask/assets-controllers';
import { PhishingController } from '@metamask/phishing-controller';
import { AnnouncementController } from '@metamask/announcement-controller';
import { NetworkController } from '@metamask/network-controller';
import { GasFeeController } from '@metamask/gas-fee-controller';
import {
  PermissionController,
  PermissionsRequestNotFoundError,
} from '@metamask/permission-controller';
import {
  SubjectMetadataController,
  SubjectType,
} from '@metamask/subject-metadata-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { encrypt, decrypt } from '@metamask/browser-passworder';
import { RateLimitController } from '@metamask/rate-limit-controller';
import { NotificationController } from '@metamask/notification-controller';

import {
  CronjobController,
  JsonSnapsRegistry,
  SnapController,
  IframeExecutionService,
} from '@metamask/snaps-controllers';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import { SnapKeyring } from '@metamask/eth-snap-keyring';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  CUSTODIAN_TYPES,
  MmiConfigurationController,
} from '@metamask-institutional/custody-keyring';
import { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
///: END:ONLY_INCLUDE_IN
import { SignatureController } from '@metamask/signature-controller';
///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import { PPOMController } from '@metamask/ppom-validator';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktop)
// eslint-disable-next-line import/order
import { DesktopController } from '@metamask/desktop/dist/controllers/desktop';
///: END:ONLY_INCLUDE_IN

import {
  ApprovalType,
  ERC1155,
  ERC20,
  ERC721,
} from '@metamask/controller-utils';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IN

import {
  AssetType,
  TransactionStatus,
  TransactionType,
  TokenStandard,
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
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import {
  CaveatTypes,
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  EndowmentPermissions,
  ExcludedSnapPermissions,
  ExcludedSnapEndowments,
  ///: END:ONLY_INCLUDE_IN
} from '../../shared/constants/permissions';
import { UI_NOTIFICATIONS } from '../../shared/notifications';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { UI_INSTITUTIONAL_NOTIFICATIONS } from '../../shared/notifications/institutional';
///: END:ONLY_INCLUDE_IN
import { MILLISECOND, SECOND } from '../../shared/constants/time';
import {
  ORIGIN_METAMASK,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  SNAP_DIALOG_TYPES,
  ///: END:ONLY_INCLUDE_IN
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';

import {
  getTokenIdParam,
  fetchTokenBalance,
} from '../../shared/lib/token-util.ts';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { parseStandardTokenTransactionData } from '../../shared/modules/transaction.utils';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { ACTION_QUEUE_METRICS_E2E_TEST } from '../../shared/constants/test-flags';

///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import { createPPOMMiddleware } from './lib/ppom/ppom-middleware';
import * as PPOMModule from './lib/ppom/ppom';
///: END:ONLY_INCLUDE_IN
import {
  onMessageReceived,
  checkForMultipleVersionsRunning,
} from './detect-multiple-instances';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import MMIController from './controllers/mmi-controller';
import { mmiKeyringBuilderFactory } from './mmi-keyring-builder-factory';
///: END:ONLY_INCLUDE_IN
import ComposableObservableStore from './lib/ComposableObservableStore';
import AccountTracker from './lib/account-tracker';
import createDupeReqFilterMiddleware from './lib/createDupeReqFilterMiddleware';
import createLoggerMiddleware from './lib/createLoggerMiddleware';
import {
  createMethodMiddleware,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  createSnapMethodMiddleware,
  ///: END:ONLY_INCLUDE_IN
} from './lib/rpc-method-middleware';
import createOriginMiddleware from './lib/createOriginMiddleware';
import createTabIdMiddleware from './lib/createTabIdMiddleware';
import createOnboardingMiddleware from './lib/createOnboardingMiddleware';
import { setupMultiplex } from './lib/stream-utils';
import EnsController from './controllers/ens';
import PreferencesController from './controllers/preferences';
import AppStateController from './controllers/app-state';
import CachedBalancesController from './controllers/cached-balances';
import AlertController from './controllers/alert';
import OnboardingController from './controllers/onboarding';
import Backup from './lib/backup';
import DecryptMessageController from './controllers/decrypt-message';
import TransactionController from './controllers/transactions';
import DetectTokensController from './controllers/detect-tokens';
import SwapsController from './controllers/swaps';
import MetaMetricsController from './controllers/metametrics';
import { segment } from './lib/segment';
import createMetaRPCHandler from './lib/createMetaRPCHandler';
import { previousValueComparator } from './lib/util';
import createMetamaskMiddleware from './lib/createMetamaskMiddleware';
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
  PermissionLogController,
  unrestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
  ///: END:ONLY_INCLUDE_IN
} from './controllers/permissions';
import createRPCMethodTrackingMiddleware from './lib/createRPCMethodTrackingMiddleware';
import { securityProviderCheck } from './lib/security-provider-helpers';
///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import { IndexedDBPPOMStorage } from './lib/ppom/indexed-db-backend';
///: END:ONLY_INCLUDE_IN
import { updateCurrentLocale } from './translate';

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

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0;

    this.getRequestAccountTabIds = opts.getRequestAccountTabIds;
    this.getOpenMetamaskTabsIds = opts.getOpenMetamaskTabsIds;

    this.controllerMessenger = new ControllerMessenger();

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
      if (details.reason === 'update' && version === '8.1.0') {
        this.platform.openExtensionInBrowser();
      }
    });

    this.appMetadataController = new AppMetadataController({
      state: initState.AppMetadataController,
      currentMigrationVersion: this.currentMigrationVersion,
      currentAppVersion: version,
    });

    // next, we will initialize the controllers
    // controller initialization order matters

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

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    this.mmiConfigurationController = new MmiConfigurationController({
      initState: initState.MmiConfigurationController,
      mmiConfigurationServiceUrl: process.env.MMI_CONFIGURATION_SERVICE_URL,
    });
    ///: END:ONLY_INCLUDE_IN

    const networkControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'NetworkController',
      allowedEvents: [
        'NetworkController:stateChange',
        'NetworkController:networkWillChange',
        'NetworkController:networkDidChange',
        'NetworkController:infuraIsBlocked',
        'NetworkController:infuraIsUnblocked',
      ],
    });

    let initialNetworkControllerState = {};
    if (initState.NetworkController) {
      initialNetworkControllerState = initState.NetworkController;
    } else if (process.env.IN_TEST) {
      initialNetworkControllerState = {
        providerConfig: {
          chainId: CHAIN_IDS.LOCALHOST,
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          type: 'rpc',
        },
        networkConfigurations: {
          networkConfigurationId: {
            chainId: CHAIN_IDS.LOCALHOST,
            nickname: 'Localhost 8545',
            rpcPrefs: {},
            rpcUrl: 'http://localhost:8545',
            ticker: 'ETH',
            networkConfigurationId: 'networkConfigurationId',
          },
        },
      };
    } else if (
      process.env.METAMASK_DEBUG ||
      process.env.METAMASK_ENVIRONMENT === 'test'
    ) {
      initialNetworkControllerState = {
        providerConfig: {
          type: NETWORK_TYPES.GOERLI,
          chainId: CHAIN_IDS.GOERLI,
          ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
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

    const tokenListMessenger = this.controllerMessenger.getRestricted({
      name: 'TokenListController',
      allowedEvents: [
        'TokenListController:stateChange',
        'NetworkController:stateChange',
      ],
    });

    this.tokenListController = new TokenListController({
      chainId: this.networkController.state.providerConfig.chainId,
      preventPollingOnNetworkRestart: initState.TokenListController
        ? initState.TokenListController.preventPollingOnNetworkRestart
        : true,
      messenger: tokenListMessenger,
      state: initState.TokenListController,
    });

    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
      initLangCode: opts.initLangCode,
      onInfuraIsBlocked: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:infuraIsBlocked',
      ),
      onInfuraIsUnblocked: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:infuraIsUnblocked',
      ),
      tokenListController: this.tokenListController,
      provider: this.provider,
      networkConfigurations: this.networkController.state.networkConfigurations,
    });

    const tokensControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'TokensController',
      allowedActions: ['ApprovalController:addRequest'],
      allowedEvents: ['NetworkController:stateChange'],
    });
    this.tokensController = new TokensController({
      messenger: tokensControllerMessenger,
      chainId: this.networkController.state.providerConfig.chainId,
      onPreferencesStateChange: this.preferencesController.store.subscribe.bind(
        this.preferencesController.store,
      ),
      onNetworkStateChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
      config: { provider: this.provider },
      state: initState.TokensController,
    });

    this.assetsContractController = new AssetsContractController(
      {
        chainId: this.networkController.state.providerConfig.chainId,
        onPreferencesStateChange: (listener) =>
          this.preferencesController.store.subscribe(listener),
        // This handler is misnamed, and is a known issue that will be resolved
        // by planned refactors. It should be onNetworkDidChange which happens
        // AFTER the provider in the network controller is updated to reflect
        // the new state of the network controller. In #18041 we changed this
        // handler to be triggered by the change in the network state because
        // that is what the handler name implies, but this triggers too soon
        // causing the provider of the AssetsContractController to trail the
        // network provider by one update.
        onNetworkStateChange: (cb) =>
          networkControllerMessenger.subscribe(
            'NetworkController:networkDidChange',
            () => {
              const networkState = this.networkController.state;
              return cb(networkState);
            },
          ),
      },
      {
        provider: this.provider,
      },
      initState.AssetsContractController,
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
      // NOTE: This option is inaccurately named; it should be called
      // onNetworkDidChange
      onNetworkStateChange: (eventHandler) => {
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

    this.qrHardwareKeyring = new QRHardwareKeyring();

    this.appStateController = new AppStateController({
      addUnlockListener: this.on.bind(this, 'unlock'),
      isUnlocked: this.isUnlocked.bind(this),
      initState: initState.AppStateController,
      onInactiveTimeout: () => this.setLocked(),
      preferencesStore: this.preferencesController.store,
      qrHardwareStore: this.qrHardwareKeyring.getMemStore(),
      messenger: this.controllerMessenger.getRestricted({
        name: 'AppStateController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
        ],
      }),
    });

    const currencyRateMessenger = this.controllerMessenger.getRestricted({
      name: 'CurrencyRateController',
    });
    this.currencyRateController = new CurrencyRateController({
      includeUsdRate: true,
      messenger: currencyRateMessenger,
      state: {
        ...initState.CurrencyController,
        nativeCurrency: this.networkController.state.providerConfig.ticker,
      },
    });

    this.phishingController = new PhishingController(
      {},
      initState.PhishingController,
    );

    this.phishingController.maybeUpdateState();

    if (process.env.IN_TEST) {
      this.phishingController.setHotlistRefreshInterval(5 * SECOND);
      this.phishingController.setStalelistRefreshInterval(30 * SECOND);
    }

    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    this.ppomController = new PPOMController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PPOMController',
      }),
      storageBackend: new IndexedDBPPOMStorage('PPOMDB', 1),
      provider: this.provider,
      ppomProvider: { PPOM: PPOMModule.PPOM, ppomInit: PPOMModule.default },
      state: initState.PPOMController,
      chainId: this.networkController.state.providerConfig.chainId,
      onNetworkChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
      securityAlertsEnabled:
        this.preferencesController.store.getState().securityAlertsEnabled,
      onPreferencesChange: this.preferencesController.store.subscribe.bind(
        this.preferencesController.store,
      ),
      cdnBaseUrl: process.env.BLOCKAID_FILE_CDN,
      blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY,
    });
    ///: END:ONLY_INCLUDE_IN

    const announcementMessenger = this.controllerMessenger.getRestricted({
      name: 'AnnouncementController',
    });

    let allAnnouncements = UI_NOTIFICATIONS;

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    allAnnouncements = UI_INSTITUTIONAL_NOTIFICATIONS;
    ///: END:ONLY_INCLUDE_IN

    this.announcementController = new AnnouncementController({
      messenger: announcementMessenger,
      allAnnouncements,
      state: initState.AnnouncementController,
    });

    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController(
      {
        chainId: this.networkController.state.providerConfig.chainId,
        onTokensStateChange: (listener) =>
          this.tokensController.subscribe(listener),
        onCurrencyRateStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            `${this.currencyRateController.name}:stateChange`,
            listener,
          ),
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
      },
      {
        disabled:
          !this.preferencesController.store.getState().useCurrencyRateCheck,
      },
      initState.TokenRatesController,
    );
    this.preferencesController.store.subscribe(
      previousValueComparator((prevState, currState) => {
        const { useCurrencyRateCheck: prevUseCurrencyRateCheck } = prevState;
        const { useCurrencyRateCheck: currUseCurrencyRateCheck } = currState;
        if (currUseCurrencyRateCheck && !prevUseCurrencyRateCheck) {
          this.currencyRateController.start();
          this.tokenRatesController.configure(
            { disabled: false },
            false,
            false,
          );
        } else if (!currUseCurrencyRateCheck && prevUseCurrencyRateCheck) {
          this.currencyRateController.stop();
          this.tokenRatesController.configure({ disabled: true }, false, false);
        }
      }, this.preferencesController.store.getState()),
    );

    this.ensController = new EnsController({
      provider: this.provider,
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      onNetworkDidChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:networkDidChange',
      ),
    });

    this.onboardingController = new OnboardingController({
      initState: initState.OnboardingController,
    });

    // account tracker watches balances, nonces, and any code at their address
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      getNetworkIdentifier: () => {
        const { type, rpcUrl } = this.networkController.state.providerConfig;
        return type === NETWORK_TYPES.RPC ? rpcUrl : type;
      },
      preferencesController: this.preferencesController,
      onboardingController: this.onboardingController,
      initState:
        isManifestV3 &&
        isFirstMetaMaskControllerSetup === false &&
        initState.AccountTracker?.accounts
          ? { accounts: initState.AccountTracker.accounts }
          : { accounts: {} },
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

    this.cachedBalancesController = new CachedBalancesController({
      accountTracker: this.accountTracker,
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      initState: initState.CachedBalancesController,
    });

    let additionalKeyrings = [keyringBuilderFactory(QRHardwareKeyring)];

    if (this.canUseHardwareWallets()) {
      const keyringOverrides = this.opts.overrides?.keyrings;

      const additionalKeyringTypes = [
        keyringOverrides?.trezor || TrezorKeyring,
        keyringOverrides?.ledger || LedgerBridgeKeyring,
        keyringOverrides?.lattice || LatticeKeyring,
        QRHardwareKeyring,
      ];

      additionalKeyrings = additionalKeyringTypes.map((keyringType) =>
        keyringBuilderFactory(keyringType),
      );

      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      for (const custodianType of Object.keys(CUSTODIAN_TYPES)) {
        additionalKeyrings.push(
          mmiKeyringBuilderFactory(
            CUSTODIAN_TYPES[custodianType].keyringClass,
            { mmiConfigurationController: this.mmiConfigurationController },
          ),
        );
      }
      ///: END:ONLY_INCLUDE_IN
    }

    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    additionalKeyrings.push(
      (() => {
        const builder = () => new SnapKeyring(this.snapController);
        builder.type = SnapKeyring.type;
        return builder;
      })(),
    );
    ///: END:ONLY_INCLUDE_IN

    const keyringControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'KeyringController',
      allowedEvents: [
        'KeyringController:accountRemoved',
        'KeyringController:lock',
        'KeyringController:stateChange',
        'KeyringController:unlock',
      ],
      allowedActions: ['KeyringController:getState'],
    });

    this.coreKeyringController = new KeyringController({
      keyringBuilders: additionalKeyrings,
      state: initState.KeyringController,
      encryptor: opts.encryptor || undefined,
      cacheEncryptionKey: isManifestV3,
      messenger: keyringControllerMessenger,
      removeIdentity: this.preferencesController.removeAddress.bind(
        this.preferencesController,
      ),
      setAccountLabel: this.preferencesController.setAccountLabel.bind(
        this.preferencesController,
      ),
      setSelectedAddress: this.preferencesController.setSelectedAddress.bind(
        this.preferencesController,
      ),
      syncIdentities: this.preferencesController.syncAddresses.bind(
        this.preferencesController,
      ),
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

    this.keyringController =
      this.coreKeyringController.getEthKeyringController();

    const getIdentities = () =>
      this.preferencesController.store.getState().identities;

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
      caveatSpecifications: getCaveatSpecifications({ getIdentities }),
      permissionSpecifications: {
        ...getPermissionSpecifications({
          getIdentities,
          getAllAccounts: this.keyringController.getAccounts.bind(
            this.keyringController,
          ),
          captureKeyringTypesWithMissingIdentities: (
            identities = {},
            accounts = [],
          ) => {
            const accountsMissingIdentities = accounts.filter(
              (address) => !identities[address],
            );
            const keyringTypesWithMissingIdentities =
              accountsMissingIdentities.map((address) =>
                this.coreKeyringController.getAccountKeyringType(address),
              );

            const identitiesCount = Object.keys(identities || {}).length;

            const accountTrackerCount = Object.keys(
              this.accountTracker.store.getState().accounts || {},
            ).length;

            captureException(
              new Error(
                `Attempt to get permission specifications failed because their were ${accounts.length} accounts, but ${identitiesCount} identities, and the ${keyringTypesWithMissingIdentities} keyrings included accounts with missing identities. Meanwhile, there are ${accountTrackerCount} accounts in the account tracker.`,
              ),
            );
          },
        }),
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
        ...this.getSnapPermissionSpecifications(),
        ///: END:ONLY_INCLUDE_IN
      },
      unrestrictedMethods,
    });

    this.permissionLogController = new PermissionLogController({
      restrictedMethods: new Set(Object.keys(RestrictedMethods)),
      initState: initState.PermissionLogController,
    });

    this.subjectMetadataController = new SubjectMetadataController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SubjectMetadataController',
        allowedActions: [`${this.permissionController.name}:hasPermissions`],
      }),
      state: initState.SubjectMetadataController,
      subjectCacheLimit: 100,
    });

    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    const snapExecutionServiceArgs = {
      iframeUrl: new URL(process.env.IFRAME_EXECUTION_ENVIRONMENT_URL),
      messenger: this.controllerMessenger.getRestricted({
        name: 'ExecutionService',
      }),
      setupSnapProvider: this.setupSnapProvider.bind(this),
    };

    this.snapExecutionService = new IframeExecutionService(
      snapExecutionServiceArgs,
    );

    const snapControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapController',
      allowedEvents: [
        'ExecutionService:unhandledError',
        'ExecutionService:outboundRequest',
        'ExecutionService:outboundResponse',
        'SnapController:snapInstalled',
        'SnapController:snapUpdated',
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
        'ExecutionService:executeSnap',
        'ExecutionService:getRpcRequestHandler',
        'ExecutionService:terminateSnap',
        'ExecutionService:terminateAllSnaps',
        'ExecutionService:handleRpcRequest',
        'SnapsRegistry:get',
        'SnapsRegistry:getMetadata',
        'SnapsRegistry:update',
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
        'SnapController:snapRemoved',
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
        registry: 'https://acl.execution.consensys.io/latest/registry.json',
        signature: 'https://acl.execution.consensys.io/latest/signature.json',
      },
      publicKey:
        '0x025b65308f0f0fb8bc7f7ff87bfc296e0330eee5d3c1d1ee4a048b2fd6a86fa0a6',
    });

    ///: END:ONLY_INCLUDE_IN

    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    this.desktopController = new DesktopController({
      initState: initState.DesktopController,
    });
    ///: END:ONLY_INCLUDE_IN

    const detectTokensControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'DetectTokensController',
        allowedEvents: ['NetworkController:stateChange'],
      });
    this.detectTokensController = new DetectTokensController({
      messenger: detectTokensControllerMessenger,
      preferences: this.preferencesController,
      tokensController: this.tokensController,
      assetsContractController: this.assetsContractController,
      network: this.networkController,
      keyringMemStore: this.keyringController.memStore,
      tokenList: this.tokenListController,
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
    });

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    this.custodyController = new CustodyController({
      initState: initState.CustodyController,
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
    ///: END:ONLY_INCLUDE_IN

    this.backup = new Backup({
      preferencesController: this.preferencesController,
      addressBookController: this.addressBookController,
      networkController: this.networkController,
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    this.txController = new TransactionController({
      initState:
        initState.TransactionController || initState.TransactionManager,
      getPermittedAccounts: this.getPermittedAccounts.bind(this),
      getProviderConfig: () => this.networkController.state.providerConfig,
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      getCurrentAccountEIP1559Compatibility:
        this.getCurrentAccountEIP1559Compatibility.bind(this),
      getNetworkId: () => this.networkController.state.networkId,
      getNetworkStatus: () =>
        this.networkController.state.networksMetadata?.[
          this.networkController.state.selectedNetworkClientId
        ]?.status,
      getNetworkState: () => this.networkController.state,
      hasCompletedOnboarding: () =>
        this.onboardingController.store.getState().completedOnboarding,
      onNetworkStateChange: (listener) => {
        networkControllerMessenger.subscribe(
          'NetworkController:stateChange',
          () => listener(),
          ({ networkId }) => networkId,
        );
      },
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
      preferencesStore: this.preferencesController.store,
      txHistoryLimit: 60,
      signTransaction: this.keyringController.signTransaction.bind(
        this.keyringController,
      ),
      provider: this.provider,
      blockTracker: this.blockTracker,
      createEventFragment: this.metaMetricsController.createEventFragment.bind(
        this.metaMetricsController,
      ),
      updateEventFragment: this.metaMetricsController.updateEventFragment.bind(
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
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
      getParticipateInMetrics: () =>
        this.metaMetricsController.state.participateInMetaMetrics,
      getEIP1559GasFeeEstimates:
        this.gasFeeController.fetchGasFeeEstimates.bind(this.gasFeeController),
      getExternalPendingTransactions:
        this.getExternalPendingTransactions.bind(this),
      getAccountType: this.getAccountType.bind(this),
      getDeviceModel: this.getDeviceModel.bind(this),
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),
      securityProviderRequest: this.securityProviderRequest.bind(this),
      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      transactionUpdateController: this.transactionUpdateController,
      ///: END:ONLY_INCLUDE_IN
      messenger: this.controllerMessenger.getRestricted({
        name: 'TransactionController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
        ],
      }),
    });

    this.txController.on(`tx:status-update`, async (txId, status) => {
      if (
        status === TransactionStatus.confirmed ||
        status === TransactionStatus.failed
      ) {
        const txMeta = this.txController.txStateManager.getTransaction(txId);
        let rpcPrefs = {};
        if (txMeta.chainId) {
          const { networkConfigurations } = this.networkController.state;
          const matchingNetworkConfig = Object.values(
            networkConfigurations,
          ).find(
            (networkConfiguration) =>
              networkConfiguration.chainId === txMeta.chainId,
          );
          rpcPrefs = matchingNetworkConfig?.rpcPrefs ?? {};
        }

        try {
          await this.platform.showTransactionNotification(txMeta, rpcPrefs);
        } catch (error) {
          log.error('Failed to create transaction notification', error);
        }

        const { txReceipt } = txMeta;

        // if this is a transferFrom method generated from within the app it may be an NFT transfer transaction
        // in which case we will want to check and update ownership status of the transferred NFT.
        if (
          txMeta.type === TransactionType.tokenMethodTransferFrom &&
          txMeta.txParams !== undefined
        ) {
          const {
            data,
            to: contractAddress,
            from: userAddress,
          } = txMeta.txParams;
          const { chainId } = txMeta;
          const transactionData = parseStandardTokenTransactionData(data);
          // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
          // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
          // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
          const transactionDataTokenId =
            getTokenIdParam(transactionData) ??
            getTokenValueParam(transactionData);
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
              { userAddress, chainId },
            );
          }
        }

        const metamaskState = this.getState();

        if (txReceipt && txReceipt.status === '0x0') {
          this.metaMetricsController.trackEvent(
            {
              event: 'Tx Status Update: On-Chain Failure',
              category: MetaMetricsEventCategory.Background,
              properties: {
                action: 'Transactions',
                errorMessage: txMeta.simulationFails?.reason,
                numberOfTokens: metamaskState.tokens.length,
                numberOfAccounts: Object.keys(metamaskState.accounts).length,
              },
            },
            {
              matomoEvent: true,
            },
          );
        }
      }
    });

    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      async () => {
        const { ticker } = this.networkController.state.providerConfig;
        try {
          await this.currencyRateController.setNativeCurrency(ticker);
        } catch (error) {
          // TODO: Handle failure to get conversion rate more gracefully
          console.error(error);
        }
      },
    );

    this.networkController.lookupNetwork();
    this.decryptMessageController = new DecryptMessageController({
      getState: this.getState.bind(this),
      keyringController: this.keyringController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'DecryptMessageController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
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
      getAccountKeyringType:
        this.coreKeyringController.getAccountKeyringType.bind(
          this.coreKeyringController,
        ),
      getState: this.getState.bind(this),
      metricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    this.signatureController = new SignatureController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SignatureController',
        allowedActions: [`${this.approvalController.name}:addRequest`],
      }),
      keyringController: this.keyringController,
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

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    this.mmiController = new MMIController({
      mmiConfigurationController: this.mmiConfigurationController,
      keyringController: this.keyringController,
      txController: this.txController,
      securityProviderRequest: this.securityProviderRequest.bind(this),
      preferencesController: this.preferencesController,
      appStateController: this.appStateController,
      transactionUpdateController: this.transactionUpdateController,
      custodyController: this.custodyController,
      institutionalFeaturesController: this.institutionalFeaturesController,
      getState: this.getState.bind(this),
      getPendingNonce: this.getPendingNonce.bind(this),
      accountTracker: this.accountTracker,
      metaMetricsController: this.metaMetricsController,
      networkController: this.networkController,
      permissionController: this.permissionController,
      signatureController: this.signatureController,
      platform: this.platform,
      extension: this.extension,
    });
    ///: END:ONLY_INCLUDE_IN

    this.swapsController = new SwapsController(
      {
        getBufferedGasLimit:
          this.txController.txGasUtil.getBufferedGasLimit.bind(
            this.txController.txGasUtil,
          ),
        networkController: this.networkController,
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
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
        onNetworkStateChange: networkControllerMessenger.subscribe.bind(
          networkControllerMessenger,
          'NetworkController:stateChange',
        ),
        getNetwork: () => this.networkController.state.networkId ?? 'loading',
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

    this.txController.on('newSwapApproval', (txMeta) => {
      this.swapsController.setApproveTxId(txMeta.id);
    });

    this.txController.on('newSwap', (txMeta) => {
      this.swapsController.setTradeTxId(txMeta.id);
    });

    // ensure accountTracker updates balances after network change
    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      () => {
        this.accountTracker._updateAccounts();
      },
    );

    // clear unapproved transactions and messages when the network will change
    networkControllerMessenger.subscribe(
      'NetworkController:networkWillChange',
      () => {
        this.txController.txStateManager.clearUnapprovedTxs();
        this.encryptionPublicKeyController.clearUnapproved();
        this.decryptMessageController.clearUnapproved();
        this.signatureController.clearUnapproved();
        this.approvalController.clear();
      },
    );

    if (isManifestV3 && globalThis.isFirstTimeProfileLoaded === undefined) {
      const { serviceWorkerLastActiveTime } =
        this.appStateController.store.getState();
      const metametricsPayload = {
        category: MetaMetricsEventCategory.ServiceWorkers,
        event: MetaMetricsEventName.ServiceWorkerRestarted,
        properties: {
          service_worker_restarted_time:
            Date.now() - serviceWorkerLastActiveTime,
        },
      };

      try {
        this.metaMetricsController.trackEvent(metametricsPayload);
      } catch (e) {
        log.warn('Failed to track service worker restart metric:', e);
      }
    }

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
            this.preferencesController.getSelectedAddress();
          return selectedAddress ? [selectedAddress] : [];
        } else if (this.isUnlocked()) {
          return await this.getPermittedAccounts(innerOrigin, {
            suppressUnauthorizedError,
          });
        }
        return []; // changing this is a breaking change
      },
      // tx signing
      processTransaction: this.newUnapprovedTransaction.bind(this),
      // msg signing
      ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
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
      ///: END:ONLY_INCLUDE_IN

      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
      ///: END:ONLY_INCLUDE_IN

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
        this.txController.getTransactions({
          searchCriteria: {
            hash,
            status: TransactionStatus.submitted,
          },
        })[0],
    });

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => this._onStateUpdate(memState));

    /**
     * All controllers in Memstore but not in store. They are not persisted.
     * On chrome profile re-start, they will be re-initialized.
     */
    const resetOnRestartStore = {
      AccountTracker: this.accountTracker.store,
      TxController: this.txController.memStore,
      TokenRatesController: this.tokenRatesController,
      DecryptMessageController: this.decryptMessageController,
      EncryptionPublicKeyController: this.encryptionPublicKeyController,
      SignatureController: this.signatureController,
      SwapsController: this.swapsController.store,
      EnsController: this.ensController.store,
      ApprovalController: this.approvalController,
      ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
      PPOMController: this.ppomController,
      ///: END:ONLY_INCLUDE_IN
    };

    this.store.updateStructure({
      AppStateController: this.appStateController.store,
      AppMetadataController: this.appMetadataController.store,
      TransactionController: this.txController.store,
      KeyringController: this.keyringController.store,
      PreferencesController: this.preferencesController.store,
      MetaMetricsController: this.metaMetricsController.store,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      NetworkController: this.networkController,
      CachedBalancesController: this.cachedBalancesController.store,
      AlertController: this.alertController.store,
      OnboardingController: this.onboardingController.store,
      PermissionController: this.permissionController,
      PermissionLogController: this.permissionLogController.store,
      SubjectMetadataController: this.subjectMetadataController,
      AnnouncementController: this.announcementController,
      GasFeeController: this.gasFeeController,
      TokenListController: this.tokenListController,
      TokensController: this.tokensController,
      SmartTransactionsController: this.smartTransactionsController,
      NftController: this.nftController,
      PhishingController: this.phishingController,
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      SnapController: this.snapController,
      CronjobController: this.cronjobController,
      SnapsRegistry: this.snapsRegistry,
      NotificationController: this.notificationController,
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(desktop)
      DesktopController: this.desktopController.store,
      ///: END:ONLY_INCLUDE_IN

      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      CustodyController: this.custodyController.store,
      InstitutionalFeaturesController:
        this.institutionalFeaturesController.store,
      MmiConfigurationController: this.mmiConfigurationController.store,
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
      PPOMController: this.ppomController,
      ///: END:ONLY_INCLUDE_IN
      ...resetOnRestartStore,
    });

    this.memStore = new ComposableObservableStore({
      config: {
        AppStateController: this.appStateController.store,
        AppMetadataController: this.appMetadataController.store,
        NetworkController: this.networkController,
        CachedBalancesController: this.cachedBalancesController.store,
        KeyringController: this.keyringController.memStore,
        PreferencesController: this.preferencesController.store,
        MetaMetricsController: this.metaMetricsController.store,
        AddressBookController: this.addressBookController,
        CurrencyController: this.currencyRateController,
        AlertController: this.alertController.store,
        OnboardingController: this.onboardingController.store,
        PermissionController: this.permissionController,
        PermissionLogController: this.permissionLogController.store,
        SubjectMetadataController: this.subjectMetadataController,
        AnnouncementController: this.announcementController,
        GasFeeController: this.gasFeeController,
        TokenListController: this.tokenListController,
        TokensController: this.tokensController,
        SmartTransactionsController: this.smartTransactionsController,
        NftController: this.nftController,
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
        SnapController: this.snapController,
        CronjobController: this.cronjobController,
        SnapsRegistry: this.snapsRegistry,
        NotificationController: this.notificationController,
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(desktop)
        DesktopController: this.desktopController.store,
        ///: END:ONLY_INCLUDE_IN

        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        CustodyController: this.custodyController.store,
        InstitutionalFeaturesController:
          this.institutionalFeaturesController.store,
        MmiConfigurationController: this.mmiConfigurationController.store,
        ///: END:ONLY_INCLUDE_IN
        ...resetOnRestartStore,
      },
      controllerMessenger: this.controllerMessenger,
    });

    // if this is the first time, clear the state of by calling these methods
    const resetMethods = [
      this.accountTracker.resetState,
      this.txController.resetState,
      this.decryptMessageController.resetState.bind(
        this.decryptMessageController,
      ),
      this.encryptionPublicKeyController.resetState.bind(
        this.encryptionPublicKeyController,
      ),
      this.signatureController.resetState.bind(this.signatureController),
      this.swapsController.resetState,
      this.ensController.resetState,
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

    // Automatic login via config password or loginToken
    if (
      !this.isUnlocked() &&
      this.onboardingController.store.getState().completedOnboarding
    ) {
      this._loginUser();
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
      this.currencyRateController.start();
    }
    if (this.preferencesController.store.getState().useTokenDetection) {
      this.tokenListController.start();
    }
  }

  stopNetworkRequests() {
    this.accountTracker.stop();
    this.txController.stopIncomingTransactionPolling();
    if (this.preferencesController.store.getState().useCurrencyRateCheck) {
      this.currencyRateController.stop();
    }
    if (this.preferencesController.store.getState().useTokenDetection) {
      this.tokenListController.stop();
    }
  }

  canUseHardwareWallets() {
    return !isManifestV3 || process.env.HARDWARE_WALLETS_MV3;
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

  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  /**
   * Initialize the snap keyring if it is not present.
   */
  async getSnapKeyring() {
    if (!this.snapKeyring) {
      let [snapKeyring] = this.coreKeyringController.getKeyringsByType(
        KeyringType.snap,
      );
      if (!snapKeyring) {
        snapKeyring = await this.keyringController.addNewKeyring(
          KeyringType.snap,
        );
      }
      this.snapKeyring = snapKeyring;
    }
    return this.snapKeyring;
  }
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(snaps)

  /**
   * Tracks snaps export usage. Note: This function is throttled to 1 call per 60 seconds.
   *
   * @param {string} handler - The handler to trigger on the snap for the request.
   */
  _trackSnapExportUsage = throttle(
    (handler) =>
      this.metaMetricsController.trackEvent({
        event: MetaMetricsEventName.SnapExportUsed,
        category: MetaMetricsEventCategory.Snaps,
        properties: {
          export: handler,
        },
      }),
    SECOND * 60,
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
  handleSnapRequest(args) {
    this._trackSnapExportUsage(args.handler);

    return this.controllerMessenger.call('SnapController:handleRequest', args);
  }

  /**
   * Constructor helper for getting Snap permission specifications.
   */
  getSnapPermissionSpecifications() {
    return {
      ...buildSnapEndowmentSpecifications(),
      ...buildSnapRestrictedMethodSpecifications({
        encrypt,
        decrypt,
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
        showDialog: (origin, type, content, placeholder) =>
          this.approvalController.addAndShowApprovalRequest({
            origin,
            type: SNAP_DIALOG_TYPES[type],
            requestData: { content, placeholder },
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
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
        getSnapKeyring: this.getSnapKeyring.bind(this),
        saveSnapKeyring: async () => {
          await this.keyringController.persistAllKeyrings();
        },
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      }),
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

  ///: END:ONLY_INCLUDE_IN

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
      const { selectedAddress, currentLocale } = state;
      const { chainId } = this.networkController.state.providerConfig;
      await updateCurrentLocale(currentLocale);

      if (state.incomingTransactionsPreferences?.[chainId]) {
        this.txController.startIncomingTransactionPolling();
      } else {
        this.txController.stopIncomingTransactionPolling();
      }

      if (selectedAddress && selectedAddress !== lastSelectedAddress) {
        lastSelectedAddress = selectedAddress;
        await this._onAccountChange(selectedAddress);
      }
    });

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

    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    // Record Snap metadata whenever a Snap is added to state.
    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapAdded`,
      (snap, svgIcon = null) => {
        const {
          manifest: { proposedName },
          version,
        } = snap;
        this.subjectMetadataController.addSubjectMetadata({
          subjectType: SubjectType.Snap,
          name: proposedName,
          origin: snap.id,
          version,
          svgIcon,
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapInstalled`,
      (truncatedSnap) => {
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapInstalled,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: truncatedSnap.id,
            version: truncatedSnap.version,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapUpdated`,
      (newSnap, oldVersion) => {
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapUpdated,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: newSnap.id,
            old_version: oldVersion,
            new_version: newSnap.version,
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
      `${this.snapController.name}:snapRemoved`,
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

        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapUninstalled,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: truncatedSnap.id,
            version: truncatedSnap.version,
          },
        });
      },
    );

    ///: END:ONLY_INCLUDE_IN
  }

  /**
   * TODO:LegacyProvider: Delete
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  createPublicConfigStore() {
    // subset of state for metamask inpage provider
    const publicConfigStore = new ObservableStore();
    const { networkController } = this;

    // setup memStore subscription hooks
    this.on('update', updatePublicConfigStore);
    updatePublicConfigStore(this.getState());

    function updatePublicConfigStore(memState) {
      const networkStatus =
        memState.networksMetadata[memState.selectedNetworkClientId]?.status;
      const { chainId } = networkController.state.providerConfig;
      if (networkStatus === NetworkStatus.Available) {
        publicConfigStore.putState(selectPublicState(chainId, memState));
      }
    }

    function selectPublicState(chainId, { isUnlocked, networkId }) {
      return {
        isUnlocked,
        chainId,
        networkVersion: networkId ?? 'loading',
      };
    }

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
      ...this.getProviderNetworkState(),
      accounts: await this.getPermittedAccounts(origin),
    };
  }

  /**
   * Gets network state relevant for external providers.
   *
   * @param {object} [memState] - The MetaMask memState. If not provided,
   * this function will retrieve the most recent state.
   * @returns {object} An object with relevant network state properties.
   */
  getProviderNetworkState(memState) {
    const { networkId } = memState || this.getState();
    return {
      chainId: this.networkController.state.providerConfig.chainId,
      networkVersion: networkId ?? 'loading',
    };
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
    const { vault } = this.keyringController.store.getState();
    const isInitialized = Boolean(vault);

    const flatState = this.memStore.getFlatState();

    return {
      isInitialized,
      ...flatState,
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      // Snap state and source code is stripped out to prevent piping to the MetaMask UI.
      snapStates: {},
      snaps: Object.values(flatState.snaps ?? {}).reduce((acc, snap) => {
        // eslint-disable-next-line no-unused-vars
        const { sourceCode, ...rest } = snap;
        acc[snap.id] = rest;
        return acc;
      }, {}),
      ///: END:ONLY_INCLUDE_IN
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
      addressBookController,
      alertController,
      appStateController,
      nftController,
      nftDetectionController,
      currencyRateController,
      detectTokensController,
      ensController,
      gasFeeController,
      metaMetricsController,
      networkController,
      announcementController,
      onboardingController,
      permissionController,
      preferencesController,
      qrHardwareKeyring,
      swapsController,
      tokensController,
      smartTransactionsController,
      txController,
      assetsContractController,
      backup,
      approvalController,
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
      ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
      setSecurityAlertsEnabled:
        preferencesController.setSecurityAlertsEnabled.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IN
      setIpfsGateway: preferencesController.setIpfsGateway.bind(
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

      // primary HD keyring management
      addNewAccount: this.addNewAccount.bind(this),
      verifySeedPhrase: this.verifySeedPhrase.bind(this),
      resetAccount: this.resetAccount.bind(this),
      removeAccount: this.removeAccount.bind(this),
      importAccountWithStrategy: this.importAccountWithStrategy.bind(this),

      // hardware wallets
      connectHardware: this.connectHardware.bind(this),
      forgetDevice: this.forgetDevice.bind(this),
      checkHardwareStatus: this.checkHardwareStatus.bind(this),
      unlockHardwareWalletAccount: this.unlockHardwareWalletAccount.bind(this),
      setLedgerTransportPreference:
        this.setLedgerTransportPreference.bind(this),
      attemptLedgerTransportCreation:
        this.attemptLedgerTransportCreation.bind(this),
      establishLedgerTransportPreference:
        this.establishLedgerTransportPreference.bind(this),

      // qr hardware devices
      submitQRHardwareCryptoHDKey:
        qrHardwareKeyring.submitCryptoHDKey.bind(qrHardwareKeyring),
      submitQRHardwareCryptoAccount:
        qrHardwareKeyring.submitCryptoAccount.bind(qrHardwareKeyring),
      cancelSyncQRHardware:
        qrHardwareKeyring.cancelSync.bind(qrHardwareKeyring),
      submitQRHardwareSignature:
        qrHardwareKeyring.submitSignature.bind(qrHardwareKeyring),
      cancelQRHardwareSignRequest:
        qrHardwareKeyring.cancelSignRequest.bind(qrHardwareKeyring),

      // vault management
      submitPassword: this.submitPassword.bind(this),
      verifyPassword: this.verifyPassword.bind(this),

      // network management
      setProviderType:
        networkController.setProviderType.bind(networkController),
      rollbackToPreviousProvider:
        networkController.rollbackToPreviousProvider.bind(networkController),
      removeNetworkConfiguration:
        networkController.removeNetworkConfiguration.bind(networkController),
      setActiveNetwork:
        networkController.setActiveNetwork.bind(networkController),
      upsertNetworkConfiguration:
        this.networkController.upsertNetworkConfiguration.bind(
          this.networkController,
        ),
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      // PreferencesController
      setSelectedAddress: preferencesController.setSelectedAddress.bind(
        preferencesController,
      ),
      addToken: tokensController.addToken.bind(tokensController),
      updateTokenType: tokensController.updateTokenType.bind(tokensController),
      setAccountLabel: preferencesController.setAccountLabel.bind(
        preferencesController,
      ),
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
      ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
      setSnapsAddSnapAccountModalDismissed:
        preferencesController.setSnapsAddSnapAccountModalDismissed.bind(
          preferencesController,
        ),
      ///: END:ONLY_INCLUDE_IN

      // AssetsContractController
      getTokenStandardAndDetails: this.getTokenStandardAndDetails.bind(this),

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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      setSnapsInstallPrivacyWarningShownStatus:
        appStateController.setSnapsInstallPrivacyWarningShownStatus.bind(
          appStateController,
        ),
      ///: END:ONLY_INCLUDE_IN
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
      setShowProductTour:
        appStateController.setShowProductTour.bind(appStateController),
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
      addTransaction: this.addTransaction.bind(this),
      addTransactionAndWaitForPublish:
        this.addTransactionAndWaitForPublish.bind(this),
      createTransactionEventFragment:
        txController.createTransactionEventFragment.bind(txController),
      getTransactions: txController.getTransactions.bind(txController),

      updateEditableParams:
        txController.updateEditableParams.bind(txController),
      updateTransactionGasFees:
        txController.updateTransactionGasFees.bind(txController),
      updateTransactionSendFlowHistory:
        txController.updateTransactionSendFlowHistory.bind(txController),

      updatePreviousGasParams:
        txController.updatePreviousGasParams.bind(txController),

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

      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
      setCustodianConnectRequest:
        this.custodyController.setCustodianConnectRequest.bind(
          this.custodyController,
        ),
      getCustodianConnectRequest:
        this.custodyController.getCustodianConnectRequest.bind(
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
      ///: END:ONLY_INCLUDE_IN

      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      // snaps
      removeSnapError: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:removeSnapError',
      ),
      disableSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:disable',
      ),
      enableSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:enable',
      ),
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
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
      updateSnapRegistry: this.preferencesController.updateSnapRegistry.bind(
        preferencesController,
      ),
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(desktop)
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
      ///: END:ONLY_INCLUDE_IN

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

      // approval controller
      resolvePendingApproval: this.resolvePendingApproval,
      rejectPendingApproval: this.rejectPendingApproval,

      // Notifications
      updateViewedNotifications: announcementController.updateViewed.bind(
        announcementController,
      ),

      // GasFeeController
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

      // DetectTokenController
      detectNewTokens: detectTokensController.detectNewTokens.bind(
        detectTokensController,
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
    };
  }

  async exportAccount(address, password) {
    await this.verifyPassword(password);
    return this.keyringController.exportAccount(address, password);
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
        log.warning(`Failed to get token balance. Error: ${e}`);
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

    return {
      ...details,
      decimals: details?.decimals?.toString(10),
      balance: details?.balance?.toString(10),
    };
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
      let vault;
      const accounts = await this.keyringController.getAccounts();
      if (accounts.length > 0) {
        vault = await this.keyringController.fullUpdate();
      } else {
        vault = await this.keyringController.createNewVaultAndKeychain(
          password,
        );
        const addresses = await this.keyringController.getAccounts();
        this.preferencesController.setAddresses(addresses);
        this.selectFirstIdentity();
      }

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
      let accounts, lastBalance;

      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);

      // clear known identities
      this.preferencesController.setAddresses([]);

      // clear permissions
      this.permissionController.clearState();

      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      // Clear snap state
      this.snapController.clearState();
      // Clear notification state
      this.notificationController.clear();
      ///: END:ONLY_INCLUDE_IN

      // clear accounts in accountTracker
      this.accountTracker.clearAccounts();

      // clear cachedBalances
      this.cachedBalancesController.clearCachedBalances();

      // clear unapproved transactions
      this.txController.txStateManager.clearUnapprovedTxs();

      // create new vault
      const vault = await this.coreKeyringController.createNewVaultAndRestore(
        password,
        this._convertMnemonicToWordlistIndices(seedPhraseAsBuffer),
      );

      const ethQuery = new EthQuery(this.provider);
      accounts = await this.coreKeyringController.getAccounts();
      lastBalance = await this.getBalance(
        accounts[accounts.length - 1],
        ethQuery,
      );

      // seek out the first zero balance
      while (lastBalance !== '0x0') {
        const { addedAccountAddress } =
          await this.coreKeyringController.addNewAccount(accounts.length);
        accounts = await this.coreKeyringController.getAccounts();
        lastBalance = await this.getBalance(addedAccountAddress, ethQuery);
      }

      // remove extra zero balance account potentially created from seeking ahead
      if (accounts.length > 1 && lastBalance === '0x0') {
        await this.removeAccount(accounts[accounts.length - 1]);
        accounts = await this.coreKeyringController.getAccounts();
      }

      // This must be set as soon as possible to communicate to the
      // keyring's iframe and have the setting initialized properly
      // Optimistically called to not block MetaMask login due to
      // Ledger Keyring GitHub downtime
      const transportPreference =
        this.preferencesController.getLedgerTransportPreference();
      this.setLedgerTransportPreference(transportPreference);

      this.selectFirstIdentity();

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
    await this.coreKeyringController.submitPassword(password);

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    this.mmiController.onSubmitPassword();
    ///: END:ONLY_INCLUDE_IN

    try {
      await this.blockTracker.checkForLatestBlock();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    // This must be set as soon as possible to communicate to the
    // keyring's iframe and have the setting initialized properly
    // Optimistically called to not block MetaMask login due to
    // Ledger Keyring GitHub downtime
    const transportPreference =
      this.preferencesController.getLedgerTransportPreference();

    this.setLedgerTransportPreference(transportPreference);
  }

  async _loginUser() {
    try {
      // Automatic login via config password
      const password = process.env.PASSWORD;
      if (password && !process.env.IN_TEST) {
        await this.submitPassword(password);
      }
      // Automatic login via storage encryption key
      else if (isManifestV3) {
        await this.submitEncryptionKey();
      }
      // Updating accounts in this.accountTracker before starting UI syncing ensure that
      // state has account balance before it is synced with UI
      await this.accountTracker._updateAccounts();
    } finally {
      this._startUISync();
    }
  }

  _startUISync() {
    // Message startUISync is used in MV3 to start syncing state with UI
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
        const { vault } = this.coreKeyringController.state;

        const jsonVault = JSON.parse(vault);

        if (jsonVault.salt !== loginSalt) {
          console.warn(
            'submitEncryptionKey: Stored salt and vault salt do not match',
          );
          await this.clearLoginArtifacts();
          return;
        }

        await this.coreKeyringController.submitEncryptionKey(
          loginToken,
          loginSalt,
        );
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
   * Sets the first address in the state to the selected address
   */
  selectFirstIdentity() {
    const { identities } = this.preferencesController.store.getState();
    const [address] = Object.keys(identities);
    this.preferencesController.setSelectedAddress(address);
  }

  /**
   * Gets the mnemonic of the user's primary keyring.
   */
  getPrimaryKeyringMnemonic() {
    const [keyring] = this.coreKeyringController.getKeyringsByType(
      KeyringType.hdKeyTree,
    );
    if (!keyring.mnemonic) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyring.mnemonic;
  }

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  async getCustodyKeyringIfExists(address) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring =
      this.coreKeyringController.getKeyringsByType(custodyType)[0];
    return keyring?.getAccountDetails(address) ? keyring : undefined;
  }
  ///: END:ONLY_INCLUDE_IN

  //
  // Hardware
  //

  async getKeyringForDevice(deviceName, hdPath = null) {
    const keyringOverrides = this.opts.overrides?.keyrings;
    let keyringName = null;
    if (
      deviceName !== HardwareDeviceNames.QR &&
      !this.canUseHardwareWallets()
    ) {
      throw new Error('Hardware wallets are not supported on this version.');
    }
    switch (deviceName) {
      case HardwareDeviceNames.trezor:
        keyringName = keyringOverrides?.trezor?.type || TrezorKeyring.type;
        break;
      case HardwareDeviceNames.ledger:
        keyringName =
          keyringOverrides?.ledger?.type || LedgerBridgeKeyring.type;
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
    let [keyring] = await this.coreKeyringController.getKeyringsByType(
      keyringName,
    );
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

  async establishLedgerTransportPreference() {
    const transportPreference =
      this.preferencesController.getLedgerTransportPreference();
    return await this.setLedgerTransportPreference(transportPreference);
  }

  /**
   * Fetch account list from a trezor device.
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
    keyring.forgetDevice();
    return true;
  }

  /**
   * Retrieves the keyring for the selected address and using the .type returns
   * a subtype for the account. Either 'hardware', 'imported' or 'MetaMask'.
   *
   * @param {string} address - Address to retrieve keyring for
   * @returns {'hardware' | 'imported' | 'MetaMask'}
   */
  async getAccountType(address) {
    const keyringType = await this.coreKeyringController.getAccountKeyringType(
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
      default:
        return 'MetaMask';
    }
  }

  /**
   * Retrieves the keyring for the selected address and using the .type
   * determines if a more specific name for the device is available. Returns
   * 'N/A' for non hardware wallets.
   *
   * @param {string} address - Address to retrieve keyring for
   * @returns {'ledger' | 'lattice' | 'N/A' | string}
   */
  async getDeviceModel(address) {
    const keyring = await this.coreKeyringController.getKeyringForAccount(
      address,
    );
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
        return 'N/A';
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
    const keyState = await this.keyringController.addNewAccount(keyring);
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
      }
    });

    const { identities } = this.preferencesController.store.getState();
    return { ...keyState, identities };
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
    const isActionMetricsQueueE2ETest =
      this.appStateController.store.getState()[ACTION_QUEUE_METRICS_E2E_TEST];

    if (process.env.IN_TEST && isActionMetricsQueueE2ETest) {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }

    const oldAccounts = await this.coreKeyringController.getAccounts();

    const { addedAccountAddress } =
      await this.coreKeyringController.addNewAccount(accountCount);

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
   * @returns {Promise<number[]>} The seed phrase to be confirmed by the user,
   * encoded as an array of UTF-8 bytes.
   */
  async verifySeedPhrase() {
    return this._convertEnglishWordlistIndicesToCodepoints(
      await this.coreKeyringController.verifySeedPhrase(),
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
    const selectedAddress = this.preferencesController.getSelectedAddress();
    this.txController.wipeTransactions(selectedAddress);
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
    // Remove account from the preferences controller
    this.preferencesController.removeAddress(address);
    // Remove account from the account tracker controller
    this.accountTracker.removeAccount([address]);

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    this.custodyController.removeAccount(address);
    ///: END:ONLY_INCLUDE_IN(build-mmi)

    const keyring = await this.coreKeyringController.getKeyringForAccount(
      address,
    );
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
      await this.coreKeyringController.importAccountWithStrategy(
        strategy,
        args,
      );
    // set new account as selected
    this.preferencesController.setSelectedAddress(importedAccountAddress);
  }

  // ---------------------------------------------------------------------------
  // Identity Management (signature operations)

  /**
   * Called when a Dapp suggests a new tx to be signed.
   * this wrapper needs to exist so we can provide a reference to
   *  "newUnapprovedTransaction" before "txController" is instantiated
   *
   * @param {object} txParams - The transaction parameters.
   * @param {object} [req] - The original request, containing the origin.
   */
  async newUnapprovedTransaction(txParams, req) {
    // Options are passed explicitly as an additional security measure
    // to ensure approval is not disabled
    const { result } = await this.txController.addTransaction(txParams, {
      actionId: req.id,
      method: req.method,
      origin: req.origin,
      // This is the default behaviour but specified here for clarity
      requireApproval: true,
      ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
      securityAlertResponse: req.securityAlertResponse,
      ///: END:ONLY_INCLUDE_IN
    });

    return await result;
  }

  async addTransactionAndWaitForPublish(txParams, options) {
    const { transactionMeta, result } = await this.txController.addTransaction(
      txParams,
      options,
    );

    await result;

    return transactionMeta;
  }

  async addTransaction(txParams, options) {
    const { transactionMeta, result } = await this.txController.addTransaction(
      txParams,
      options,
    );

    result.catch(() => {
      // Not concerned with result
    });

    return transactionMeta;
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
    await this.txController.createCancelTransaction(
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
    await this.txController.createSpeedUpTransaction(
      originalTxId,
      customGasSettings,
      options,
    );
    const state = this.getState();
    return state;
  }

  estimateGas(estimateGasParams) {
    return new Promise((resolve, reject) => {
      return this.txController.txGasUtil.query.estimateGas(
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

  handleWatchAssetRequest = (asset, type, origin) => {
    switch (type) {
      case ERC20:
        return this.tokensController.watchAsset(asset, type);
      case ERC721:
      case ERC1155:
        return this.nftController.watchNft(asset, type, origin);
      default:
        throw new Error(`Asset type ${type} not supported`);
    }
  };

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
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    else if (subjectType === SubjectType.Snap) {
      origin = sender.snapId;
    }
    ///: END:ONLY_INCLUDE_IN
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

  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
  ///: END:ONLY_INCLUDE_IN

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
    const { blockTracker, provider } = this;

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({ provider, blockTracker });

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager({
      provider,
      blockTracker,
    });
    subscriptionManager.events.on('notification', (message) =>
      engine.emit('notification', message),
    );

    if (isManifestV3) {
      engine.push(createDupeReqFilterMiddleware());
    }

    // append origin to each request
    engine.push(createOriginMiddleware({ origin }));

    // append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }));
    }

    // logging
    engine.push(createLoggerMiddleware({ origin }));
    engine.push(this.permissionLogController.createMiddleware());

    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    engine.push(
      createPPOMMiddleware(this.ppomController, this.preferencesController),
    );
    ///: END:ONLY_INCLUDE_IN

    engine.push(
      createRPCMethodTrackingMiddleware({
        trackEvent: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
        getMetricsState: this.metaMetricsController.store.getState.bind(
          this.metaMetricsController.store,
        ),
        securityProviderRequest: this.securityProviderRequest.bind(this),
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
        setActiveNetwork: this.networkController.setActiveNetwork.bind(
          this.networkController,
        ),
        findNetworkConfigurationBy: this.findNetworkConfigurationBy.bind(this),
        setProviderType: this.networkController.setProviderType.bind(
          this.networkController,
        ),

        // Web3 shim-related
        getWeb3ShimUsageState: this.alertController.getWeb3ShimUsageState.bind(
          this.alertController,
        ),
        setWeb3ShimUsageRecorded:
          this.alertController.setWeb3ShimUsageRecorded.bind(
            this.alertController,
          ),

        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
        handleMmiOpenSwaps: this.mmiController.handleMmiOpenSwaps.bind(
          this.mmiController,
        ),
        handleMmiSetAccountAndNetwork:
          this.mmiController.setAccountAndNetwork.bind(this.mmiController),
        handleMmiOpenAddHardwareWallet:
          this.mmiController.handleMmiOpenAddHardwareWallet.bind(
            this.mmiController,
          ),
        ///: END:ONLY_INCLUDE_IN
      }),
    );

    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    engine.push(
      createSnapMethodMiddleware(subjectType === SubjectType.Snap, {
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
        getAccounts: this.getPermittedAccounts.bind(this, origin),
        installSnaps: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:install',
          origin,
        ),
      }),
    );
    ///: END:ONLY_INCLUDE_IN

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

    // forward to metamask primary provider
    engine.push(providerAsMiddleware(provider));
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
    const {
      keyrings,
      encryptionKey: loginToken,
      encryptionSalt: loginSalt,
    } = state;
    const addresses = keyrings.reduce(
      (acc, { accounts }) => acc.concat(accounts),
      [],
    );

    if (isManifestV3) {
      await this.extension.storage.session.set({ loginToken, loginSalt });
    }

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
    this.notifyAllConnections({
      method: NOTIFICATION_NAMES.chainChanged,
      params: this.getProviderNetworkState(newState),
    });
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
    return this.keyringController.memStore.getState().isUnlocked;
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
   * @returns {Promise<number>}
   */
  async getPendingNonce(address) {
    const { nonceDetails, releaseLock } =
      await this.txController.nonceTracker.getNonceLock(address);
    const pendingNonce = nonceDetails.params.highestSuggested;

    releaseLock();
    return pendingNonce;
  }

  /**
   * Returns the next nonce according to the nonce-tracker
   *
   * @param {string} address - The hex string address for the transaction
   * @returns {Promise<number>}
   */
  async getNextNonce(address) {
    const nonceLock = await this.txController.nonceTracker.getNonceLock(
      address,
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
   * @param {string} transportType - The Ledger transport type.
   */
  async setLedgerTransportPreference(transportType) {
    if (!this.canUseHardwareWallets()) {
      return undefined;
    }

    const currentValue =
      this.preferencesController.getLedgerTransportPreference();
    const newValue =
      this.preferencesController.setLedgerTransportPreference(transportType);

    const keyring = await this.getKeyringForDevice(HardwareDeviceNames.ledger);
    if (keyring?.updateTransportMethod) {
      return keyring.updateTransportMethod(newValue).catch((e) => {
        // If there was an error updating the transport, we should
        // fall back to the original value
        this.preferencesController.setLedgerTransportPreference(currentValue);
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
    this.detectTokensController.isOpen = open;
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
    const [trezorKeyring] = this.coreKeyringController.getKeyringsByType(
      KeyringType.trezor,
    );
    if (trezorKeyring) {
      trezorKeyring.dispose();
    }

    if (isManifestV3) {
      this.clearLoginArtifacts();
    }

    return this.coreKeyringController.setLocked();
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

  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
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
  ///: END:ONLY_INCLUDE_IN

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
}

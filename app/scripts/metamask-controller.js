import EventEmitter from 'events';
import pump from 'pump';
import { ObservableStore } from '@metamask/obs-store';
import { storeAsStream } from '@metamask/obs-store/dist/asStream';
import { JsonRpcEngine } from 'json-rpc-engine';
import { debounce } from 'lodash';
import createEngineStream from 'json-rpc-middleware-stream/engineStream';
import createFilterMiddleware from 'eth-json-rpc-filters';
import createSubscriptionManager from 'eth-json-rpc-filters/subscriptionManager';
import providerAsMiddleware from 'eth-json-rpc-middleware/providerAsMiddleware';
import KeyringController from 'eth-keyring-controller';
import { Mutex } from 'await-semaphore';
import { stripHexPrefix } from 'ethereumjs-util';
import log from 'loglevel';
import TrezorKeyring from 'eth-trezor-keyring';
import LedgerBridgeKeyring from '@metamask/eth-ledger-bridge-keyring';
import EthQuery from 'eth-query';
import nanoid from 'nanoid';
import {
  AddressBookController,
  ApprovalController,
  ControllerMessenger,
  CurrencyRateController,
  PhishingController,
  NotificationController,
  GasFeeController,
  TokenListController,
  TokensController,
<<<<<<< HEAD
  TokenRatesController,
} from '@metamask/controllers';
import { TRANSACTION_STATUSES } from '../../shared/constants/transaction';
=======
} from '@metamask/assets-controllers';
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
  SelectedNetworkController,
  createSelectedNetworkMiddleware,
} from '@metamask/selected-network-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';

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

///: BEGIN:ONLY_INCLUDE_IN(petnames)
import {
  NameController,
  ENSNameProvider,
  EtherscanNameProvider,
  TokenNameProvider,
  LensNameProvider,
} from '@metamask/name-controller';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IN

import {
  AssetType,
  TransactionStatus,
  TransactionType,
  TokenStandard,
  TransactionEvent,
} from '../../shared/constants/transaction';
>>>>>>> upstream/multichain-swaps-controller
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_CLIENT_ID,
} from '../../shared/constants/swaps';
import { MAINNET_CHAIN_ID } from '../../shared/constants/network';
import { KEYRING_TYPES } from '../../shared/constants/hardware-wallets';
import { UI_NOTIFICATIONS } from '../../shared/notifications';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { MILLISECOND } from '../../shared/constants/time';
import { POLLING_TOKEN_ENVIRONMENT_TYPES } from '../../shared/constants/app';

<<<<<<< HEAD
import { hexToDecimal } from '../../ui/helpers/utils/conversions.util';
=======
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
import { convertNetworkId } from '../../shared/modules/network.utils';
import {
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
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  afterTransactionSign as afterTransactionSignMMI,
  beforeCheckPendingTransaction as beforeCheckPendingTransactionMMI,
  beforeTransactionPublish as beforeTransactionPublishMMI,
  beforeTransactionApproveOnInit as beforeTransactionApproveOnInitMMI,
  getAdditionalSignArguments as getAdditionalSignArgumentsMMI,
} from './lib/transaction/mmi-hooks';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import { keyringSnapPermissionsBuilder } from './lib/keyring-snaps-permissions';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(petnames)
import { SnapsNameProvider } from './lib/SnapsNameProvider';
import { AddressBookPetnamesBridge } from './lib/AddressBookPetnamesBridge';
///: END:ONLY_INCLUDE_IN

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
>>>>>>> upstream/multichain-swaps-controller
import ComposableObservableStore from './lib/ComposableObservableStore';
import AccountTracker from './lib/account-tracker';
import createLoggerMiddleware from './lib/createLoggerMiddleware';
import createMethodMiddleware from './lib/rpc-method-middleware';
import createOriginMiddleware from './lib/createOriginMiddleware';
import createTabIdMiddleware from './lib/createTabIdMiddleware';
import createOnboardingMiddleware from './lib/createOnboardingMiddleware';
import { setupMultiplex } from './lib/stream-utils';
import EnsController from './controllers/ens';
import NetworkController, { NETWORK_EVENTS } from './controllers/network';
import PreferencesController from './controllers/preferences';
import AppStateController from './controllers/app-state';
import CachedBalancesController from './controllers/cached-balances';
import AlertController from './controllers/alert';
import OnboardingController from './controllers/onboarding';
import ThreeBoxController from './controllers/threebox';
import IncomingTransactionsController from './controllers/incoming-transactions';
import MessageManager from './lib/message-manager';
import DecryptMessageManager from './lib/decrypt-message-manager';
import EncryptionPublicKeyManager from './lib/encryption-public-key-manager';
import PersonalMessageManager from './lib/personal-message-manager';
import TypedMessageManager from './lib/typed-message-manager';
import TransactionController from './controllers/transactions';
import DetectTokensController from './controllers/detect-tokens';
import SwapsController from './controllers/swaps';
import { PermissionsController } from './controllers/permissions';
import { NOTIFICATION_NAMES } from './controllers/permissions/enums';
import getRestrictedMethods from './controllers/permissions/restrictedMethods';
import nodeify from './lib/nodeify';
import accountImporter from './account-import-strategies';
import seedPhraseVerifier from './lib/seed-phrase-verifier';
import MetaMetricsController from './controllers/metametrics';
import { segment } from './lib/segment';
import createMetaRPCHandler from './lib/createMetaRPCHandler';

export const METAMASK_CONTROLLER_EVENTS = {
  // Fired after state changes that impact the extension badge (unapproved msg count)
  // The process of updating the badge happens in app/scripts/background.js.
  UPDATE_BADGE: 'updateBadge',
  // TODO: Add this and similar enums to @metamask/controllers and export them
  APPROVAL_STATE_CHANGE: 'ApprovalController:stateChange',
};

export default class MetamaskController extends EventEmitter {
  /**
   * @constructor
   * @param {Object} opts
   */
  constructor(opts) {
    super();

    this.defaultMaxListeners = 20;

    this.sendUpdate = debounce(
      this.privateSendUpdate.bind(this),
      MILLISECOND * 200,
    );
    this.opts = opts;
    this.extension = opts.extension;
    this.platform = opts.platform;
    const initState = opts.initState || {};
    const version = this.platform.getVersion();
    this.recordFirstTimeInfo(initState);

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0;

    this.getRequestAccountTabIds = opts.getRequestAccountTabIds;
    this.getOpenMetamaskTabsIds = opts.getOpenMetamaskTabsIds;

    this.controllerMessenger = new ControllerMessenger();

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

    // next, we will initialize the controllers
    // controller initialization order matters

    this.approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: opts.showUserConfirmation,
    });

    this.networkController = new NetworkController(initState.NetworkController);
    this.networkController.setInfuraProjectId(opts.infuraProjectId);

<<<<<<< HEAD
    // now we can initialize the RPC provider, which other controllers require
    this.initializeProvider();
    this.provider = this.networkController.getProviderAndBlockTracker().provider;
    this.blockTracker = this.networkController.getProviderAndBlockTracker().blockTracker;
=======
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

    // TODO: Delete when ready to remove `networkVersion` from provider object
    this.deprecatedNetworkId = null;
    this.updateDeprecatedNetworkId();
    networkControllerMessenger.subscribe(
      'NetworkController:networkDidChange',
      () => this.updateDeprecatedNetworkId(),
    );

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
>>>>>>> upstream/multichain-swaps-controller

    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
      initLangCode: opts.initLangCode,
      openPopup: opts.openPopup,
      network: this.networkController,
      provider: this.provider,
      migrateAddressBookState: this.migrateAddressBookState.bind(this),
    });

    this.tokensController = new TokensController({
      onPreferencesStateChange: this.preferencesController.store.subscribe.bind(
        this.preferencesController.store,
      ),
      onNetworkStateChange: this.networkController.store.subscribe.bind(
        this.networkController.store,
      ),
      config: { provider: this.provider },
      state: initState.TokensController,
    });

<<<<<<< HEAD
=======
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
      getNftState: () => this.nftController.state,
    });

>>>>>>> upstream/multichain-swaps-controller
    this.metaMetricsController = new MetaMetricsController({
      segment,
      preferencesStore: this.preferencesController.store,
      onNetworkDidChange: this.networkController.on.bind(
        this.networkController,
        NETWORK_EVENTS.NETWORK_DID_CHANGE,
      ),
      getNetworkIdentifier: this.networkController.getNetworkIdentifier.bind(
        this.networkController,
      ),
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
      version: this.platform.getVersion(),
      environment: process.env.METAMASK_ENVIRONMENT,
      initState: initState.MetaMetricsController,
    });

    const gasFeeMessenger = this.controllerMessenger.getRestricted({
      name: 'GasFeeController',
      allowedActions: [
        `${this.networkController.name}:getNetworkClientById`,
        `${this.networkController.name}:getEIP1559Compatibility`,
      ],
    });

    const gasApiBaseUrl = process.env.SWAPS_USE_DEV_APIS
      ? GAS_DEV_API_BASE_URL
      : GAS_API_BASE_URL;

    this.gasFeeController = new GasFeeController({
      interval: 10000,
      messenger: gasFeeMessenger,
      clientId: SWAPS_CLIENT_ID,
      getProvider: () =>
        this.networkController.getProviderAndBlockTracker().provider,
      onNetworkStateChange: this.networkController.on.bind(
        this.networkController,
        NETWORK_EVENTS.NETWORK_DID_CHANGE,
      ),
      getCurrentNetworkEIP1559Compatibility: this.networkController.getEIP1559Compatibility.bind(
        this.networkController,
      ),
      getCurrentAccountEIP1559Compatibility: this.getCurrentAccountEIP1559Compatibility.bind(
        this,
      ),
      legacyAPIEndpoint: `${gasApiBaseUrl}/networks/<chain_id>/gasPrices`,
      EIP1559APIEndpoint: `${gasApiBaseUrl}/networks/<chain_id>/suggestedGasFees`,
      getCurrentNetworkLegacyGasAPICompatibility: () => {
        const chainId = this.networkController.getCurrentChainId();
        return process.env.IN_TEST || chainId === MAINNET_CHAIN_ID;
      },
      getChainId: () => {
        return process.env.IN_TEST
          ? MAINNET_CHAIN_ID
          : this.networkController.getCurrentChainId();
      },
    });

    this.appStateController = new AppStateController({
      addUnlockListener: this.on.bind(this, 'unlock'),
      isUnlocked: this.isUnlocked.bind(this),
      initState: initState.AppStateController,
      onInactiveTimeout: () => this.setLocked(),
      showUnlockRequest: opts.showUserConfirmation,
      preferencesStore: this.preferencesController.store,
    });

    const currencyRateMessenger = this.controllerMessenger.getRestricted({
      name: 'CurrencyRateController',
    });
    this.currencyRateController = new CurrencyRateController({
      includeUSDRate: true,
      messenger: currencyRateMessenger,
      state: initState.CurrencyController,
    });

<<<<<<< HEAD
    const tokenListMessenger = this.controllerMessenger.getRestricted({
      name: 'TokenListController',
    });
    this.tokenListController = new TokenListController({
      chainId: hexToDecimal(this.networkController.getCurrentChainId()),
      useStaticTokenList: !this.preferencesController.store.getState()
        .useTokenDetection,
      onNetworkStateChange: (cb) =>
        this.networkController.store.subscribe((networkState) => {
          const modifiedNetworkState = {
            ...networkState,
            provider: {
              ...networkState.provider,
              chainId: hexToDecimal(networkState.provider.chainId),
            },
          };
          return cb(modifiedNetworkState);
        }),
      onPreferencesStateChange: (cb) =>
        this.preferencesController.store.subscribe((preferencesState) => {
          const modifiedPreferencesState = {
            ...preferencesState,
            useStaticTokenList: !this.preferencesController.store.getState()
              .useTokenDetection,
          };
          return cb(modifiedPreferencesState);
        }),
      messenger: tokenListMessenger,
      state: initState.TokenListController,
    });

    this.phishingController = new PhishingController();

    this.notificationController = new NotificationController(
      { allNotifications: UI_NOTIFICATIONS },
      initState.NotificationController,
    );

=======
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

    this.announcementController = new AnnouncementController({
      messenger: announcementMessenger,
      allAnnouncements: UI_NOTIFICATIONS,
      state: initState.AnnouncementController,
    });

>>>>>>> upstream/multichain-swaps-controller
    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController({
      onTokensStateChange: (listener) =>
        this.tokensController.subscribe(listener),
      onCurrencyRateStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          `${this.currencyRateController.name}:stateChange`,
          listener,
        ),
      onNetworkStateChange: (cb) =>
        this.networkController.store.subscribe((networkState) => {
          const modifiedNetworkState = {
            ...networkState,
            provider: {
              ...networkState.provider,
              chainId: hexToDecimal(networkState.provider.chainId),
            },
          };
          return cb(modifiedNetworkState);
        }),
    });

    this.ensController = new EnsController({
      provider: this.provider,
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
      onNetworkDidChange: this.networkController.on.bind(
        this.networkController,
        NETWORK_EVENTS.NETWORK_DID_CHANGE,
      ),
    });

    this.incomingTransactionsController = new IncomingTransactionsController({
      blockTracker: this.blockTracker,
      onNetworkDidChange: this.networkController.on.bind(
        this.networkController,
        NETWORK_EVENTS.NETWORK_DID_CHANGE,
      ),
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
      preferencesController: this.preferencesController,
      initState: initState.IncomingTransactionsController,
    });

    // account tracker watches balances, nonces, and any code at their address
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
    });

    // start and stop polling for balances based on activeControllerConnections
    this.on('controllerConnectionChanged', (activeControllerConnections) => {
      if (activeControllerConnections > 0) {
        this.accountTracker.start();
        this.incomingTransactionsController.start();
        this.currencyRateController.start();
        this.tokenListController.start();
      } else {
        this.accountTracker.stop();
        this.incomingTransactionsController.stop();
        this.currencyRateController.stop();
        this.tokenListController.stop();
      }
    });

    this.cachedBalancesController = new CachedBalancesController({
      accountTracker: this.accountTracker,
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
      initState: initState.CachedBalancesController,
    });

<<<<<<< HEAD
    this.onboardingController = new OnboardingController({
      initState: initState.OnboardingController,
=======
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
    const getSnapController = () => this.snapController;
    const getApprovalController = () => this.approvalController;
    const getKeyringController = () => this.keyringController;
    const getPreferencesController = () => this.preferencesController;
    const getPhishingController = () => this.phishingController;

    additionalKeyrings.push(
      snapKeyringBuilder(
        getSnapController,
        getApprovalController,
        getKeyringController,
        getPreferencesController,
        getPhishingController,
        (address) => this.removeAccount(address),
      ),
    );

    ///: END:ONLY_INCLUDE_IN

    const keyringControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'KeyringController',
      allowedActions: [
        'KeyringController:getState',
        'KeyringController:signMessage',
        'KeyringController:signPersonalMessage',
        'KeyringController:signTypedMessage',
        'KeyringController:decryptMessage',
        'KeyringController:getEncryptionPublicKey',
        'KeyringController:getKeyringsByType',
        'KeyringController:getKeyringForAccount',
        'KeyringController:getAccounts',
      ],
      allowedEvents: [
        'KeyringController:stateChange',
        'KeyringController:lock',
        'KeyringController:unlock',
        'KeyringController:accountRemoved',
        'KeyringController:qrKeyringStateChange',
      ],
>>>>>>> upstream/multichain-swaps-controller
    });

    this.tokensController.hub.on('pendingSuggestedAsset', async () => {
      await opts.openPopup();
    });

    const additionalKeyrings = [TrezorKeyring, LedgerBridgeKeyring];
    this.keyringController = new KeyringController({
      keyringTypes: additionalKeyrings,
      initState: initState.KeyringController,
      encryptor: opts.encryptor || undefined,
    });
    this.keyringController.memStore.subscribe((state) =>
      this._onKeyringControllerUpdate(state),
    );
    this.keyringController.on('unlock', () => this._onUnlock());
    this.keyringController.on('lock', () => this._onLock());

    this.permissionsController = new PermissionsController(
      {
        approvals: this.approvalController,
        getKeyringAccounts: this.keyringController.getAccounts.bind(
          this.keyringController,
        ),
        getRestrictedMethods,
        getUnlockPromise: this.appStateController.getUnlockPromise.bind(
          this.appStateController,
        ),
        isUnlocked: this.isUnlocked.bind(this),
        notifyDomain: this.notifyConnections.bind(this),
        notifyAllDomains: this.notifyAllConnections.bind(this),
        preferences: this.preferencesController.store,
      },
      initState.PermissionsController,
      initState.PermissionsMetadata,
    );

<<<<<<< HEAD
=======
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
                this.keyringController.getAccountKeyringType(address),
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
        `${this.phishingController.name}:maybeUpdateState`,
        `${this.phishingController.name}:testOrigin`,
        'ExecutionService:executeSnap',
        'ExecutionService:getRpcRequestHandler',
        'ExecutionService:terminateSnap',
        'ExecutionService:terminateAllSnaps',
        'ExecutionService:handleRpcRequest',
        'SnapsRegistry:get',
        'SnapsRegistry:getMetadata',
        'SnapsRegistry:update',
        'SnapsRegistry:resolveVersion',
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
        allowedActions: ['KeyringController:getState'],
        allowedEvents: [
          'NetworkController:stateChange',
          'KeyringController:lock',
          'KeyringController:unlock',
        ],
      });
>>>>>>> upstream/multichain-swaps-controller
    this.detectTokensController = new DetectTokensController({
      preferences: this.preferencesController,
      tokensController: this.tokensController,
      network: this.networkController,
      keyringMemStore: this.keyringController.memStore,
      tokenList: this.tokenListController,
<<<<<<< HEAD
=======
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
      getNetworkClientById: this.networkController.getNetworkClientById.bind(
        this.networkController,
      ),
>>>>>>> upstream/multichain-swaps-controller
    });

    this.addressBookController = new AddressBookController(
      undefined,
      initState.AddressBookController,
    );

    this.alertController = new AlertController({
      initState: initState.AlertController,
      preferencesStore: this.preferencesController.store,
    });

    this.threeBoxController = new ThreeBoxController({
      preferencesController: this.preferencesController,
      addressBookController: this.addressBookController,
      keyringController: this.keyringController,
      initState: initState.ThreeBoxController,
      getKeyringControllerState: this.keyringController.memStore.getState.bind(
        this.keyringController.memStore,
      ),
      version,
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
    });

    this.txController = new TransactionController({
      initState:
        initState.TransactionController || initState.TransactionManager,
<<<<<<< HEAD
      getPermittedAccounts: this.permissionsController.getAccounts.bind(
        this.permissionsController,
      ),
      getProviderConfig: this.networkController.getProviderConfig.bind(
        this.networkController,
      ),
      getCurrentNetworkEIP1559Compatibility: this.networkController.getEIP1559Compatibility.bind(
        this.networkController,
      ),
      getCurrentAccountEIP1559Compatibility: this.getCurrentAccountEIP1559Compatibility.bind(
        this,
      ),
      networkStore: this.networkController.networkStore,
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
=======
      getPermittedAccounts: this.getPermittedAccounts.bind(this),
      getProviderConfig: () => this.networkController.state.providerConfig,
      getCurrentNetworkEIP1559Compatibility:
        this.networkController.getEIP1559Compatibility.bind(
          this.networkController,
        ),
      getCurrentAccountEIP1559Compatibility:
        this.getCurrentAccountEIP1559Compatibility.bind(this),
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
          (state) => state.providerConfig.chainId,
        );
      },
      getCurrentChainId: () =>
        this.networkController.state.providerConfig.chainId,
>>>>>>> upstream/multichain-swaps-controller
      preferencesStore: this.preferencesController.store,
      txHistoryLimit: 40,
      signTransaction: this.keyringController.signTransaction.bind(
        this.keyringController,
      ),
      provider: this.provider,
      blockTracker: this.blockTracker,
<<<<<<< HEAD
      trackMetaMetricsEvent: this.metaMetricsController.trackEvent.bind(
        this.metaMetricsController,
      ),
      getParticipateInMetrics: () =>
        this.metaMetricsController.state.participateInMetaMetrics,
      getEIP1559GasFeeEstimates: this.gasFeeController.fetchGasFeeEstimates.bind(
        this.gasFeeController,
      ),
=======
      getNetworkClientById: this.networkController.getNetworkClientById.bind(
        this.networkController,
      ),
      getParticipateInMetrics: () =>
        this.metaMetricsController.state.participateInMetaMetrics,
      getEIP1559GasFeeEstimates:
        this.gasFeeController.fetchGasFeeEstimates.bind(this.gasFeeController),
      getExternalPendingTransactions:
        this.getExternalPendingTransactions.bind(this),
      securityProviderRequest: this.securityProviderRequest.bind(this),
      hooks: {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        afterSign: (txMeta, signedEthTx) =>
          afterTransactionSignMMI(
            txMeta,
            signedEthTx,
            this.transactionUpdateController.addTransactionToWatchList.bind(
              this,
            ),
          ),
        beforeCheckPendingTransaction:
          beforeCheckPendingTransactionMMI.bind(this),
        beforeTransactionApproveOnInit:
          beforeTransactionApproveOnInitMMI.bind(this),
        beforePublish: beforeTransactionPublishMMI.bind(this),
        getAdditionalSignArguments: getAdditionalSignArgumentsMMI.bind(this),
        ///: END:ONLY_INCLUDE_IN
      },
      messenger: this.controllerMessenger.getRestricted({
        name: 'TransactionController',
        allowedActions: [
          `${this.approvalController.name}:addRequest`,
          `${this.approvalController.name}:acceptRequest`,
          `${this.approvalController.name}:rejectRequest`,
        ],
      }),
>>>>>>> upstream/multichain-swaps-controller
    });
    this.txController.on('newUnapprovedTx', () => opts.showUserConfirmation());

<<<<<<< HEAD
    this.txController.on(`tx:status-update`, async (txId, status) => {
      if (
        status === TRANSACTION_STATUSES.CONFIRMED ||
        status === TRANSACTION_STATUSES.FAILED
      ) {
        const txMeta = this.txController.txStateManager.getTransaction(txId);
        const frequentRpcListDetail = this.preferencesController.getFrequentRpcListDetail();
        let rpcPrefs = {};
        if (txMeta.chainId) {
          const rpcSettings = frequentRpcListDetail.find(
            (rpc) => txMeta.chainId === rpc.chainId,
          );
          rpcPrefs = rpcSettings?.rpcPrefs ?? {};
        }
        this.platform.showTransactionNotification(txMeta, rpcPrefs);

        const { txReceipt } = txMeta;
        const metamaskState = await this.getState();

        if (txReceipt && txReceipt.status === '0x0') {
          this.metaMetricsController.trackEvent(
            {
              event: 'Tx Status Update: On-Chain Failure',
              category: 'Background',
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
=======
    this._addTransactionControllerListeners();
>>>>>>> upstream/multichain-swaps-controller

    this.networkController.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, async () => {
      const { ticker } = this.networkController.getProviderConfig();
      try {
        await this.currencyRateController.setNativeCurrency(ticker);
      } catch (error) {
        // TODO: Handle failure to get conversion rate more gracefully
        console.error(error);
      }
    });
    this.networkController.lookupNetwork();
    this.messageManager = new MessageManager();
    this.personalMessageManager = new PersonalMessageManager();
    this.decryptMessageManager = new DecryptMessageManager();
    this.encryptionPublicKeyManager = new EncryptionPublicKeyManager();
    this.typedMessageManager = new TypedMessageManager({
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
    });

    this.swapsController = new SwapsController({
      getBufferedGasLimit: this.txController.txGasUtil.getBufferedGasLimit.bind(
        this.txController.txGasUtil,
      ),
<<<<<<< HEAD
      networkController: this.networkController,
      provider: this.provider,
      getProviderConfig: this.networkController.getProviderConfig.bind(
        this.networkController,
      ),
      tokenRatesStore: this.tokenRatesController.state,
      getCurrentChainId: this.networkController.getCurrentChainId.bind(
        this.networkController,
      ),
      getEIP1559GasFeeEstimates: this.gasFeeController.fetchGasFeeEstimates.bind(
        this.gasFeeController,
      ),
    });

=======
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
        getNetworkClientById: this.networkController.getNetworkClientById.bind(
          this.networkController,
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

    ///: BEGIN:ONLY_INCLUDE_IN(petnames)
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

    new AddressBookPetnamesBridge({
      addressBookController: this.addressBookController,
      nameController: this.nameController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'AddressBookPetnamesBridge',
        allowedEvents: ['NameController:stateChange'],
      }),
    }).init();
    ///: END:ONLY_INCLUDE_IN

>>>>>>> upstream/multichain-swaps-controller
    // ensure accountTracker updates balances after network change
    this.networkController.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
      this.accountTracker._updateAccounts();
    });

    // clear unapproved transactions and messages when the network will change
<<<<<<< HEAD
    this.networkController.on(NETWORK_EVENTS.NETWORK_WILL_CHANGE, () => {
      this.txController.txStateManager.clearUnapprovedTxs();
      this.encryptionPublicKeyManager.clearUnapproved();
      this.personalMessageManager.clearUnapproved();
      this.typedMessageManager.clearUnapproved();
      this.decryptMessageManager.clearUnapproved();
      this.messageManager.clearUnapproved();
=======
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
>>>>>>> upstream/multichain-swaps-controller
    });

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => this._onStateUpdate(memState));

    this.store.updateStructure({
      AppStateController: this.appStateController.store,
      TransactionController: this.txController.store,
      KeyringController: this.keyringController.store,
      PreferencesController: this.preferencesController.store,
      MetaMetricsController: this.metaMetricsController.store,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      NetworkController: this.networkController.store,
      CachedBalancesController: this.cachedBalancesController.store,
      AlertController: this.alertController.store,
      OnboardingController: this.onboardingController.store,
      IncomingTransactionsController: this.incomingTransactionsController.store,
      PermissionsController: this.permissionsController.permissions,
      PermissionsMetadata: this.permissionsController.store,
      ThreeBoxController: this.threeBoxController.store,
      NotificationController: this.notificationController,
      GasFeeController: this.gasFeeController,
      TokenListController: this.tokenListController,
      TokensController: this.tokensController,
    });

    this.memStore = new ComposableObservableStore({
      config: {
        AppStateController: this.appStateController.store,
        NetworkController: this.networkController.store,
        AccountTracker: this.accountTracker.store,
        TxController: this.txController.memStore,
        CachedBalancesController: this.cachedBalancesController.store,
        TokenRatesController: this.tokenRatesController,
        MessageManager: this.messageManager.memStore,
        PersonalMessageManager: this.personalMessageManager.memStore,
        DecryptMessageManager: this.decryptMessageManager.memStore,
        EncryptionPublicKeyManager: this.encryptionPublicKeyManager.memStore,
        TypesMessageManager: this.typedMessageManager.memStore,
        KeyringController: this.keyringController.memStore,
        PreferencesController: this.preferencesController.store,
        MetaMetricsController: this.metaMetricsController.store,
        AddressBookController: this.addressBookController,
        CurrencyController: this.currencyRateController,
        AlertController: this.alertController.store,
        OnboardingController: this.onboardingController.store,
        IncomingTransactionsController: this.incomingTransactionsController
          .store,
        PermissionsController: this.permissionsController.permissions,
        PermissionsMetadata: this.permissionsController.store,
        ThreeBoxController: this.threeBoxController.store,
        SwapsController: this.swapsController.store,
        EnsController: this.ensController.store,
        ApprovalController: this.approvalController,
        NotificationController: this.notificationController,
        GasFeeController: this.gasFeeController,
        TokenListController: this.tokenListController,
        TokensController: this.tokensController,
      },
      controllerMessenger: this.controllerMessenger,
    });
    this.memStore.subscribe(this.sendUpdate.bind(this));

    const password = process.env.CONF?.PASSWORD;
    if (
      password &&
      !this.isUnlocked() &&
      this.onboardingController.store.getState().completedOnboarding
    ) {
      this.submitPassword(password);
    }

    // Lazily update the store with the current extension environment
    this.extension.runtime.getPlatformInfo(({ os }) => {
      this.appStateController.setBrowserEnvironment(
        os,
        // This method is presently only supported by Firefox
        this.extension.runtime.getBrowserInfo === undefined
          ? 'chrome'
          : 'firefox',
      );
    });

    // TODO:LegacyProvider: Delete
    this.publicConfigStore = this.createPublicConfigStore();
  }

  /**
   * Constructor helper: initialize a provider.
   */
<<<<<<< HEAD
  initializeProvider() {
    const version = this.platform.getVersion();
    const providerOpts = {
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      version,
      // account mgmt
      getAccounts: async ({ origin }) => {
        if (origin === 'metamask') {
          const selectedAddress = this.preferencesController.getSelectedAddress();
          return selectedAddress ? [selectedAddress] : [];
        } else if (this.isUnlocked()) {
          return await this.permissionsController.getAccounts(origin);
        }
        return []; // changing this is a breaking change
      },
      // tx signing
      processTransaction: this.newUnapprovedTransaction.bind(this),
      // msg signing
      processEthSignMessage: this.newUnsignedMessage.bind(this),
      processTypedMessage: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV3: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV4: this.newUnsignedTypedMessage.bind(this),
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
      processDecryptMessage: this.newRequestDecryptMessage.bind(this),
      processEncryptionPublicKey: this.newRequestEncryptionPublicKey.bind(this),
      getPendingNonce: this.getPendingNonce.bind(this),
      getPendingTransactionByHash: (hash) =>
        this.txController.getTransactions({
          searchCriteria: {
            hash,
            status: TRANSACTION_STATUSES.SUBMITTED,
          },
        })[0],
=======
  getLocale() {
    const { currentLocale } = this.preferencesController.store.getState();

    return currentLocale;
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
        maybeUpdatePhishingList: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'PhishingController:maybeUpdateState',
        ),
        isOnPhishingList: (origin) =>
          this.controllerMessenger.call('PhishingController:testOrigin', origin)
            .result,
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
        getSnapKeyring: this.getSnapKeyring.bind(this),
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      }),
>>>>>>> upstream/multichain-swaps-controller
    };
    const providerProxy = this.networkController.initializeProvider(
      providerOpts,
    );
<<<<<<< HEAD
    return providerProxy;
=======

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
      (truncatedSnap, origin) => {
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapInstalled,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: truncatedSnap.id,
            version: truncatedSnap.version,
            origin,
          },
        });
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapUpdated`,
      (newSnap, oldVersion, origin) => {
        this.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.SnapUpdated,
          category: MetaMetricsEventCategory.Snaps,
          properties: {
            snap_id: newSnap.id,
            old_version: oldVersion,
            new_version: newSnap.version,
            origin,
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
      },
    );

    this.controllerMessenger.subscribe(
      `${this.snapController.name}:snapUninstalled`,
      (truncatedSnap) => {
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
>>>>>>> upstream/multichain-swaps-controller
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

<<<<<<< HEAD
    function updatePublicConfigStore(memState) {
      const chainId = networkController.getCurrentChainId();
      if (memState.network !== 'loading') {
        publicConfigStore.putState(selectPublicState(chainId, memState));
      }
    }

    function selectPublicState(chainId, { isUnlocked, network }) {
      return {
        isUnlocked,
        chainId,
        networkVersion: network,
      };
    }

=======
>>>>>>> upstream/multichain-swaps-controller
    return publicConfigStore;
  }

  /**
   * Gets relevant state for the provider of an external origin.
   *
   * @param {string} origin - The origin to get the provider state for.
   * @returns {Promise<{
   *  isUnlocked: boolean,
   *  networkVersion: string,
   *  chainId: string,
   *  accounts: string[],
   * }>} An object with relevant state properties.
   */
  async getProviderState(origin) {
    return {
      isUnlocked: this.isUnlocked(),
<<<<<<< HEAD
      ...this.getProviderNetworkState(),
      accounts: await this.permissionsController.getAccounts(origin),
=======
      accounts: await this.getPermittedAccounts(origin),
      ...this.getProviderNetworkState(),
>>>>>>> upstream/multichain-swaps-controller
    };
  }

  /**
   * Gets network state relevant for external providers.
   *
<<<<<<< HEAD
   * @param {Object} [memState] - The MetaMask memState. If not provided,
   * this function will retrieve the most recent state.
   * @returns {Object} An object with relevant network state properties.
   */
  getProviderNetworkState(memState) {
    const { network } = memState || this.getState();
    return {
      chainId: this.networkController.getCurrentChainId(),
      networkVersion: network,
=======
   * @returns {object} An object with relevant network state properties.
   */
  getProviderNetworkState() {
    return {
      chainId: this.networkController.state.providerConfig.chainId,
      networkVersion: this.deprecatedNetworkId ?? 'loading',
>>>>>>> upstream/multichain-swaps-controller
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
   * @returns {Object} status
   */
  getState() {
    const { vault } = this.keyringController.store.getState();
    const isInitialized = Boolean(vault);

    return {
      isInitialized,
      ...this.memStore.getFlatState(),
    };
  }

  /**
   * Returns an Object containing API Callback Functions.
   * These functions are the interface for the UI.
   * The API object can be transmitted over a stream via JSON-RPC.
   *
   * @returns {Object} Object containing API functions.
   */
  getApi() {
    const {
      alertController,
      approvalController,
      keyringController,
      metaMetricsController,
      networkController,
      onboardingController,
      permissionsController,
      preferencesController,
      swapsController,
      threeBoxController,
      txController,
      tokensController,
    } = this;

    return {
      // etc
      getState: (cb) => cb(null, this.getState()),
      setCurrentCurrency: nodeify(
        this.currencyRateController.setCurrentCurrency.bind(
          this.currencyRateController,
        ),
      ),
      setUseBlockie: this.setUseBlockie.bind(this),
      setUseNonceField: this.setUseNonceField.bind(this),
      setUsePhishDetect: this.setUsePhishDetect.bind(this),
      setUseTokenDetection: nodeify(
        this.preferencesController.setUseTokenDetection,
        this.preferencesController,
      ),
      setIpfsGateway: this.setIpfsGateway.bind(this),
      setParticipateInMetaMetrics: this.setParticipateInMetaMetrics.bind(this),
      setCurrentLocale: this.setCurrentLocale.bind(this),
      markPasswordForgotten: this.markPasswordForgotten.bind(this),
      unMarkPasswordForgotten: this.unMarkPasswordForgotten.bind(this),
      safelistPhishingDomain: this.safelistPhishingDomain.bind(this),
      getRequestAccountTabIds: (cb) => cb(null, this.getRequestAccountTabIds()),
      getOpenMetamaskTabsIds: (cb) => cb(null, this.getOpenMetamaskTabsIds()),

      // primary HD keyring management
      addNewAccount: nodeify(this.addNewAccount, this),
      verifySeedPhrase: nodeify(this.verifySeedPhrase, this),
      resetAccount: nodeify(this.resetAccount, this),
      removeAccount: nodeify(this.removeAccount, this),
      importAccountWithStrategy: nodeify(this.importAccountWithStrategy, this),

      // hardware wallets
      connectHardware: nodeify(this.connectHardware, this),
      forgetDevice: nodeify(this.forgetDevice, this),
      checkHardwareStatus: nodeify(this.checkHardwareStatus, this),
      unlockHardwareWalletAccount: nodeify(
        this.unlockHardwareWalletAccount,
        this,
      ),
      setLedgerTransportPreference: nodeify(
        this.setLedgerTransportPreference,
        this,
      ),

      // mobile
      fetchInfoToSync: nodeify(this.fetchInfoToSync, this),

      // vault management
      submitPassword: nodeify(this.submitPassword, this),
      verifyPassword: nodeify(this.verifyPassword, this),

      // network management
<<<<<<< HEAD
      setProviderType: nodeify(
        networkController.setProviderType,
        networkController,
      ),
      rollbackToPreviousProvider: nodeify(
        networkController.rollbackToPreviousProvider,
        networkController,
      ),
      setCustomRpc: nodeify(this.setCustomRpc, this),
      updateAndSetCustomRpc: nodeify(this.updateAndSetCustomRpc, this),
      delCustomRpc: nodeify(this.delCustomRpc, this),

=======
      setProviderType:
        networkController.setProviderType.bind(networkController),
      rollbackToPreviousProvider:
        networkController.rollbackToPreviousProvider.bind(networkController),
      removeNetworkConfiguration:
        networkController.removeNetworkConfiguration.bind(networkController),
      setActiveNetwork:
        networkController.setActiveNetwork.bind(networkController),
      upsertNetworkConfiguration:
        networkController.upsertNetworkConfiguration.bind(networkController),
      getNetworkClientById:
        networkController.getNetworkClientById.bind(networkController),
      getCurrentNetworkEIP1559Compatibility:
        networkController.getEIP1559Compatibility.bind(networkController),
>>>>>>> upstream/multichain-swaps-controller
      // PreferencesController
      setSelectedAddress: nodeify(
        preferencesController.setSelectedAddress,
        preferencesController,
      ),
      addToken: nodeify(tokensController.addToken, tokensController),
      rejectWatchAsset: nodeify(
        tokensController.rejectWatchAsset,
        tokensController,
      ),
      acceptWatchAsset: nodeify(
        tokensController.acceptWatchAsset,
        tokensController,
      ),
      updateTokenType: nodeify(
        tokensController.updateTokenType,
        tokensController,
      ),
      removeToken: nodeify(
        tokensController.removeAndIgnoreToken,
        tokensController,
      ),
      setAccountLabel: nodeify(
        preferencesController.setAccountLabel,
        preferencesController,
      ),
      setFeatureFlag: nodeify(
        preferencesController.setFeatureFlag,
        preferencesController,
      ),
      setPreference: nodeify(
        preferencesController.setPreference,
        preferencesController,
      ),

      addKnownMethodData: nodeify(
        preferencesController.addKnownMethodData,
        preferencesController,
      ),
      setDismissSeedBackUpReminder: nodeify(
        this.preferencesController.setDismissSeedBackUpReminder,
        this.preferencesController,
      ),

      // AddressController
      setAddressBook: nodeify(
        this.addressBookController.set,
        this.addressBookController,
      ),
      removeFromAddressBook: nodeify(
        this.addressBookController.delete,
        this.addressBookController,
      ),

      // AppStateController
      setLastActiveTime: nodeify(
        this.appStateController.setLastActiveTime,
        this.appStateController,
      ),
      setDefaultHomeActiveTabName: nodeify(
        this.appStateController.setDefaultHomeActiveTabName,
        this.appStateController,
      ),
      setConnectedStatusPopoverHasBeenShown: nodeify(
        this.appStateController.setConnectedStatusPopoverHasBeenShown,
        this.appStateController,
      ),
      setRecoveryPhraseReminderHasBeenShown: nodeify(
        this.appStateController.setRecoveryPhraseReminderHasBeenShown,
        this.appStateController,
      ),
      setRecoveryPhraseReminderLastShown: nodeify(
        this.appStateController.setRecoveryPhraseReminderLastShown,
        this.appStateController,
      ),

      // EnsController
      tryReverseResolveAddress: nodeify(
        this.ensController.reverseResolveAddress,
        this.ensController,
      ),

      // KeyringController
      setLocked: nodeify(this.setLocked, this),
      createNewVaultAndKeychain: nodeify(this.createNewVaultAndKeychain, this),
      createNewVaultAndRestore: nodeify(this.createNewVaultAndRestore, this),
      exportAccount: nodeify(
        keyringController.exportAccount,
        keyringController,
      ),

      // txController
<<<<<<< HEAD
      cancelTransaction: nodeify(txController.cancelTransaction, txController),
      updateTransaction: nodeify(txController.updateTransaction, txController),
      updateAndApproveTransaction: nodeify(
        txController.updateAndApproveTransaction,
        txController,
      ),
      createCancelTransaction: nodeify(this.createCancelTransaction, this),
      createSpeedUpTransaction: nodeify(this.createSpeedUpTransaction, this),
      isNonceTaken: nodeify(txController.isNonceTaken, txController),
      estimateGas: nodeify(this.estimateGas, this),
      getPendingNonce: nodeify(this.getPendingNonce, this),
      getNextNonce: nodeify(this.getNextNonce, this),
      addUnapprovedTransaction: nodeify(
        txController.addUnapprovedTransaction,
        txController,
=======
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
        createTransactionEventFragmentWithTxId.bind(
          null,
          this.getTransactionMetricsRequest(),
        ),
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
>>>>>>> upstream/multichain-swaps-controller
      ),

      // messageManager
      signMessage: nodeify(this.signMessage, this),
      cancelMessage: this.cancelMessage.bind(this),

      // personalMessageManager
      signPersonalMessage: nodeify(this.signPersonalMessage, this),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this),

      // typedMessageManager
      signTypedMessage: nodeify(this.signTypedMessage, this),
      cancelTypedMessage: this.cancelTypedMessage.bind(this),

      // decryptMessageManager
      decryptMessage: nodeify(this.decryptMessage, this),
      decryptMessageInline: nodeify(this.decryptMessageInline, this),
      cancelDecryptMessage: this.cancelDecryptMessage.bind(this),

      // EncryptionPublicKeyManager
      encryptionPublicKey: nodeify(this.encryptionPublicKey, this),
      cancelEncryptionPublicKey: this.cancelEncryptionPublicKey.bind(this),

      // onboarding controller
      setSeedPhraseBackedUp: nodeify(
        onboardingController.setSeedPhraseBackedUp,
        onboardingController,
      ),
      completeOnboarding: nodeify(
        onboardingController.completeOnboarding,
        onboardingController,
      ),
      setFirstTimeFlowType: nodeify(
        onboardingController.setFirstTimeFlowType,
        onboardingController,
      ),

      // alert controller
      setAlertEnabledness: nodeify(
        alertController.setAlertEnabledness,
        alertController,
      ),
      setUnconnectedAccountAlertShown: nodeify(
        alertController.setUnconnectedAccountAlertShown,
        alertController,
      ),
      setWeb3ShimUsageAlertDismissed: nodeify(
        alertController.setWeb3ShimUsageAlertDismissed,
        alertController,
      ),

      // 3Box
      setThreeBoxSyncingPermission: nodeify(
        threeBoxController.setThreeBoxSyncingPermission,
        threeBoxController,
      ),
      restoreFromThreeBox: nodeify(
        threeBoxController.restoreFromThreeBox,
        threeBoxController,
      ),
      setShowRestorePromptToFalse: nodeify(
        threeBoxController.setShowRestorePromptToFalse,
        threeBoxController,
      ),
      getThreeBoxLastUpdated: nodeify(
        threeBoxController.getLastUpdated,
        threeBoxController,
      ),
      turnThreeBoxSyncingOn: nodeify(
        threeBoxController.turnThreeBoxSyncingOn,
        threeBoxController,
      ),
      initializeThreeBox: nodeify(this.initializeThreeBox, this),

      // permissions
      approvePermissionsRequest: nodeify(
        permissionsController.approvePermissionsRequest,
        permissionsController,
      ),
      clearPermissions: permissionsController.clearPermissions.bind(
        permissionsController,
      ),
      getApprovedAccounts: nodeify(
        permissionsController.getAccounts,
        permissionsController,
      ),
      rejectPermissionsRequest: nodeify(
        permissionsController.rejectPermissionsRequest,
        permissionsController,
      ),
<<<<<<< HEAD
      removePermissionsFor: permissionsController.removePermissionsFor.bind(
        permissionsController,
      ),
      addPermittedAccount: nodeify(
        permissionsController.addPermittedAccount,
        permissionsController,
=======
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
      disableSnap: this.controllerMessenger.call.bind(
        this.controllerMessenger,
        'SnapController:disable',
>>>>>>> upstream/multichain-swaps-controller
      ),
      removePermittedAccount: nodeify(
        permissionsController.removePermittedAccount,
        permissionsController,
      ),
      requestAccountsPermissionWithId: nodeify(
        permissionsController.requestAccountsPermissionWithId,
        permissionsController,
      ),

      // swaps
      fetchAndSetQuotes: nodeify(
        swapsController.fetchAndSetQuotes,
        swapsController,
      ),
      setSelectedQuoteAggId: nodeify(
        swapsController.setSelectedQuoteAggId,
        swapsController,
      ),
      resetSwapsState: nodeify(
        swapsController.resetSwapsState,
        swapsController,
      ),
      setSwapsTokens: nodeify(swapsController.setSwapsTokens, swapsController),
      clearSwapsQuotes: nodeify(
        swapsController.clearSwapsQuotes,
        swapsController,
      ),
      setApproveTxId: nodeify(swapsController.setApproveTxId, swapsController),
      setTradeTxId: nodeify(swapsController.setTradeTxId, swapsController),
      setSwapsTxGasPrice: nodeify(
        swapsController.setSwapsTxGasPrice,
        swapsController,
      ),
      setSwapsTxGasLimit: nodeify(
        swapsController.setSwapsTxGasLimit,
        swapsController,
      ),
      setSwapsTxMaxFeePerGas: nodeify(
        swapsController.setSwapsTxMaxFeePerGas,
        swapsController,
      ),
      setSwapsTxMaxFeePriorityPerGas: nodeify(
        swapsController.setSwapsTxMaxFeePriorityPerGas,
        swapsController,
      ),
      safeRefetchQuotes: nodeify(
        swapsController.safeRefetchQuotes,
        swapsController,
      ),
      stopPollingForQuotes: nodeify(
        swapsController.stopPollingForQuotes,
        swapsController,
      ),
      setBackgroundSwapRouteState: nodeify(
        swapsController.setBackgroundSwapRouteState,
        swapsController,
      ),
      resetPostFetchState: nodeify(
        swapsController.resetPostFetchState,
        swapsController,
      ),
      setSwapsErrorKey: nodeify(
        swapsController.setSwapsErrorKey,
        swapsController,
      ),
      setInitialGasEstimate: nodeify(
        swapsController.setInitialGasEstimate,
        swapsController,
      ),
      setCustomApproveTxData: nodeify(
        swapsController.setCustomApproveTxData,
        swapsController,
      ),
      setSwapsLiveness: nodeify(
        swapsController.setSwapsLiveness,
        swapsController,
      ),
      setSwapsUserFeeLevel: nodeify(
        swapsController.setSwapsUserFeeLevel,
        swapsController,
      ),
      setSwapsQuotesPollingLimitEnabled: nodeify(
        swapsController.setSwapsQuotesPollingLimitEnabled,
        swapsController,
      ),

      // MetaMetrics
      trackMetaMetricsEvent: nodeify(
        metaMetricsController.trackEvent,
        metaMetricsController,
      ),
      trackMetaMetricsPage: nodeify(
        metaMetricsController.trackPage,
        metaMetricsController,
      ),

      // approval controller
      resolvePendingApproval: nodeify(
        approvalController.accept,
        approvalController,
      ),
      rejectPendingApproval: nodeify(
        approvalController.reject,
        approvalController,
      ),

      // Notifications
      updateViewedNotifications: nodeify(
        this.notificationController.updateViewed,
        this.notificationController,
      ),

      // GasFeeController
      getGasFeeEstimatesAndStartPolling: nodeify(
        this.gasFeeController.getGasFeeEstimatesAndStartPolling,
        this.gasFeeController,
      ),

      disconnectGasFeeEstimatePoller: nodeify(
        this.gasFeeController.disconnectPoller,
        this.gasFeeController,
      ),

      getGasFeeTimeEstimate: nodeify(
        this.gasFeeController.getTimeEstimate,
        this.gasFeeController,
      ),

      addPollingTokenToAppState: nodeify(
        this.appStateController.addPollingToken,
        this.appStateController,
      ),

      removePollingTokenFromAppState: nodeify(
        this.appStateController.removePollingToken,
        this.appStateController,
      ),

      // DetectTokenController
      detectNewTokens: nodeify(
        this.detectTokensController.detectNewTokens,
        this.detectTokensController,
      ),
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
   * @returns {Object} vault
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
   * @param {string} password
   * @param {string} seed
   */
  async createNewVaultAndRestore(password, seed) {
    const releaseLock = await this.createVaultMutex.acquire();
    try {
      let accounts, lastBalance;

      const { keyringController } = this;

      // clear known identities
      this.preferencesController.setAddresses([]);

      // clear permissions
      this.permissionsController.clearPermissions();

      // clear accounts in accountTracker
      this.accountTracker.clearAccounts();

      // clear cachedBalances
      this.cachedBalancesController.clearCachedBalances();

      // clear unapproved transactions
      this.txController.txStateManager.clearUnapprovedTxs();

      // create new vault
      const vault = await keyringController.createNewVaultAndRestore(
        password,
        seed,
      );

      const ethQuery = new EthQuery(this.provider);
      accounts = await keyringController.getAccounts();
      lastBalance = await this.getBalance(
        accounts[accounts.length - 1],
        ethQuery,
      );

      const primaryKeyring = keyringController.getKeyringsByType(
        'HD Key Tree',
      )[0];
      if (!primaryKeyring) {
        throw new Error('MetamaskController - No HD Key Tree found');
      }

      // seek out the first zero balance
      while (lastBalance !== '0x0') {
        await keyringController.addNewAccount(primaryKeyring);
        accounts = await keyringController.getAccounts();
        lastBalance = await this.getBalance(
          accounts[accounts.length - 1],
          ethQuery,
        );
      }

      // remove extra zero balance account potentially created from seeking ahead
      if (accounts.length > 1 && lastBalance === '0x0') {
        await this.removeAccount(accounts[accounts.length - 1]);
        accounts = await keyringController.getAccounts();
      }

      // set new identities
      this.preferencesController.setAddresses(accounts);
      this.selectFirstIdentity();
      return vault;
    } finally {
      releaseLock();
    }
  }

  /**
   * Get an account balance from the AccountTracker or request it directly from the network.
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
   * Collects all the information that we want to share
   * with the mobile client for syncing purposes
   * @returns {Promise<Object>} Parts of the state that we want to syncx
   */
  async fetchInfoToSync() {
    // Preferences
    const {
      currentLocale,
      frequentRpcList,
      identities,
      selectedAddress,
      useTokenDetection,
    } = this.preferencesController.store.getState();

    const { tokenList } = this.tokenListController.state;

    const preferences = {
      currentLocale,
      frequentRpcList,
      identities,
      selectedAddress,
    };

    // Tokens
    const { allTokens, allIgnoredTokens } = this.tokensController.state;

    // Filter ERC20 tokens
    const allERC20Tokens = {};

    Object.keys(allTokens).forEach((chainId) => {
      allERC20Tokens[chainId] = {};
      Object.keys(allTokens[chainId]).forEach((accountAddress) => {
        const checksummedAccountAddress = toChecksumHexAddress(accountAddress);
        allERC20Tokens[chainId][checksummedAccountAddress] = allTokens[chainId][
          checksummedAccountAddress
        ].filter((asset) => {
          if (asset.isERC721 === undefined) {
            // since the token.address from allTokens is checksumaddress
            // asset.address have to be changed to lowercase when we are using dynamic list
            const address = useTokenDetection
              ? asset.address.toLowerCase()
              : asset.address;
            // the tokenList will be holding only erc20 tokens
            if (tokenList[address] !== undefined) {
              return true;
            }
          } else if (asset.isERC721 === false) {
            return true;
          }
          return false;
        });
      });
    });

    // Accounts
    const hdKeyring = this.keyringController.getKeyringsByType(
      'HD Key Tree',
    )[0];
    const simpleKeyPairKeyrings = this.keyringController.getKeyringsByType(
      'Simple Key Pair',
    );
    const hdAccounts = await hdKeyring.getAccounts();
    const simpleKeyPairKeyringAccounts = await Promise.all(
      simpleKeyPairKeyrings.map((keyring) => keyring.getAccounts()),
    );
    const simpleKeyPairAccounts = simpleKeyPairKeyringAccounts.reduce(
      (acc, accounts) => [...acc, ...accounts],
      [],
    );
    const accounts = {
      hd: hdAccounts
        .filter((item, pos) => hdAccounts.indexOf(item) === pos)
        .map((address) => toChecksumHexAddress(address)),
      simpleKeyPair: simpleKeyPairAccounts
        .filter((item, pos) => simpleKeyPairAccounts.indexOf(item) === pos)
        .map((address) => toChecksumHexAddress(address)),
      ledger: [],
      trezor: [],
    };

    // transactions

    let { transactions } = this.txController.store.getState();
    // delete tx for other accounts that we're not importing
    transactions = Object.values(transactions).filter((tx) => {
      const checksummedTxFrom = toChecksumHexAddress(tx.txParams.from);
      return accounts.hd.includes(checksummedTxFrom);
    });

    return {
      accounts,
      preferences,
      transactions,
      tokens: { allTokens: allERC20Tokens, allIgnoredTokens },
      network: this.networkController.store.getState(),
    };
  }

  /*
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   * @returns {Promise<object>} The keyringController update.
   */
  async submitPassword(password) {
    await this.keyringController.submitPassword(password);

    try {
      await this.blockTracker.checkForLatestBlock();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    try {
      const threeBoxSyncingAllowed = this.threeBoxController.getThreeBoxSyncingState();
      if (threeBoxSyncingAllowed && !this.threeBoxController.box) {
        // 'await' intentionally omitted to avoid waiting for initialization
        this.threeBoxController.init();
        this.threeBoxController.turnThreeBoxSyncingOn();
      } else if (threeBoxSyncingAllowed && this.threeBoxController.box) {
        this.threeBoxController.turnThreeBoxSyncingOn();
      }
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    // This must be set as soon as possible to communicate to the
    // keyring's iframe and have the setting initialized properly
    // Optimistically called to not block Metamask login due to
    // Ledger Keyring GitHub downtime
    const transportPreference = this.preferencesController.getLedgerTransportPreference();

    this.setLedgerTransportPreference(transportPreference);

    return this.keyringController.fullUpdate();
  }

  /**
   * Submits a user's password to check its validity.
   *
   * @param {string} password The user's password
   */
  async verifyPassword(password) {
    await this.keyringController.verifyPassword(password);
  }

  /**
   * @type Identity
   * @property {string} name - The account nickname.
   * @property {string} address - The account's ethereum address, in lower case.
   * @property {boolean} mayBeFauceting - Whether this account is currently
   * receiving funds from our automatic Ropsten faucet.
   */

  /**
   * Sets the first address in the state to the selected address
   */
  selectFirstIdentity() {
    const { identities } = this.preferencesController.store.getState();
    const address = Object.keys(identities)[0];
    this.preferencesController.setSelectedAddress(address);
  }

  //
  // Hardware
  //

  async getKeyringForDevice(deviceName, hdPath = null) {
    let keyringName = null;
    switch (deviceName) {
      case 'trezor':
        keyringName = TrezorKeyring.type;
        break;
      case 'ledger':
        keyringName = LedgerBridgeKeyring.type;
        break;
      default:
        throw new Error(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
    }
    let keyring = await this.keyringController.getKeyringsByType(
      keyringName,
    )[0];
    if (!keyring) {
      keyring = await this.keyringController.addNewKeyring(keyringName);
    }
    if (hdPath && keyring.setHdPath) {
      keyring.setHdPath(hdPath);
    }

    keyring.network = this.networkController.getProviderConfig().type;

    return keyring;
  }

  /**
   * Fetch account list from a trezor device.
   *
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
   * @returns {Promise<boolean>}
   */
  async checkHardwareStatus(deviceName, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath);
    return keyring.isUnlocked();
  }

  /**
   * Clear
   *
   * @returns {Promise<boolean>}
   */
  async forgetDevice(deviceName) {
    const keyring = await this.getKeyringForDevice(deviceName);
    keyring.forgetDevice();
    return true;
  }

  /**
<<<<<<< HEAD
=======
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
>>>>>>> upstream/multichain-swaps-controller
   * Imports an account from a Trezor or Ledger device.
   *
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
        const label = `${deviceName[0].toUpperCase()}${deviceName.slice(1)} ${
          parseInt(index, 10) + 1
        } ${hdPathDescription || ''}`.trim();
        // Set the account label to Trezor 1 /  Ledger 1, etc
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
   * @returns {} keyState
   */
<<<<<<< HEAD
  async addNewAccount() {
    const primaryKeyring = this.keyringController.getKeyringsByType(
      'HD Key Tree',
    )[0];
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found');
    }
    const { keyringController } = this;
    const oldAccounts = await keyringController.getAccounts();
    const keyState = await keyringController.addNewAccount(primaryKeyring);
    const newAccounts = await keyringController.getAccounts();

    await this.verifySeedPhrase();
=======
  async addNewAccount(accountCount) {
    const oldAccounts = await this.keyringController.getAccounts();
>>>>>>> upstream/multichain-swaps-controller

    this.preferencesController.setAddresses(newAccounts);
    newAccounts.forEach((address) => {
      if (!oldAccounts.includes(address)) {
        this.preferencesController.setSelectedAddress(address);
      }
    });

    const { identities } = this.preferencesController.store.getState();
    return { ...keyState, identities };
  }

  /**
   * Verifies the validity of the current vault's seed phrase.
   *
   * Validity: seed phrase restores the accounts belonging to the current vault.
   *
   * Called when the first account is created and on unlocking the vault.
   *
   * @returns {Promise<string>} Seed phrase to be confirmed by the user.
   */
  async verifySeedPhrase() {
    const primaryKeyring = this.keyringController.getKeyringsByType(
      'HD Key Tree',
    )[0];
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found');
    }

    const serialized = await primaryKeyring.serialize();
    const seedWords = serialized.mnemonic;

    const accounts = await primaryKeyring.getAccounts();
    if (accounts.length < 1) {
      throw new Error('MetamaskController - No accounts found');
    }

    try {
      await seedPhraseVerifier.verifyAccounts(accounts, seedWords);
      return seedWords;
    } catch (err) {
      log.error(err.message);
      throw err;
    }
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
   * Removes an account from state / storage.
   *
   * @param {string[]} address - A hex address
   *
   */
  async removeAccount(address) {
    // Remove all associated permissions
    await this.permissionsController.removeAllAccountPermissions(address);
    // Remove account from the preferences controller
    this.preferencesController.removeAddress(address);
    // Remove account from the account tracker controller
    this.accountTracker.removeAccount([address]);

    // Remove account from the keyring
    await this.keyringController.removeAccount(address);
    return address;
  }

  /**
   * Imports an account with the specified import strategy.
   * These are defined in app/scripts/account-import-strategies
   * Each strategy represents a different way of serializing an Ethereum key pair.
   *
   * @param {string} strategy - A unique identifier for an account import strategy.
   * @param {any} args - The data required by that strategy to import an account.
   * @param {Function} cb - A callback function called with a state update on success.
   */
  async importAccountWithStrategy(strategy, args) {
    const privateKey = await accountImporter.importAccount(strategy, args);
    const keyring = await this.keyringController.addNewKeyring(
      'Simple Key Pair',
      [privateKey],
    );
    const accounts = await keyring.getAccounts();
    // update accounts in preferences controller
    const allAccounts = await this.keyringController.getAccounts();
    this.preferencesController.setAddresses(allAccounts);
    // set new account as selected
    await this.preferencesController.setSelectedAddress(accounts[0]);
  }

  // ---------------------------------------------------------------------------
  // Identity Management (signature operations)

  /**
   * Called when a Dapp suggests a new tx to be signed.
   * this wrapper needs to exist so we can provide a reference to
   *  "newUnapprovedTransaction" before "txController" is instantiated
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Object} req - (optional) the original request, containing the origin
   */
  async newUnapprovedTransaction(txParams, req) {
    return await this.txController.newUnapprovedTransaction(txParams, req);
  }

  // eth_sign methods:

  /**
   * Called when a Dapp uses the eth_sign method, to request user approval.
   * eth_sign is a pure signature of arbitrary data. It is on a deprecation
   * path, since this data can be a transaction, or can leak private key
   * information.
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Function} cb - The callback function called with the signature.
   */
  newUnsignedMessage(msgParams, req) {
    const promise = this.messageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
    this.sendUpdate();
    this.opts.showUserConfirmation();
    return promise;
  }

  /**
   * Signifies user intent to complete an eth_sign method.
   *
   * @param {Object} msgParams - The params passed to eth_call.
   * @returns {Promise<Object>} Full state update.
   */
  signMessage(msgParams) {
    log.info('MetaMaskController - signMessage');
    const msgId = msgParams.metamaskId;

    // sets the status op the message to 'approved'
    // and removes the metamaskId for signing
    return this.messageManager
      .approveMessage(msgParams)
      .then((cleanMsgParams) => {
        // signs the message
        return this.keyringController.signMessage(cleanMsgParams);
      })
      .then((rawSig) => {
        // tells the listener that the message has been signed
        // and can be returned to the dapp
        this.messageManager.setMsgStatusSigned(msgId, rawSig);
        return this.getState();
      });
  }

  /**
   * Used to cancel a message submitted via eth_sign.
   *
   * @param {string} msgId - The id of the message to cancel.
   */
  cancelMessage(msgId, cb) {
    const { messageManager } = this;
    messageManager.rejectMsg(msgId);
    if (!cb || typeof cb !== 'function') {
      return;
    }
    cb(null, this.getState());
  }

  // personal_sign methods:

  /**
   * Called when a dapp uses the personal_sign method.
   * This is identical to the Geth eth_sign method, and may eventually replace
   * eth_sign.
   *
   * We currently define our eth_sign and personal_sign mostly for legacy Dapps.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Function} cb - The callback function called with the signature.
   * Passed back to the requesting Dapp.
   */
  async newUnsignedPersonalMessage(msgParams, req) {
    const promise = this.personalMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
    this.sendUpdate();
    this.opts.showUserConfirmation();
    return promise;
  }

  /**
   * Signifies a user's approval to sign a personal_sign message in queue.
   * Triggers signing, and the callback function from newUnsignedPersonalMessage.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  signPersonalMessage(msgParams) {
    log.info('MetaMaskController - signPersonalMessage');
    const msgId = msgParams.metamaskId;
    // sets the status op the message to 'approved'
    // and removes the metamaskId for signing
    return this.personalMessageManager
      .approveMessage(msgParams)
      .then((cleanMsgParams) => {
        // signs the message
        return this.keyringController.signPersonalMessage(cleanMsgParams);
      })
      .then((rawSig) => {
        // tells the listener that the message has been signed
        // and can be returned to the dapp
        this.personalMessageManager.setMsgStatusSigned(msgId, rawSig);
        return this.getState();
      });
  }

  /**
   * Used to cancel a personal_sign type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelPersonalMessage(msgId, cb) {
    const messageManager = this.personalMessageManager;
    messageManager.rejectMsg(msgId);
    if (!cb || typeof cb !== 'function') {
      return;
    }
    cb(null, this.getState());
  }

  // eth_decrypt methods

  /**
   * Called when a dapp uses the eth_decrypt method.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Object} req - (optional) the original request, containing the origin
   * Passed back to the requesting Dapp.
   */
  async newRequestDecryptMessage(msgParams, req) {
    const promise = this.decryptMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
    this.sendUpdate();
    this.opts.showUserConfirmation();
    return promise;
  }

  /**
   * Only decrypt message and don't touch transaction state
   *
   * @param {Object} msgParams - The params of the message to decrypt.
   * @returns {Promise<Object>} A full state update.
   */
  async decryptMessageInline(msgParams) {
    log.info('MetaMaskController - decryptMessageInline');
    // decrypt the message inline
    const msgId = msgParams.metamaskId;
    const msg = this.decryptMessageManager.getMsg(msgId);
    try {
      const stripped = stripHexPrefix(msgParams.data);
      const buff = Buffer.from(stripped, 'hex');
      msgParams.data = JSON.parse(buff.toString('utf8'));

      msg.rawData = await this.keyringController.decryptMessage(msgParams);
    } catch (e) {
      msg.error = e.message;
    }
    this.decryptMessageManager._updateMsg(msg);

    return this.getState();
  }

  /**
   * Signifies a user's approval to decrypt a message in queue.
   * Triggers decrypt, and the callback function from newUnsignedDecryptMessage.
   *
   * @param {Object} msgParams - The params of the message to decrypt & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  async decryptMessage(msgParams) {
    log.info('MetaMaskController - decryptMessage');
    const msgId = msgParams.metamaskId;
    // sets the status op the message to 'approved'
    // and removes the metamaskId for decryption
    try {
      const cleanMsgParams = await this.decryptMessageManager.approveMessage(
        msgParams,
      );

      const stripped = stripHexPrefix(cleanMsgParams.data);
      const buff = Buffer.from(stripped, 'hex');
      cleanMsgParams.data = JSON.parse(buff.toString('utf8'));

      // decrypt the message
      const rawMess = await this.keyringController.decryptMessage(
        cleanMsgParams,
      );
      // tells the listener that the message has been decrypted and can be returned to the dapp
      this.decryptMessageManager.setMsgStatusDecrypted(msgId, rawMess);
    } catch (error) {
      log.info('MetaMaskController - eth_decrypt failed.', error);
      this.decryptMessageManager.errorMessage(msgId, error);
    }
    return this.getState();
  }

  /**
   * Used to cancel a eth_decrypt type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelDecryptMessage(msgId, cb) {
    const messageManager = this.decryptMessageManager;
    messageManager.rejectMsg(msgId);
    if (!cb || typeof cb !== 'function') {
      return;
    }
    cb(null, this.getState());
  }

  // eth_getEncryptionPublicKey methods

  /**
   * Called when a dapp uses the eth_getEncryptionPublicKey method.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Object} req - (optional) the original request, containing the origin
   * Passed back to the requesting Dapp.
   */
  async newRequestEncryptionPublicKey(msgParams, req) {
    const address = msgParams;
    const keyring = await this.keyringController.getKeyringForAccount(address);

    switch (keyring.type) {
      case KEYRING_TYPES.LEDGER: {
        return new Promise((_, reject) => {
          reject(
            new Error('Ledger does not support eth_getEncryptionPublicKey.'),
          );
        });
      }

      case KEYRING_TYPES.TREZOR: {
        return new Promise((_, reject) => {
          reject(
            new Error('Trezor does not support eth_getEncryptionPublicKey.'),
          );
        });
      }

      default: {
        const promise = this.encryptionPublicKeyManager.addUnapprovedMessageAsync(
          msgParams,
          req,
        );
        this.sendUpdate();
        this.opts.showUserConfirmation();
        return promise;
      }
    }
  }

  /**
   * Signifies a user's approval to receiving encryption public key in queue.
   * Triggers receiving, and the callback function from newUnsignedEncryptionPublicKey.
   *
   * @param {Object} msgParams - The params of the message to receive & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  async encryptionPublicKey(msgParams) {
    log.info('MetaMaskController - encryptionPublicKey');
    const msgId = msgParams.metamaskId;
    // sets the status op the message to 'approved'
    // and removes the metamaskId for decryption
    try {
      const params = await this.encryptionPublicKeyManager.approveMessage(
        msgParams,
      );

      // EncryptionPublicKey message
      const publicKey = await this.keyringController.getEncryptionPublicKey(
        params.data,
      );

      // tells the listener that the message has been processed
      // and can be returned to the dapp
      this.encryptionPublicKeyManager.setMsgStatusReceived(msgId, publicKey);
    } catch (error) {
      log.info(
        'MetaMaskController - eth_getEncryptionPublicKey failed.',
        error,
      );
      this.encryptionPublicKeyManager.errorMessage(msgId, error);
    }
    return this.getState();
  }

  /**
   * Used to cancel a eth_getEncryptionPublicKey type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelEncryptionPublicKey(msgId, cb) {
    const messageManager = this.encryptionPublicKeyManager;
    messageManager.rejectMsg(msgId);
    if (!cb || typeof cb !== 'function') {
      return;
    }
    cb(null, this.getState());
  }

  // eth_signTypedData methods

  /**
   * Called when a dapp uses the eth_signTypedData method, per EIP 712.
   *
   * @param {Object} msgParams - The params passed to eth_signTypedData.
   * @param {Function} cb - The callback function, called with the signature.
   */
  newUnsignedTypedMessage(msgParams, req, version) {
    const promise = this.typedMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
      version,
    );
    this.sendUpdate();
    this.opts.showUserConfirmation();
    return promise;
  }

  /**
   * The method for a user approving a call to eth_signTypedData, per EIP 712.
   * Triggers the callback in newUnsignedTypedMessage.
   *
   * @param {Object} msgParams - The params passed to eth_signTypedData.
   * @returns {Object} Full state update.
   */
  async signTypedMessage(msgParams) {
    log.info('MetaMaskController - eth_signTypedData');
    const msgId = msgParams.metamaskId;
    const { version } = msgParams;
    try {
      const cleanMsgParams = await this.typedMessageManager.approveMessage(
        msgParams,
      );

      // For some reason every version after V1 used stringified params.
      if (version !== 'V1') {
        // But we don't have to require that. We can stop suggesting it now:
        if (typeof cleanMsgParams.data === 'string') {
          cleanMsgParams.data = JSON.parse(cleanMsgParams.data);
        }
      }

      const signature = await this.keyringController.signTypedMessage(
        cleanMsgParams,
        { version },
      );
      this.typedMessageManager.setMsgStatusSigned(msgId, signature);
      return this.getState();
    } catch (error) {
      log.info('MetaMaskController - eth_signTypedData failed.', error);
      this.typedMessageManager.errorMessage(msgId, error);
      throw error;
    }
  }

  /**
   * Used to cancel a eth_signTypedData type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelTypedMessage(msgId, cb) {
    const messageManager = this.typedMessageManager;
    messageManager.rejectMsg(msgId);
    if (!cb || typeof cb !== 'function') {
      return;
    }
    cb(null, this.getState());
  }

  /**
   * Method to return a boolean if the keyring for the currently selected
   * account is a ledger or trezor keyring.
   * TODO: remove this method when Ledger and Trezor release their supported
   * client utilities for EIP-1559
   * @returns {boolean} true if the keyring type supports EIP-1559
   */
  async getCurrentAccountEIP1559Compatibility(fromAddress) {
    const address =
      fromAddress || this.preferencesController.getSelectedAddress();
    const keyring = await this.keyringController.getKeyringForAccount(address);
    return keyring.type !== KEYRING_TYPES.TREZOR;
  }

  //=============================================================================
  // END (VAULT / KEYRING RELATED METHODS)
  //=============================================================================

  /**
   * Allows a user to attempt to cancel a previously submitted transaction
   * by creating a new transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to
   *  attempt to cancel
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
   * @returns {Object} MetaMask state
   */
  async createCancelTransaction(
    originalTxId,
    customGasSettings,
    newTxMetaProps,
  ) {
    await this.txController.createCancelTransaction(
      originalTxId,
      customGasSettings,
      newTxMetaProps,
    );
    const state = await this.getState();
    return state;
  }

  /**
   * Allows a user to attempt to speed up a previously submitted transaction
   * by creating a new transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to
   *  attempt to speed up
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
   * @returns {Object} MetaMask state
   */
  async createSpeedUpTransaction(
    originalTxId,
    customGasSettings,
    newTxMetaProps,
  ) {
    await this.txController.createSpeedUpTransaction(
      originalTxId,
      customGasSettings,
      newTxMetaProps,
    );
    const state = await this.getState();
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

  //=============================================================================
  // PASSWORD MANAGEMENT
  //=============================================================================

  /**
   * Allows a user to begin the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  markPasswordForgotten(cb) {
    this.preferencesController.setPasswordForgotten(true);
    this.sendUpdate();
    cb();
  }

  /**
   * Allows a user to end the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  unMarkPasswordForgotten(cb) {
    this.preferencesController.setPasswordForgotten(false);
    this.sendUpdate();
    cb();
  }

  //=============================================================================
  // SETUP
  //=============================================================================

  /**
   * A runtime.MessageSender object, as provided by the browser:
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
   * @typedef {Object} MessageSender
   */

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   * @param {*} connectionStream - The Duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupUntrustedCommunication(connectionStream, sender) {
    const { usePhishDetect } = this.preferencesController.store.getState();
    const { hostname } = new URL(sender.url);
    // Check if new connection is blocked if phishing detection is on
    if (usePhishDetect && this.phishingController.test(hostname)) {
      log.debug('MetaMask - sending phishing warning for', hostname);
      this.sendPhishingWarning(connectionStream, hostname);
      return;
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream);

    // messages between inpage and background
    this.setupProviderConnection(mux.createStream('metamask-provider'), sender);

    // TODO:LegacyProvider: Delete
    // legacy streams
    this.setupPublicConfig(mux.createStream('publicConfig'));
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
    this.setupProviderConnection(mux.createStream('provider'), sender, true);
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
   * @param {*} outStream - The stream to provide our API over.
   */
  setupControllerConnection(outStream) {
    const api = this.getApi();

    // report new active controller connection
    this.activeControllerConnections += 1;
    this.emit('controllerConnectionChanged', this.activeControllerConnections);

    // set up postStream transport
    outStream.on('data', createMetaRPCHandler(api, outStream));
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
   * @param {*} outStream - The stream to provide over.
   * @param {MessageSender} sender - The sender of the messages on this stream
   * @param {boolean} isInternal - True if this is a connection with an internal process
   */
  setupProviderConnection(outStream, sender, isInternal) {
    const origin = isInternal ? 'metamask' : new URL(sender.url).origin;
    let extensionId;
    if (sender.id !== this.extension.runtime.id) {
      extensionId = sender.id;
    }
    let tabId;
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id;
    }

    const engine = this.setupProviderEngine({
      origin,
      location: sender.url,
      extensionId,
      tabId,
      isInternal,
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

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   * @param {Object} options - Provider engine options
   * @param {string} options.origin - The origin of the sender
   * @param {string} options.location - The full URL of the sender
   * @param {extensionId} [options.extensionId] - The extension ID of the sender, if the sender is an external extension
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   * @param {boolean} [options.isInternal] - True if called for a connection to an internal process
   **/
  setupProviderEngine({
    origin,
    location,
    extensionId,
    tabId,
    isInternal = false,
  }) {
    // setup json rpc engine stack
    const engine = new JsonRpcEngine();
    const { provider, blockTracker } = this;

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

    // append origin to each request
    engine.push(createOriginMiddleware({ origin }));
    // append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }));
    }
    // logging
    engine.push(createLoggerMiddleware({ origin }));
    engine.push(
<<<<<<< HEAD
      createOnboardingMiddleware({
        location,
        registerOnboarding: this.onboardingController.registerOnboarding,
=======
      createPPOMMiddleware(
        this.ppomController,
        this.preferencesController,
        this.networkController,
      ),
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
        getSelectedAddress: this.preferencesController.getSelectedAddress.bind(
          this.preferencesController,
        ),
        getAccountType: this.getAccountType.bind(this),
        getDeviceModel: this.getDeviceModel.bind(this),
        snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
          name: 'SnapAndHardwareMessenger',
          allowedActions: [
            'KeyringController:getKeyringForAccount',
            'SnapController:get',
          ],
        }),
>>>>>>> upstream/multichain-swaps-controller
      }),
    );
    engine.push(
      createMethodMiddleware({
        origin,
        getProviderState: this.getProviderState.bind(this),
        sendMetrics: this.metaMetricsController.trackEvent.bind(
          this.metaMetricsController,
        ),
        handleWatchAssetRequest: this.tokensController.watchAsset.bind(
          this.tokensController,
        ),
        getWeb3ShimUsageState: this.alertController.getWeb3ShimUsageState.bind(
          this.alertController,
        ),
        setWeb3ShimUsageRecorded: this.alertController.setWeb3ShimUsageRecorded.bind(
          this.alertController,
        ),
        findCustomRpcBy: this.findCustomRpcBy.bind(this),
        getCurrentChainId: this.networkController.getCurrentChainId.bind(
          this.networkController,
        ),
        requestUserApproval: this.approvalController.addAndShowApprovalRequest.bind(
          this.approvalController,
        ),
        updateRpcTarget: ({ rpcUrl, chainId, ticker, nickname }) => {
          this.networkController.setRpcTarget(
            rpcUrl,
            chainId,
            ticker,
            nickname,
          );
        },
        setProviderType: this.networkController.setProviderType.bind(
          this.networkController,
        ),
        addCustomRpc: async ({
          chainId,
          blockExplorerUrl,
          ticker,
          chainName,
          rpcUrl,
        } = {}) => {
          await this.preferencesController.addToFrequentRpcList(
            rpcUrl,
            chainId,
            ticker,
            chainName,
            {
              blockExplorerUrl,
            },
          );
        },
      }),
    );
<<<<<<< HEAD
=======

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
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
        hasPermission: this.permissionController.hasPermission.bind(
          this.permissionController,
        ),
        getSnap: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:get',
        ),
        handleSnapRpcRequest: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:handleRequest',
        ),
        getAllowedKeyringMethods: keyringSnapPermissionsBuilder(
          this.subjectMetadataController,
        ),
        ///: END:ONLY_INCLUDE_IN
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      }),
    );
    ///: END:ONLY_INCLUDE_IN

>>>>>>> upstream/multichain-swaps-controller
    // filter and subscription polyfills
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);
    if (!isInternal) {
      // permissions
      engine.push(
        this.permissionsController.createMiddleware({ origin, extensionId }),
      );
    }
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
   * @param {Object} options - Data associated with the connection
   * @param {Object} options.engine - The connection's JSON Rpc Engine
   * @returns {string} The connection's id (so that it can be deleted later)
   */
  addConnection(origin, { engine }) {
    if (origin === 'metamask') {
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
   * Causes the RPC engines associated with the connections to the given origin
   * to emit a notification event with the given payload.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {any} payload - The event payload.
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
   * @param {any} payload - The event payload, or payload getter function.
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
   * @param {Object} state - the KC state
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
   * Handle global unlock, triggered by KeyringController unlock.
   * Notifies all connections that the extension is unlocked.
   */
  _onUnlock() {
    this.notifyAllConnections(async (origin) => {
      return {
        method: NOTIFICATION_NAMES.unlockStateChanged,
        params: {
          isUnlocked: true,
          accounts: await this.permissionsController.getAccounts(origin),
        },
      };
    });
    this.emit('unlock');
  }

  /**
   * Handle global lock, triggered by KeyringController lock.
   * Notifies all connections that the extension is locked.
   */
  _onLock() {
    this.notifyAllConnections({
      method: NOTIFICATION_NAMES.unlockStateChanged,
      params: {
        isUnlocked: false,
      },
    });
    this.emit('lock');
  }

  /**
   * Handle memory state updates.
   * - Ensure isClientOpenAndUnlocked is updated
   * - Notifies all connections with the new provider network state
   *   - The external providers handle diffing the state
   */
  _onStateUpdate(newState) {
    this.isClientOpenAndUnlocked = newState.isUnlocked && this._isClientOpen;
    this._notifyChainChange();
  }

  // misc

  /**
   * A method for emitting the full MetaMask state to all registered listeners.
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

  /**
   * Returns the nonce that will be associated with a transaction once approved
   * @param {string} address - The hex string address for the transaction
   * @returns {Promise<number>}
   */
  async getPendingNonce(address) {
    const {
      nonceDetails,
      releaseLock,
    } = await this.txController.nonceTracker.getNonceLock(address);
    const pendingNonce = nonceDetails.params.highestSuggested;

    releaseLock();
    return pendingNonce;
  }

  /**
   * Returns the next nonce according to the nonce-tracker
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
   * Migrate address book state from old to new chainId.
   *
   * Address book state is keyed by the `networkStore` state from the network controller. This value is set to the
   * `networkId` for our built-in Infura networks, but it's set to the `chainId` for custom networks.
   * When this `chainId` value is changed for custom RPC endpoints, we need to migrate any contacts stored under the
   * old key to the new key.
   *
   * The `duplicate` parameter is used to specify that the contacts under the old key should not be removed. This is
   * useful in the case where two RPC endpoints shared the same set of contacts, and we're not sure which one each
   * contact belongs under. Duplicating the contacts under both keys is the only way to ensure they are not lost.
   *
   * @param {string} oldChainId - The old chainId
   * @param {string} newChainId - The new chainId
   * @param {boolean} [duplicate] - Whether to duplicate the addresses on both chainIds (default: false)
   */
  async migrateAddressBookState(oldChainId, newChainId, duplicate = false) {
    const { addressBook } = this.addressBookController.state;

    if (!addressBook[oldChainId]) {
      return;
    }

    for (const address of Object.keys(addressBook[oldChainId])) {
      const entry = addressBook[oldChainId][address];
      this.addressBookController.set(
        address,
        entry.name,
        newChainId,
        entry.memo,
      );
      if (!duplicate) {
        this.addressBookController.delete(oldChainId, address);
      }
    }
  }

  /**
   * A method for setting TransactionController event listeners
   */
  _addTransactionControllerListeners() {
    const transactionMetricsRequest = this.getTransactionMetricsRequest();

    this.txController.on(
      TransactionEvent.postTransactionBalanceUpdated,
      handlePostTransactionBalanceUpdate.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.added,
      handleTransactionAdded.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.approved,
      handleTransactionApproved.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.dropped,
      handleTransactionDropped.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.confirmed,
      handleTransactionConfirmed.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.failed,
      handleTransactionFailed.bind(null, transactionMetricsRequest),
    );
    this.txController.on(TransactionEvent.newSwap, ({ transactionMeta }) => {
      this.swapsController.setTradeTxId(transactionMeta.id);
    });
    this.txController.on(
      TransactionEvent.newSwapApproval,
      ({ transactionMeta }) => {
        this.swapsController.setApproveTxId(transactionMeta.id);
      },
    );
    this.txController.on(
      TransactionEvent.rejected,
      handleTransactionRejected.bind(null, transactionMetricsRequest),
    );
    this.txController.on(
      TransactionEvent.submitted,
      handleTransactionSubmitted.bind(null, transactionMetricsRequest),
    );

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
      getTransaction: this.txController.txStateManager.getTransaction.bind(
        this.txController,
      ),
    };
    return {
      ...controllerActions,
      snapAndHardwareMessenger: this.controllerMessenger.getRestricted({
        name: 'SnapAndHardwareMessenger',
        allowedActions: [
          'KeyringController:getKeyringForAccount',
          'SnapController:get',
        ],
      }),
      provider: this.provider,
    };
  }

  //=============================================================================
  // CONFIG
  //=============================================================================

  // Log blocks

  /**
   * A method for selecting a custom URL for an ethereum RPC provider and updating it
   * @param {string} rpcUrl - A URL for a valid Ethereum RPC API.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} [nickname] - Nickname of the selected network.
   * @param {Object} [rpcPrefs] - RPC preferences.
   * @param {string} [rpcPrefs.blockExplorerUrl] - URL of block explorer for the chain.
   * @returns {Promise<String>} - The RPC Target URL confirmed.
   */
  async updateAndSetCustomRpc(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname,
    rpcPrefs,
  ) {
    this.networkController.setRpcTarget(
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    );
    await this.preferencesController.updateRpc({
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    });
    return rpcUrl;
  }

  /**
   * A method for selecting a custom URL for an ethereum RPC provider.
   * @param {string} rpcUrl - A URL for a valid Ethereum RPC API.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<String>} The RPC Target URL confirmed.
   */
  async setCustomRpc(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname = '',
    rpcPrefs = {},
  ) {
    const frequentRpcListDetail = this.preferencesController.getFrequentRpcListDetail();
    const rpcSettings = frequentRpcListDetail.find(
      (rpc) => rpcUrl === rpc.rpcUrl,
    );

    if (rpcSettings) {
      this.networkController.setRpcTarget(
        rpcSettings.rpcUrl,
        rpcSettings.chainId,
        rpcSettings.ticker,
        rpcSettings.nickname,
        rpcPrefs,
      );
    } else {
      this.networkController.setRpcTarget(
        rpcUrl,
        chainId,
        ticker,
        nickname,
        rpcPrefs,
      );
      await this.preferencesController.addToFrequentRpcList(
        rpcUrl,
        chainId,
        ticker,
        nickname,
        rpcPrefs,
      );
    }
    return rpcUrl;
  }

  /**
   * A method for deleting a selected custom URL.
   * @param {string} rpcUrl - A RPC URL to delete.
   */
  async delCustomRpc(rpcUrl) {
    await this.preferencesController.removeFromFrequentRpcList(rpcUrl);
  }

  /**
   * Returns the first RPC info object that matches at least one field of the
   * provided search criteria. Returns null if no match is found
   *
   * @param {Object} rpcInfo - The RPC endpoint properties and values to check.
   * @returns {Object} rpcInfo found in the frequentRpcList
   */
  findCustomRpcBy(rpcInfo) {
    const frequentRpcListDetail = this.preferencesController.getFrequentRpcListDetail();
    for (const existingRpcInfo of frequentRpcListDetail) {
      for (const key of Object.keys(rpcInfo)) {
        if (existingRpcInfo[key] === rpcInfo[key]) {
          return existingRpcInfo;
        }
      }
    }
    return null;
  }

  async initializeThreeBox() {
    await this.threeBoxController.init();
  }

  /**
   * Sets whether or not to use the blockie identicon format.
   * @param {boolean} val - True for bockie, false for jazzicon.
   * @param {Function} cb - A callback function called when complete.
   */
  setUseBlockie(val, cb) {
    try {
      this.preferencesController.setUseBlockie(val);
      cb(null);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * Sets whether or not to use the nonce field.
   * @param {boolean} val - True for nonce field, false for not nonce field.
   * @param {Function} cb - A callback function called when complete.
   */
  setUseNonceField(val, cb) {
    try {
      this.preferencesController.setUseNonceField(val);
      cb(null);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * Sets whether or not to use phishing detection.
   * @param {boolean} val
   * @param {Function} cb
   */
  setUsePhishDetect(val, cb) {
    try {
      this.preferencesController.setUsePhishDetect(val);
      cb(null);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * Sets the IPFS gateway to use for ENS content resolution.
   * @param {string} val - the host of the gateway to set
   * @param {Function} cb - A callback function called when complete.
   */
  setIpfsGateway(val, cb) {
    try {
      this.preferencesController.setIpfsGateway(val);
      cb(null);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * Sets the Ledger Live preference to use for Ledger hardware wallet support
   * @param {bool} bool - the value representing if the users wants to use Ledger Live
   */
  async setLedgerTransportPreference(transportType) {
    const currentValue = this.preferencesController.getLedgerTransportPreference();
    const newValue = this.preferencesController.setLedgerTransportPreference(
      transportType,
    );

    const keyring = await this.getKeyringForDevice('ledger');
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
   * Sets whether or not the user will have usage data tracked with MetaMetrics
   * @param {boolean} bool - True for users that wish to opt-in, false for users that wish to remain out.
   * @param {Function} cb - A callback function called when complete.
   */
  setParticipateInMetaMetrics(bool, cb) {
    try {
      const metaMetricsId = this.metaMetricsController.setParticipateInMetaMetrics(
        bool,
      );
      cb(null, metaMetricsId);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * A method for setting a user's current locale, affecting the language rendered.
   * @param {string} key - Locale identifier.
   * @param {Function} cb - A callback function called when complete.
   */
  setCurrentLocale(key, cb) {
    try {
      const direction = this.preferencesController.setCurrentLocale(key);
      cb(null, direction);
      return;
    } catch (err) {
      cb(err);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  /**
   * A method for initializing storage the first time.
   * @param {Object} initState - The default state to initialize with.
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
   */
  onEnvironmentTypeClosed(environmentType) {
    const appStatePollingTokenType =
      POLLING_TOKEN_ENVIRONMENT_TYPES[environmentType];
    const pollingTokensToDisconnect = this.appStateController.store.getState()[
      appStatePollingTokenType
    ];
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
   * @param {string} hostname - the domain to safelist
   */
  safelistPhishingDomain(hostname) {
    return this.phishingController.bypass(hostname);
  }

  /**
   * Locks MetaMask
   */
  setLocked() {
    return this.keyringController.setLocked();
  }
<<<<<<< HEAD
=======

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

  _notifyChainChange() {
    this.notifyAllConnections({
      method: NOTIFICATION_NAMES.chainChanged,
      params: this.getProviderNetworkState(),
    });
  }
>>>>>>> upstream/multichain-swaps-controller
}

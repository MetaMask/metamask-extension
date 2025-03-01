import { EthAccountType } from '@metamask/keyring-api';
import {
  TransactionStatus,
  TransactionMeta,
  UserFeeLevel,
  TransactionType,
} from '@metamask/transaction-controller';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json, type SemVerVersion } from '@metamask/utils';
import {
  Cryptocurrency,
  MarketDataDetails,
  Nft,
  NftContract,
  TokenListToken,
} from '@metamask/assets-controllers';
import { NameOrigin } from '@metamask/name-controller';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
  SignatureRequest,
} from '@metamask/signature-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { Snap, SnapStatus } from '@metamask/snaps-utils';
import { SubjectType } from '@metamask/permission-controller';
import {
  UserOperationMetadata,
  UserOperationStatus,
} from '@metamask/user-operation-controller';
import { BackgroundStateProxy } from '../../shared/types/metamask';
import { AccountAddress } from '../../app/scripts/controllers/account-order';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { AlertTypes } from '../../shared/constants/alerts';
import { DEFAULT_BRIDGE_STATE } from '../../app/scripts/controllers/bridge/constants';
import { DEFAULT_BRIDGE_STATUS_STATE } from '../../app/scripts/controllers/bridge-status/constants';
import { AccountOverviewTabKey } from '../../shared/constants/app-state';
import {
  GasEstimateTypes,
  GasRecommendations,
} from '../../shared/constants/gas';
import {
  DeleteRegulationStatus,
  MetaMetricsEventFragment,
  MetaMetricsUserTrait,
} from '../../shared/constants/metametrics';
import { LedgerTransportTypes } from '../../shared/constants/hardware-wallets';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { LOG_METHOD_TYPES } from '../../app/scripts/controllers/permissions/enums';
import { ThemeType } from '../../shared/constants/preferences';
import { Quote } from '../../app/scripts/controllers/swaps/swaps.types';
import { CHAIN_IDS } from '../../shared/constants/network';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../shared/constants/swaps';

const ACCOUNT_ONE_ADDRESS: AccountAddress =
  '0x22517aca7e7899d5df9220eee48eb9b8dbea9887';
const ACCOUNT_TWO_ADDRESS: AccountAddress =
  '0xc1f48ad5bd8481aba84eac11df2d2bf29f09da72';
const ACCOUNT_THREE_ADDRESS: AccountAddress =
  '0x9dc33e6aeeea580d78d15691c1484aaf9d70eddd';
const ACCOUNT_ONE_NAME: string = 'Account 1';
const ACCOUNT_TWO_NAME: string = 'Account 2';
const ACCOUNT_THREE_NAME: string = 'Account 3';
const ACCOUNT_THREE_ID: string = '56830faa-776a-45d3-be9d-acd8b3b72812';
const ACCOUNT_ONE_ID: string = 'b7d38d3d-f195-4b68-a7a8-9152c9e458b3';
const ACCOUNT_TWO_ID: string = 'd87d01dd-aed9-497e-b673-aa6cb3a8e25e';

const ACCOUNT_ONE_BALANCE: string = '0x68155a43676deb7e0';
const ZERO_BALANCE: string = '0x0';
const ACCOUNT_TWO_BALANCE: string = '0x4563918244f400000';
const ETH_MAINNET = '0x1' as const;
const ETH_MAINNET_NAME: string = 'Ethereum Mainnet';
const SEPOLIA_NET = '0xaa36a7' as const;
const SEPOLIA_NET_NAME: string = 'Sepolia';
const SEPOLIA_TESTNET = '0xaa3861' as const;
const SEPOLIA_TESTNET_NAME: string = 'Sepolia Test';
const SEPOLIA_TESTNET_NETWORK_CLIENT_ID: string =
  '769efe6b-d702-4472-9cae-a5a22557a529';
const LINEA_SEPOLIA_NET = '0xe705' as const;
const LINEA_SEPOLIA_NET_NAME: string = 'Linea Sepolia';
const LINEA_MAINNET = '0xe708' as const;
const LINEA_MAINNET_NAME: string = 'Linea';
const UNISWAP_ORIGIN = 'https://app.uniswap.org';
const MOCK_APPROVAL_ID = '1234567890';

type ApprovalRequestData = Record<string, Json>;
const MOCK_PENDING_APPROVAL: ApprovalRequest<ApprovalRequestData> = {
  id: MOCK_APPROVAL_ID,
  origin: 'https://test-dapp.metamask.io',
  time: Date.now(),
  type: 'test-approval',
  requestData: {
    header: [
      {
        key: 'headerText',
        name: 'Typography',
        children: 'Success mock',
        properties: {
          variant: 'h2',
          class: 'header-mock-class',
        },
      },
    ],
    message: 'Success message',
  },
  requestState: {},
  expectsResult: false,
};

export const GAS_FEE_CONTROLLER_ESTIMATES_MOCK = {
  low: '0x1',
  medium: '0x2',
  high: '0x3',
  gasPrice: '0x2',
};

const MOCK_CURRENCY_RATE = {
  conversionDate: 1738715823.942,
  conversionRate: 2718.93,
  usdConversionRate: 2718.93,
};

const SAMPLE_METAMETRICS_EVENT_FRAGMENT: MetaMetricsEventFragment = {
  id: 'sample-metametrics-event-fragment-id',
  persist: true,
  category: 'Unit Test',
  successEvent: 'sample persisted event success',
  failureEvent: 'sample persisted event failure',
  properties: {
    test: true,
  },
};

const buildNftContractMock = (index: number): NftContract => {
  return {
    address: `0x${index}`,
    name: `Contract ${index}`,
    logo: `test${index}.jpg`,
  };
};

const buildNftMock = (index: number): Nft => {
  return {
    address: `0x${index}`,
    tokenId: `tokenId${index}`,
    name: `NFT ${index}`,
    image: `test${index}.jpg`,
    description: `Description ${index}`,
    standard: `ERC1155`,
  };
};

const getRandomPastDate = () => {
  const now = new Date();
  // Random date within the last 90 days
  const randomDaysAgo = Math.floor(Math.random() * 90);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);

  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - randomDaysAgo);
  pastDate.setHours(randomHours);
  pastDate.setMinutes(randomMinutes);

  return pastDate.toISOString();
};

const buildRandomNotification = (
  index: number,
): NotificationServicesController.INotification => {
  return {
    id: `notification-${index}`,
    type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
    createdAt: getRandomPastDate(),
    isRead: false,
    data: {
      title: `Mock Notification ${index}`,
      longDescription: `<p>This is a mock notification description ${index}. It contains sample text to demonstrate how notifications appear in the system.</p>`,
      image: {
        url: `https://example.com/image-${index}.png`,
        title: `Feature Announcement ${index}`,
      },
    },
  };
};

const SIGNATURE_REQUEST_MOCK: SignatureRequest = {
  chainId: SEPOLIA_TESTNET,
  id: '123-456',
  messageParams: {
    data: '0xABC123',
    from: ACCOUNT_THREE_ADDRESS,
    origin: UNISWAP_ORIGIN,
  },
  networkClientId: SEPOLIA_TESTNET_NETWORK_CLIENT_ID,
  status: SignatureRequestStatus.Signed,
  time: Date.now(),
  type: SignatureRequestType.PersonalSign,
};

const MOCK_TOKEN_DATA: TokenListToken = {
  address: '0x0000000000000000000000000000000000000000',
  name: 'Ether',
  decimals: 18,
  symbol: 'DAI',
  occurrences: 1,
  aggregators: [],
  iconUrl: 'images/dai-logo.png',
};

const NATIVE_TOKEN = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];

const MOCK_SNAP: Snap = {
  id: 'local:mock-snap' as SnapId,
  version: '1.3.7' as Snap['version'],
  status: SnapStatus.Installing,
  initialPermissions: {},
  sourceCode: 'sourceCode',
  enabled: true,
  blocked: false,
  manifest: {
    version: '1.3.7' as Snap['manifest']['version'],
    initialPermissions: {},
    manifestVersion: '0.1',
    description: 'mock-description',
    proposedName: 'mock-snap-name',
    source: {
      location: {
        npm: {
          registry: 'https://registry.npmjs.org',
          filePath: 'dist/bundle.js',
          packageName: 'local:mock-snap',
        },
      },
      shasum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
      locales: ['en'],
    },
  },
  versionHistory: [
    {
      date: 1680686075921,
      origin: 'https://metamask.github.io',
      version: '1.3.7',
    },
  ],
};

const MOCK_QUOTE: Quote = {
  sourceAmount: '1000000000000000000',
  destinationAmount: '42947749216634160067',
  error: null,
  sourceToken: '0x0000000000000000000000000000000000000000',
  sourceTokenRate: 1,
  destinationToken: '0x514910771af9ca656af840dff83e8264ecf986ca',
  approvalNeeded: null,
  maxGas: 770000,
  averageGas: 210546,
  estimatedRefund: '80000',
  fetchTime: 647,
  aggregator: 'uniswap',
  aggType: 'DEX',
  fee: 0.875,
  gasMultiplier: 1.5,
  priceSlippage: {
    ratio: 1.007876641534847,
    calculationError: '',
    bucket: GasRecommendations.low,
    sourceAmountInETH: 1,
    destinationAmountInETH: 0.9921849150875727,
    destinationAmountInNativeCurrency: 0.9921849150875727,
    sourceAmountInNativeCurrency: 1,
    sourceAmountInUSD: 1,
    destinationAmountInUSD: 0.99,
  },
  destinationTokenInfo: {
    address: ACCOUNT_TWO_ADDRESS,
    symbol: 'LINK',
    decimals: 18,
    iconUrl: 'icon.url ',
  },
  destinationTokenRate: 1,
  ethFee: '0.011791',
  ethValueOfTokens: '0.99220724791716534441',
  overallValueOfQuote: '0.98041624791716534441',
  metaMaskFeeInEth: '0.00875844985551091729',
  isBestQuote: true,
  savings: {
    performance: '0.00207907025112527799',
    fee: '0.005581',
    metaMaskFee: '0.00875844985551091729',
    total: '-0.0010983796043856393',
    medianMetaMaskFee: '0.00874009740688812165',
  },
  gasEstimate: '210546',
  gasEstimateWithRefund: '130546',
  hasRoute: true,
  quoteRefreshSeconds: 60,

  trade: {
    data: '0x',
    from: ACCOUNT_ONE_ADDRESS,
    to: ACCOUNT_TWO_ADDRESS,
    value: '0x0',
  },
};

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LINK_CONTRACT = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
const WBTC_CONTRACT = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const MOCK_MARKET_DATA: MarketDataDetails = {
  tokenAddress: USDC_CONTRACT,
  currency: 'ETH',
  price: 0.00062566,
  allTimeHigh: 0.0007,
  allTimeLow: 0.0005,
  circulatingSupply: 1000000,
  dilutedMarketCap: 1000000,
  high1d: 0.00065,
  low1d: 0.0006,
  marketCap: 1000000,
  marketCapPercentChange1d: -1.46534,
  priceChange1d: -43.27897193472654,
  pricePercentChange1h: 0.39406716228961414,
  pricePercentChange1d: -1.8035792813549656,
  pricePercentChange1y: -5.23,
  pricePercentChange7d: -2.45,
  pricePercentChange14d: -3.12,
  pricePercentChange30d: -4.89,
  pricePercentChange200d: -10.5,
  totalVolume: 1000000,
};

const MOCK_USER_OPERATION: UserOperationMetadata = {
  actualGasCost: '0x1234',
  actualGasUsed: '0x5678',
  baseFeePerGas: '0x3',
  bundlerUrl: 'https://bundler.example.com',
  chainId: SEPOLIA_TESTNET,
  error: null,
  hash: '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
  id: 'user-op-1',
  origin: UNISWAP_ORIGIN,
  status: UserOperationStatus.Confirmed,
  swapsMetadata: null,
  time: 1738710499635,
  transactionHash:
    '0xdef5678def5678def5678def5678def5678def5678def5678def5678def5678',
  transactionParams: {
    from: ACCOUNT_ONE_ADDRESS,
    to: ACCOUNT_TWO_ADDRESS,
    value: '0x0',
    data: '0x',
    gas: '0x5208',
    gasPrice: '0x4a817c800',
    accessList: [],
    chainId: SEPOLIA_TESTNET,
    estimateGasError: '',
    estimatedBaseFee: '0x1',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x4a817c800',
    type: '0x0',
    estimateSuggested: 'medium',
    estimateUsed: 'medium',
    gasLimit: '0x5208',
    gasUsed: '0x5208',
    nonce: '0x0',
  },
  transactionType: TransactionType.simpleSend,
  userFeeLevel: UserFeeLevel.MEDIUM,
  userOperation: {
    sender: ACCOUNT_ONE_ADDRESS,
    nonce: '0x0',
    initCode: '0x',
    callData: '0x',
    callGasLimit: '0x5208',
    verificationGasLimit: '0x5208',
    preVerificationGas: '0x5208',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x4a817c800',
    paymasterAndData: '0x',
    signature: '0x',
  },
};

const SUCCESSFUL_TRANSACTION_MOCK: TransactionMeta = {
  id: '123',
  chainId: SEPOLIA_TESTNET,
  time: 1234567890,
  networkClientId: SEPOLIA_TESTNET_NETWORK_CLIENT_ID,
  txParams: {
    from: ACCOUNT_ONE_ADDRESS,
    to: ACCOUNT_TWO_ADDRESS,
  },
  status: TransactionStatus.confirmed,
  blockNumber: '1234567890',
};

const FAILED_TRANSACTION_MOCK: TransactionMeta = {
  id: '456',
  chainId: SEPOLIA_TESTNET,
  time: 1234567890,
  networkClientId: SEPOLIA_TESTNET_NETWORK_CLIENT_ID,
  txParams: {
    from: ACCOUNT_ONE_ADDRESS,
    to: ACCOUNT_TWO_ADDRESS,
  },
  status: TransactionStatus.failed,
  error: {
    name: 'InsufficientFunds',
    message: 'Insufficient funds for gas * price + value',
  },
  blockNumber: '2234567890',
};

export const mockState: BackgroundStateProxy = {
  isInitialized: true,
  AccountOrderController: {
    pinnedAccountList: [ACCOUNT_ONE_ADDRESS],
    hiddenAccountList: [],
  },
  AccountTracker: {
    accounts: {
      [ACCOUNT_ONE_ADDRESS]: {
        address: ACCOUNT_ONE_ADDRESS,
        balance: ACCOUNT_ONE_BALANCE,
      },
      [ACCOUNT_THREE_ADDRESS]: {
        address: ACCOUNT_THREE_ADDRESS,
        balance: ZERO_BALANCE,
      },
      [ACCOUNT_TWO_ADDRESS]: {
        address: ACCOUNT_TWO_ADDRESS,
        balance: ACCOUNT_TWO_BALANCE,
      },
    },
    accountsByChainId: {
      [ETH_MAINNET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          address: ACCOUNT_ONE_ADDRESS,
          balance: ZERO_BALANCE,
        },
        [ACCOUNT_TWO_ADDRESS]: {
          address: ACCOUNT_TWO_ADDRESS,
          balance: ZERO_BALANCE,
        },
        [ACCOUNT_THREE_ADDRESS]: {
          address: ACCOUNT_THREE_ADDRESS,
          balance: ZERO_BALANCE,
        },
      },
      [SEPOLIA_NET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          address: ACCOUNT_ONE_ADDRESS,
          balance: ZERO_BALANCE,
        },
        [ACCOUNT_TWO_ADDRESS]: {},
        [ACCOUNT_THREE_ADDRESS]: {},
      },
      [SEPOLIA_TESTNET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          address: ACCOUNT_ONE_ADDRESS,
          balance: ACCOUNT_ONE_BALANCE,
        },
        [ACCOUNT_THREE_ADDRESS]: {
          address: ACCOUNT_THREE_ADDRESS,
          balance: ZERO_BALANCE,
        },
        [ACCOUNT_TWO_ADDRESS]: {
          address: ACCOUNT_TWO_ADDRESS,
          balance: ACCOUNT_TWO_BALANCE,
        },
      },
    },
    currentBlockGasLimit: '0x2243e7d',
    currentBlockGasLimitByChainId: {
      [SEPOLIA_NET]: '0x223b4e4',
      [SEPOLIA_TESTNET]: '0x2243e7d',
    },
  },
  AccountsController: {
    internalAccounts: {
      accounts: {
        [ACCOUNT_THREE_ADDRESS]: {
          address: ACCOUNT_THREE_ADDRESS,
          id: ACCOUNT_THREE_ID,
          metadata: {
            importTime: 1738710472865,
            keyring: {
              type: 'HD Key Tree',
            },
            lastSelected: 1738710472867,
            name: ACCOUNT_THREE_NAME,
            nameLastUpdatedAt: 1738710472984,
          },
          methods: ETH_EOA_METHODS,
          options: {},
          scopes: ['eip155:0'],
          type: EthAccountType.Eoa,
        },
        [ACCOUNT_ONE_ADDRESS]: {
          address: ACCOUNT_ONE_ADDRESS,
          id: ACCOUNT_ONE_ID,
          metadata: {
            importTime: 1738710364695,
            keyring: {
              type: 'HD Key Tree',
            },
            lastSelected: 1738710474786,
            name: 'Account 1',
          },
          methods: ETH_EOA_METHODS,
          options: {},
          scopes: ['eip155:0'],
          type: EthAccountType.Eoa,
        },
        [ACCOUNT_TWO_ADDRESS]: {
          address: ACCOUNT_TWO_ADDRESS,
          id: ACCOUNT_TWO_ID,
          metadata: {
            importTime: 1738710442401,
            keyring: {
              type: 'HD Key Tree',
            },
            lastSelected: 1738710442403,
            name: 'Account 2',
            nameLastUpdatedAt: 1738710442517,
          },
          methods: ETH_EOA_METHODS,
          options: {},
          scopes: ['eip155:0'],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: ACCOUNT_ONE_ADDRESS,
    },
  },
  AddressBookController: {
    addressBook: {
      [ETH_MAINNET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          address: ACCOUNT_ONE_ADDRESS,
          chainId: ETH_MAINNET,
          isEns: false,
          memo: '',
          name: ACCOUNT_ONE_NAME,
        },
        [ACCOUNT_THREE_ADDRESS]: {
          address: ACCOUNT_THREE_ADDRESS,
          chainId: ETH_MAINNET,
          isEns: false,
          memo: '',
          name: ACCOUNT_THREE_NAME,
        },
        [ACCOUNT_TWO_ADDRESS]: {
          address: ACCOUNT_TWO_ADDRESS,
          chainId: ETH_MAINNET,
          isEns: false,
          memo: '',
          name: ACCOUNT_TWO_NAME,
        },
      },
    },
  },
  AlertController: {
    alertEnabledness: {
      [AlertTypes.smartTransactionsMigration]: true,
      [AlertTypes.unconnectedAccount]: true,
      [AlertTypes.web3ShimUsage]: true,
    },
    unconnectedAccountAlertShownOrigins: {},
    web3ShimUsageOrigins: {},
  },
  AnnouncementController: {
    announcements: {
      '25': {
        date: '1738710352827',
        id: 25,
        isShown: false,
      },
    },
  },
  AppMetadataController: {
    currentAppVersion: '12.10.1',
    currentMigrationVersion: 143,
    previousAppVersion: '',
    previousMigrationVersion: 0,
  },
  AppStateController: {
    browserEnvironment: {
      browser: 'chrome',
      os: 'mac',
    },
    popupGasPollTokens: [],
    notificationGasPollTokens: [],
    fullScreenGasPollTokens: [],
    snapsInstallPrivacyWarningShown: false,
    qrHardware: {},
    nftsDropdownState: {},
    signatureSecurityAlertResponses: {},
    switchedNetworkDetails: {},
    currentExtensionPopupId: 1715943310719,
    connectedStatusPopoverHasBeenShown: true,
    defaultHomeActiveTabName: AccountOverviewTabKey.Activity,
    hadAdvancedGasFeesSetPriorToMigration92_3: false,
    lastInteractedConfirmationInfo: {
      chainId: SEPOLIA_TESTNET,
      id: 'cf43c740-e34c-11ef-b56e-355b2551d7f7',
      timestamp: 1738710451212,
    },
    lastViewedUserSurvey: null,
    newPrivacyPolicyToastClickedOrClosed: null,
    newPrivacyPolicyToastShownDate: 1738710352827,
    nftsDetectionNoticeDismissed: false,
    onboardingDate: 1738710353603,
    outdatedBrowserWarningLastShown: null,
    recoveryPhraseReminderHasBeenShown: false,
    recoveryPhraseReminderLastShown: 1738710346079,
    showAccountBanner: true,
    showBetaHeader: false,
    showNetworkBanner: true,
    showPermissionsTour: true,
    showTestnetMessageInDropdown: true,
    slides: [
      {
        id: '1',
        title: 'Slide 1',
        description: 'Description 1',
        image: 'image1.jpg',
      },
      {
        id: '2',
        title: 'Slide 2',
        description: 'Description 2',
        image: 'image2.jpg',
      },
    ],
    surveyLinkLastClickedOrClosed: null,
    switchedNetworkNeverShowMessage: false,
    termsOfUseLastAgreed: 1738710355542,
    timeoutMinutes: 0,
    trezorModel: null,
    isRampCardClosed: false,
    throttledOrigins: {},
  },
  ApprovalController: {
    pendingApprovals: {
      [MOCK_APPROVAL_ID]: MOCK_PENDING_APPROVAL,
    },
    pendingApprovalCount: 1,
    approvalFlows: [{ id: MOCK_APPROVAL_ID, loadingText: null }],
  },
  AuthenticationController: {
    isSignedIn: true,
    sessionData: {
      accessToken: 'accessToken',
      expiresIn: 'expiresIn',
      profile: {
        identifierId: 'identifierId',
        profileId: 'profileId',
      },
    },
  },
  BridgeController: {
    bridgeState: DEFAULT_BRIDGE_STATE,
  },
  BridgeStatusController: {
    bridgeStatusState: DEFAULT_BRIDGE_STATUS_STATE,
  },
  CronjobController: {
    events: {},
    jobs: {},
  },
  CurrencyController: {
    currencyRates: {
      ETH: MOCK_CURRENCY_RATE,
      LineaETH: MOCK_CURRENCY_RATE,
      'Sepolia ETH': MOCK_CURRENCY_RATE,
      SepoliaETH: MOCK_CURRENCY_RATE,
    },
    currentCurrency: 'usd',
  },
  DecryptMessageController: {
    unapprovedDecryptMsgs: {},
    unapprovedDecryptMsgCount: 0,
  },
  EncryptionPublicKeyController: {
    unapprovedEncryptionPublicKeyMsgs: {},
    unapprovedEncryptionPublicKeyMsgCount: 0,
  },
  EnsController: {
    ensEntries: {},
    ensResolutionsByAddress: {},
  },
  GasFeeController: {
    estimatedGasFeeTimeBounds: {},
    gasEstimateType: GasEstimateTypes.ethGasPrice,
    gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
    gasFeeEstimatesByChainId: {
      [SEPOLIA_TESTNET]: {
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: GasEstimateTypes.ethGasPrice,
        gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
      },
    },
  },
  KeyringController: {
    vault: 'vault',
    isUnlocked: true,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [ACCOUNT_ONE_ADDRESS],
      },
    ],
  },
  LoggingController: {
    logs: {},
  },
  MetaMetricsController: {
    metaMetricsId:
      '0xd94e3a4dfae14deecbd15b842432e2e2501907ddef6674b5bb0279ed731f5e3c',
    dataCollectionForMarketing: true,
    eventsBeforeMetricsOptIn: [],
    fragments: {
      [SAMPLE_METAMETRICS_EVENT_FRAGMENT.id]: SAMPLE_METAMETRICS_EVENT_FRAGMENT,
    },
    latestNonAnonymousEventTimestamp: 1738715878446,
    marketingCampaignCookieId: null,
    participateInMetaMetrics: true,
    previousUserTraits: {
      [MetaMetricsUserTrait.AddressBookEntries]: 3,
      [MetaMetricsUserTrait.CurrentCurrency]: 'usd',
      [MetaMetricsUserTrait.HasMarketingConsent]: true,
      [MetaMetricsUserTrait.InstallDateExt]: '',
      [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
      [MetaMetricsUserTrait.LedgerConnectionType]: LedgerTransportTypes.webhid,
      [MetaMetricsUserTrait.NetworksAdded]: [
        ETH_MAINNET,
        SEPOLIA_NET,
        LINEA_SEPOLIA_NET,
        LINEA_MAINNET,
        SEPOLIA_TESTNET,
      ],
      [MetaMetricsUserTrait.NetworksWithoutTicker]: [],
      [MetaMetricsUserTrait.NftAutodetectionEnabled]: true,
      [MetaMetricsUserTrait.NumberOfAccounts]: 3,
      [MetaMetricsUserTrait.NumberOfNftCollections]: 0,
      [MetaMetricsUserTrait.NumberOfNfts]: 0,
      [MetaMetricsUserTrait.NumberOfTokens]: 0,
      [MetaMetricsUserTrait.OpenSeaApiEnabled]: true,
      [MetaMetricsUserTrait.PetnameAddressCount]: 3,
      [MetaMetricsUserTrait.SecurityProviders]: ['blockaid'],
      [MetaMetricsUserTrait.Theme]: 'os',
      [MetaMetricsUserTrait.PrivacyModeEnabled]: false,
      [MetaMetricsUserTrait.NetworkFilterPreference]: [ETH_MAINNET],
      [MetaMetricsUserTrait.ThreeBoxEnabled]: false,
      [MetaMetricsUserTrait.TokenDetectionEnabled]: true,
      [MetaMetricsUserTrait.TokenSortPreference]: '',
    },
    segmentApiCalls: {},
    traits: {},
  },
  MetaMetricsDataDeletionController: {
    metaMetricsDataDeletionId: '123',
    metaMetricsDataDeletionTimestamp: 1620710815497,
    metaMetricsDataDeletionStatus: DeleteRegulationStatus.Finished,
  },
  MultichainBalancesController: {
    balances: {},
  },
  MultichainRatesController: {
    cryptocurrencies: [Cryptocurrency.Btc, Cryptocurrency.Solana],
    fiatCurrency: 'usd',
    rates: {
      [Cryptocurrency.Btc]: {
        conversionDate: 0,
        conversionRate: 0,
      },
      [Cryptocurrency.Solana]: {
        conversionDate: 0,
        conversionRate: 0,
      },
    },
  },
  NameController: {
    nameSources: {},
    names: {
      ethereumAddress: {
        [ACCOUNT_ONE_ADDRESS]: {
          '*': {
            name: ACCOUNT_ONE_NAME,
            origin: NameOrigin.ACCOUNT_IDENTITY,
            proposedNames: {},
            sourceId: null,
          },
        },
        [ACCOUNT_THREE_ADDRESS]: {
          '*': {
            name: ACCOUNT_THREE_NAME,
            origin: NameOrigin.ACCOUNT_IDENTITY,
            proposedNames: {},
            sourceId: null,
          },
        },
        [ACCOUNT_TWO_ADDRESS]: {
          '*': {
            name: ACCOUNT_TWO_NAME,
            origin: NameOrigin.ACCOUNT_IDENTITY,
            proposedNames: {},
            sourceId: null,
          },
        },
      },
    },
  },
  NetworkController: {
    networkConfigurationsByChainId: {
      [ETH_MAINNET]: {
        blockExplorerUrls: ['https://etherscan.io'],
        chainId: ETH_MAINNET,
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: ETH_MAINNET_NAME,
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            type: RpcEndpointType.Infura,
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
      [SEPOLIA_NET]: {
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        chainId: SEPOLIA_NET,
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: SEPOLIA_NET_NAME,
        nativeCurrency: 'SepoliaETH',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            type: RpcEndpointType.Infura,
            url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
      [SEPOLIA_TESTNET]: {
        blockExplorerUrls: [],
        chainId: SEPOLIA_TESTNET,
        defaultRpcEndpointIndex: 0,
        lastUpdatedAt: 1738710411356,
        name: SEPOLIA_TESTNET_NAME,
        nativeCurrency: 'Sepolia ETH',
        rpcEndpoints: [
          {
            networkClientId: SEPOLIA_TESTNET_NETWORK_CLIENT_ID,
            type: RpcEndpointType.Custom,
            url: 'https://virtual.sepolia.rpc.tenderly.co/d46ee364-ca4d-4d84-8e99-106d830200e1',
          },
        ],
      },
      [LINEA_SEPOLIA_NET]: {
        blockExplorerUrls: ['https://sepolia.lineascan.build'],
        chainId: LINEA_SEPOLIA_NET,
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: LINEA_SEPOLIA_NET_NAME,
        nativeCurrency: 'LineaETH',
        rpcEndpoints: [
          {
            networkClientId: 'linea-sepolia',
            type: RpcEndpointType.Infura,
            url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
      [LINEA_MAINNET]: {
        blockExplorerUrls: ['https://lineascan.build'],
        chainId: LINEA_MAINNET,
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: LINEA_MAINNET_NAME,
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'linea-mainnet',
            type: RpcEndpointType.Infura,
            url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
    },
    networksMetadata: {
      [SEPOLIA_TESTNET_NETWORK_CLIENT_ID]: {
        EIPS: {
          '1559': true,
        },
        status: NetworkStatus.Available,
      },
      mainnet: {
        EIPS: {
          '1559': true,
        },
        status: NetworkStatus.Available,
      },
      sepolia: {
        EIPS: {
          '1559': true,
        },
        status: NetworkStatus.Available,
      },
    },
    selectedNetworkClientId: 'mainnet',
  },
  NetworkOrderController: {
    orderedNetworkList: [
      {
        networkId: ETH_MAINNET,
      },
      {
        networkId: LINEA_MAINNET,
      },
      {
        networkId: SEPOLIA_TESTNET,
      },
    ],
  },

  NftController: {
    allNftContracts: {
      [ACCOUNT_ONE_ADDRESS]: {
        [ETH_MAINNET]: [buildNftContractMock(1), buildNftContractMock(2)],
        [SEPOLIA_NET]: [buildNftContractMock(4)],
      },
      [ACCOUNT_TWO_ADDRESS]: {
        [ETH_MAINNET]: [buildNftContractMock(2), buildNftContractMock(3)],
        [SEPOLIA_NET]: [buildNftContractMock(5)],
      },
    },
    allNfts: {
      [ACCOUNT_ONE_ADDRESS]: {
        [ETH_MAINNET]: [buildNftMock(1), buildNftMock(2)],
        [SEPOLIA_NET]: [buildNftMock(4)],
      },
      [ACCOUNT_TWO_ADDRESS]: {
        [ETH_MAINNET]: [buildNftMock(2), buildNftMock(3)],
        [SEPOLIA_NET]: [buildNftMock(5)],
      },
    },
    ignoredNfts: [],
  },
  NotificationServicesController: {
    subscriptionAccountsSeen: [],
    isMetamaskNotificationsFeatureSeen: false,
    isNotificationServicesEnabled: false,
    isFeatureAnnouncementsEnabled: false,
    metamaskNotificationsList: [
      buildRandomNotification(1),
      buildRandomNotification(2),
      buildRandomNotification(3),
    ],
    metamaskNotificationsReadList: [],
    isUpdatingMetamaskNotifications: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: [],
    isCheckingAccountsPresence: false,
  },
  NotificationServicesPushController: {
    fcmToken: '',
  },
  OnboardingController: {
    completedOnboarding: true,
    firstTimeFlowType: FirstTimeFlowType.create,
    seedPhraseBackedUp: false,
  },
  PPOMController: {
    storageMetadata: [],
    versionInfo: [],
  },
  PermissionController: {
    subjects: {
      [UNISWAP_ORIGIN]: {
        origin: UNISWAP_ORIGIN,
        permissions: {
          'endowment:caip25': {
            caveats: [
              {
                type: 'authorizedScopes',
                value: {
                  isMultichainOrigin: false,
                  optionalScopes: {
                    'eip155:1': {
                      accounts: [`eip155:1:${ACCOUNT_ONE_ADDRESS}`],
                    },
                  },
                  'eip155:11155553': {
                    accounts: [`eip155:11155553:${ACCOUNT_ONE_ADDRESS}`],
                  },
                  'eip155:59144': {
                    accounts: [`eip155:59144:${ACCOUNT_ONE_ADDRESS}`],
                  },
                  'wallet:eip155': {
                    accounts: [`wallet:eip155:${ACCOUNT_ONE_ADDRESS}`],
                  },
                },
              },
            ],
            date: 1738710499631,
            id: 'kiNksjwpsTho1oPAwKqGW',
            invoker: UNISWAP_ORIGIN,
            parentCapability: 'endowment:caip25',
          },
        },
      },
    },
  },
  PermissionLogController: {
    permissionActivityLog: [
      {
        id: 738334570,
        method: 'eth_accounts',
        methodType: LOG_METHOD_TYPES.restricted,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710495475,
        responseTime: 1738710495476,
        success: true,
      },
      {
        id: 738334572,
        method: 'eth_accounts',
        methodType: LOG_METHOD_TYPES.restricted,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710495575,
        responseTime: 1738710495575,
        success: true,
      },
      {
        id: 738334573,
        method: 'eth_accounts',
        methodType: LOG_METHOD_TYPES.restricted,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710495629,
        responseTime: 1738710495629,
        success: true,
      },
      {
        id: 738334574,
        method: 'wallet_requestPermissions',
        methodType: LOG_METHOD_TYPES.internal,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710498204,
        responseTime: 1738710499633,
        success: true,
      },
      {
        id: 738334577,
        method: 'eth_accounts',
        methodType: LOG_METHOD_TYPES.restricted,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710499635,
        responseTime: 1738710499635,
        success: true,
      },
      {
        id: 738334578,
        method: 'eth_accounts',
        methodType: LOG_METHOD_TYPES.restricted,
        origin: UNISWAP_ORIGIN,
        requestTime: 1738710499738,
        responseTime: 1738710499738,
        success: true,
      },
    ],
    permissionHistory: {
      [UNISWAP_ORIGIN]: {
        eth_accounts: {
          accounts: {
            [ACCOUNT_ONE_ADDRESS]: 1738710499633,
          },
          lastApproved: 1738710499633,
        },
      },
    },
  },
  PreferencesController: {
    useBlockie: false,
    usePhishDetect: true,
    dismissSeedBackUpReminder: false,
    overrideContentSecurityPolicyHeader: true,
    useMultiAccountBalanceChecker: true,
    use4ByteResolution: true,
    useCurrencyRateCheck: true,
    bitcoinSupportEnabled: false,
    bitcoinTestnetSupportEnabled: false,
    addSnapAccountEnabled: false,
    advancedGasFee: {
      [SEPOLIA_TESTNET]: { maxBaseFee: '50', priorityFee: '2' },
    },
    incomingTransactionsPreferences: {
      // TODO: Change original type to Hex
      0x1: true,
      0x5: true,
      0xaa36a7: true,
      0xe705: true,
      0xe708: true,
    },
    knownMethodData: {},
    currentLocale: 'en',
    forgottenPassword: false,
    preferences: {
      featureNotificationsEnabled: false,
      hideZeroBalanceTokens: false,
      petnamesEnabled: true,
      privacyMode: false,
      shouldShowAggregatedBalancePopover: false,
      showConfirmationAdvancedDetails: false,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showMultiRpcModal: false,
      showNativeTokenAsMainBalance: false,
      showTestNetworks: false,
      smartTransactionsMigrationApplied: false,
      smartTransactionsOptInStatus: true,
      tokenNetworkFilter: {
        [ETH_MAINNET]: true,
      },
      tokenSortConfig: {
        key: 'tokenFiatAmount',
        order: 'dsc',
        sortCallback: 'stringNumeric',
      },
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    useAddressBarEnsResolution: true,
    ledgerTransportType: LedgerTransportTypes.webhid,
    snapRegistryList: {},
    theme: ThemeType.os,
    enableMV3TimestampSave: true,
    useExternalServices: true,
    featureFlags: { advancedInlineGas: true },
    identities: {
      [ACCOUNT_ONE_ADDRESS]: {
        address: ACCOUNT_ONE_ADDRESS,
        name: ACCOUNT_ONE_NAME,
      },
      [ACCOUNT_THREE_ADDRESS]: {
        address: ACCOUNT_THREE_ADDRESS,
        name: ACCOUNT_THREE_NAME,
      },
      [ACCOUNT_TWO_ADDRESS]: {
        address: ACCOUNT_TWO_ADDRESS,
        name: ACCOUNT_TWO_NAME,
      },
    },
    ipfsGateway: 'dweb.link',
    isIpfsGatewayEnabled: true,
    isMultiAccountBalancesEnabled: true,
    lostIdentities: {
      [ACCOUNT_ONE_ADDRESS]: {
        address: ACCOUNT_ONE_ADDRESS,
        name: ACCOUNT_ONE_NAME,
      },
      [ACCOUNT_THREE_ADDRESS]: {
        address: ACCOUNT_THREE_ADDRESS,
        name: ACCOUNT_THREE_NAME,
      },
      [ACCOUNT_TWO_ADDRESS]: {
        address: ACCOUNT_TWO_ADDRESS,
        name: ACCOUNT_TWO_NAME,
      },
    },
    openSeaEnabled: true,
    securityAlertsEnabled: true,
    selectedAddress: ACCOUNT_ONE_ADDRESS,
    showIncomingTransactions: {
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.MAINNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.GOERLI]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.BSC]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.BSC_TESTNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.OPTIMISM]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.OPTIMISM_SEPOLIA]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.POLYGON]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.POLYGON_TESTNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.AVALANCHE]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.AVALANCHE_TESTNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.FANTOM]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.FANTOM_TESTNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.SEPOLIA]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_GOERLI]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_SEPOLIA]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_MAINNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONBEAM]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONBEAM_TESTNET]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONRIVER]: true,
      [ETHERSCAN_SUPPORTED_CHAIN_IDS.GNOSIS]: true,
    },
    useNftDetection: true,
    useExternalNameSources: true,
    useSafeChainsListValidation: true,
    useTokenDetection: true,
    useTransactionSimulations: true,
    watchEthereumAccountEnabled: false,

    solanaSupportEnabled: true,
    snapsAddSnapAccountModalDismissed: false,
  },
  RemoteFeatureFlagController: {
    cacheTimestamp: 1738710353453,
    remoteFeatureFlags: {
      testBooleanFlag: true,
      testFlagForThreshold: {
        name: 'groupC',
        value: 'valueC',
      },
    },
  },
  SelectedNetworkController: {
    domains: {
      [UNISWAP_ORIGIN]: SEPOLIA_TESTNET_NETWORK_CLIENT_ID,
    },
  },
  SignatureController: {
    unapprovedPersonalMsgs: {},
    unapprovedTypedMessages: {},
    unapprovedPersonalMsgCount: 0,
    unapprovedTypedMessagesCount: 0,
    signatureRequests: {
      [SIGNATURE_REQUEST_MOCK.id]: SIGNATURE_REQUEST_MOCK,
    },
  },
  SmartTransactionsController: {
    smartTransactionsState: {
      smartTransactions: {
        [ETH_MAINNET]: [
          {
            uuid: 'test-uuid',
          },
        ],
      },
      userOptIn: true,
      userOptInV2: true,
      liveness: true,
      fees: {
        approvalTxFees: null,
        tradeTxFees: null,
      },
      feesByChainId: {},
      livenessByChainId: {},
    },
  },
  SnapController: {
    snaps: {
      [MOCK_SNAP.id]: MOCK_SNAP,
    },
    snapStates: {},
    unencryptedSnapStates: {},
  },
  SnapInsightsController: {
    insights: {
      [MOCK_SNAP.id]: {
        [MOCK_SNAP.id]: {
          loading: true,
          interfaceId: 'interface-id',
          snapId: MOCK_SNAP.id,
        },
      },
    },
  },
  SnapInterfaceController: {
    interfaces: {},
  },
  SnapsRegistry: {
    database: null,
    databaseUnavailable: false,
    lastUpdated: null,
  },
  SubjectMetadataController: {
    subjectMetadata: {
      [UNISWAP_ORIGIN]: {
        extensionId: null,
        iconUrl: 'https://app.uniswap.org/favicon.png',
        name: 'Uniswap Interface',
        origin: UNISWAP_ORIGIN,
        subjectType: SubjectType.Website,
      },
      [MOCK_SNAP.id]: {
        extensionId: null,
        name: 'Notifications Example Snap',
        iconUrl: null,
        origin: MOCK_SNAP.id,
        subjectType: SubjectType.Snap,
      },
    },
  },
  SwapsController: {
    swapsState: {
      quotes: {
        mockQuoteId: MOCK_QUOTE,
      },
      quotesPollingLimitEnabled: false,
      fetchParams: null,
      tokens: null,
      tradeTxId: null,
      approveTxId: null,
      quotesLastFetched: null,
      customMaxGas: '',
      customGasPrice: null,
      selectedAggId: null,
      customApproveTxData: '',
      errorKey: '',
      topAggId: null,
      routeState: '',
      swapsFeatureFlags: {},
      swapsUserFeeLevel: '',
      swapsQuoteRefreshTime: 60000,
      swapsQuotePrefetchingRefreshTime: 60000,
      swapsStxGetTransactionsRefreshTime: 60000,
      swapsStxBatchStatusRefreshTime: 60000,
      swapsStxStatusDeadline: 60000,
      customMaxFeePerGas: '',
      customMaxPriorityFeePerGas: '',
      swapsFeatureIsLive: true,
      saveFetchedQuotes: true,
      swapsStxMaxFeeMultiplier: 1.5,
    },
  },
  TokenBalancesController: {
    tokenBalances: {
      [ACCOUNT_ONE_ADDRESS]: {
        [CHAIN_IDS.MAINNET]: {},
      },
    },
  },
  TokenListController: {
    preventPollingOnNetworkRestart: false,
    tokenList: {
      [MOCK_TOKEN_DATA.address]: MOCK_TOKEN_DATA,
    },
    tokensChainsCache: {
      [CHAIN_IDS.MAINNET]: {
        timestamp: Date.now(),
        data: {
          [NATIVE_TOKEN.address]: NATIVE_TOKEN,
          ...STATIC_MAINNET_TOKEN_LIST,
        },
      },
    },
  },
  TokenRatesController: {
    marketData: {
      [CHAIN_IDS.MAINNET]: {
        [USDC_CONTRACT]: {
          ...MOCK_MARKET_DATA,
          tokenAddress: USDC_CONTRACT,
        },
        [LINK_CONTRACT]: {
          ...MOCK_MARKET_DATA,
          tokenAddress: LINK_CONTRACT,
        },
        [WBTC_CONTRACT]: {
          ...MOCK_MARKET_DATA,
          tokenAddress: WBTC_CONTRACT,
        },
      },
    },
  },
  TokensController: {
    allDetectedTokens: {
      [ETH_MAINNET]: {
        [USDC_CONTRACT]: [
          {
            address: USDC_CONTRACT,
            decimals: 6,
            symbol: 'USDC',
          },
        ],
      },
    },
    allIgnoredTokens: {},
    allTokens: {
      [CHAIN_IDS.MAINNET]: {
        [ACCOUNT_ONE_ADDRESS]: [
          {
            address: USDC_CONTRACT,
            aggregators: [],
            decimals: 6,
            symbol: 'USDC',
          },
          {
            address: LINK_CONTRACT,
            aggregators: [],
            decimals: 18,
            symbol: 'LINK',
          },
        ],
      },
    },
    detectedTokens: [
      {
        address: USDC_CONTRACT,
        aggregators: [],
        decimals: 6,
        symbol: 'USDC',
      },
      {
        address: LINK_CONTRACT,
        aggregators: [],
        decimals: 18,
        symbol: 'LINK',
      },
    ],
    ignoredTokens: [],
    tokens: [
      {
        address: USDC_CONTRACT,
        aggregators: [],
        decimals: 6,
        symbol: 'USDC',
      },
      {
        address: LINK_CONTRACT,
        aggregators: [],
        decimals: 18,
        symbol: 'LINK',
      },
    ],
  },
  UserOperationController: {
    userOperations: {
      'user-op-1': MOCK_USER_OPERATION,
    },
  },
  UserStorageController: {
    hasAccountSyncingSyncedAtLeastOnce: false,
    isAccountSyncingReadyToBeDispatched: true,
    isProfileSyncingEnabled: true,
    isProfileSyncingUpdateLoading: false,
    isAccountSyncingInProgress: false,
  },
  TxController: {
    transactions: [SUCCESSFUL_TRANSACTION_MOCK, FAILED_TRANSACTION_MOCK],
    methodData: {},
    lastFetchedBlockNumbers: {
      [`${SUCCESSFUL_TRANSACTION_MOCK.chainId}#${SUCCESSFUL_TRANSACTION_MOCK.txParams.to}`]:
        parseInt(SUCCESSFUL_TRANSACTION_MOCK.blockNumber as string, 10),
      [`${FAILED_TRANSACTION_MOCK.chainId}#${FAILED_TRANSACTION_MOCK.txParams.to}`]:
        parseInt(FAILED_TRANSACTION_MOCK.blockNumber as string, 10),
    },
    submitHistory: [],
  },
  QueuedRequestController: {
    queuedRequestCount: 0,
  },
};

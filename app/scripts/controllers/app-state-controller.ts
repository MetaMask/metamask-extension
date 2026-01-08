import { v4 as uuid } from 'uuid';
import log from 'loglevel';
import { ApprovalType } from '@metamask/controller-utils';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import {
  AcceptRequest,
  AddApprovalRequest,
} from '@metamask/approval-controller';
import {
  DeferredPromise,
  Hex,
  Json,
  createDeferredPromise,
} from '@metamask/utils';
import type { QrScanRequest, SerializedUR } from '@metamask/eth-qr-keyring';
import type { Messenger } from '@metamask/messenger';
import { Browser } from 'webextension-polyfill';
import {
  KeyringControllerGetStateAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { QuoteResponse } from '@metamask/bridge-controller';

import { MINUTE } from '../../../shared/constants/time';
import { AUTO_LOCK_TIMEOUT_ALARM } from '../../../shared/constants/alarms';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isBeta } from '../../../ui/helpers/utils/build-types';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
  ORIGIN_METAMASK,
  DOWNLOAD_MOBILE_APP_SLIDE_ID,
} from '../../../shared/constants/app';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { LastInteractedConfirmationInfo } from '../../../shared/types/confirm';
import { SecurityAlertResponse } from '../lib/ppom/types';
import {
  AccountOverviewTabKey,
  CarouselSlide,
  NetworkConnectionBanner,
} from '../../../shared/constants/app-state';
import type {
  ThrottledOrigins,
  ThrottledOrigin,
} from '../../../shared/types/origin-throttling';
import {
  ScanAddressResponse,
  CachedScanAddressResponse,
  GetAddressSecurityAlertResponse,
  AddAddressSecurityAlertResponse,
} from '../../../shared/lib/trust-signals';
import {
  DefaultSubscriptionPaymentOptions,
  ShieldSubscriptionMetricsPropsFromUI,
} from '../../../shared/types';
import type {
  Preferences,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';

export type DappSwapComparisonData = {
  quotes?: QuoteResponse[];
  latency?: number;
  commands?: string;
  error?: string;
  swapInfo?: {
    srcTokenAddress: Hex;
    destTokenAddress: Hex;
    srcTokenAmount: Hex;
    destTokenAmountMin: Hex;
  };
};

export type AppStateControllerState = {
  activeQrCodeScanRequest: QrScanRequest | null;
  addressSecurityAlertResponses: Record<string, CachedScanAddressResponse>;
  appActiveTab?: {
    id: number;
    title: string;
    origin: string;
    protocol: string;
    url: string;
    host: string;
    href: string;
    favIconUrl?: string;
  };
  browserEnvironment: Record<string, string>;
  connectedStatusPopoverHasBeenShown: boolean;
  // States used for displaying the changed network toast
  currentExtensionPopupId: number;
  currentPopupId?: number;
  defaultHomeActiveTabName: AccountOverviewTabKey | null;
  enableEnforcedSimulations: boolean;
  enableEnforcedSimulationsForTransactions: Record<string, boolean>;
  enforcedSimulationsSlippage: number;
  enforcedSimulationsSlippageForTransactions: Record<string, number>;
  fullScreenGasPollTokens: string[];
  // This key is only used for checking if the user had set advancedGasFee
  // prior to Migration 92.3 where we split out the setting to support
  // multiple networks.
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hadAdvancedGasFeesSetPriorToMigration92_3: boolean;
  canTrackWalletFundsObtained: boolean;
  isRampCardClosed: boolean;
  isUpdateAvailable: boolean;
  lastInteractedConfirmationInfo?: LastInteractedConfirmationInfo;
  lastUpdatedAt: number | null;
  lastUpdatedFromVersion: string | null;
  lastViewedUserSurvey: number | null;
  networkConnectionBanner: NetworkConnectionBanner;
  newPrivacyPolicyToastClickedOrClosed: boolean | null;
  newPrivacyPolicyToastShownDate: number | null;
  pna25Acknowledged: boolean;
  nftsDetectionNoticeDismissed: boolean;
  nftsDropdownState: Json;
  notificationGasPollTokens: string[];
  onboardingDate: number | null;
  outdatedBrowserWarningLastShown: number | null;
  popupGasPollTokens: string[];
  sidePanelGasPollTokens: string[];
  productTour?: string;
  recoveryPhraseReminderHasBeenShown: boolean;
  recoveryPhraseReminderLastShown: number;
  showAccountBanner: boolean;
  showBetaHeader: boolean;
  showDownloadMobileAppSlide: boolean;
  showNetworkBanner: boolean;
  showPermissionsTour: boolean;
  showTestnetMessageInDropdown: boolean;
  signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  slides: CarouselSlide[];
  snapsInstallPrivacyWarningShown?: boolean;
  surveyLinkLastClickedOrClosed: number | null;
  shieldEndingToastLastClickedOrClosed: number | null;
  shieldPausedToastLastClickedOrClosed: number | null;
  termsOfUseLastAgreed?: number;
  throttledOrigins: ThrottledOrigins;
  timeoutMinutes: number;
  trezorModel: string | null;
  updateModalLastDismissedAt: number | null;
  hasShownMultichainAccountsIntroModal: boolean;
  showShieldEntryModalOnce: boolean | null;
  pendingShieldCohort: string | null;
  pendingShieldCohortTxType: string | null;
  defaultSubscriptionPaymentOptions?: DefaultSubscriptionPaymentOptions;
  dappSwapComparisonData?: {
    [uniqueId: string]: DappSwapComparisonData;
  };

  /**
   * The properties for the Shield subscription metrics.
   * Since we can't access some of these properties in the background, we need to get them from the UI.
   */
  shieldSubscriptionMetricsProps?: ShieldSubscriptionMetricsPropsFromUI;

  /**
   * Whether the wallet reset is in progress.
   */
  isWalletResetInProgress: boolean;
};

const controllerName = 'AppStateController';

/**
 * Returns the state of the {@link AppStateController}.
 */
export type AppStateControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AppStateControllerState
>;

export type AppStateControllerGetUnlockPromiseAction = {
  type: 'AppStateController:getUnlockPromise';
  handler: (shouldShowUnlockRequest: boolean) => Promise<void>;
};

export type AppStateControllerRequestQrCodeScanAction = {
  type: 'AppStateController:requestQrCodeScan';
  handler: (request: QrScanRequest) => Promise<SerializedUR>;
};

export type AppStateControllerSetCanTrackWalletFundsObtainedAction = {
  type: 'AppStateController:setCanTrackWalletFundsObtained';
  handler: AppStateController['setCanTrackWalletFundsObtained'];
};

export type AppStateControllerSetPendingShieldCohortAction = {
  type: 'AppStateController:setPendingShieldCohort';
  handler: AppStateController['setPendingShieldCohort'];
};

/**
 * Actions exposed by the {@link AppStateController}.
 */
export type AppStateControllerActions =
  | AppStateControllerGetStateAction
  | AppStateControllerGetUnlockPromiseAction
  | AppStateControllerRequestQrCodeScanAction
  | AppStateControllerSetCanTrackWalletFundsObtainedAction
  | AppStateControllerSetPendingShieldCohortAction;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | AddApprovalRequest
  | AcceptRequest
  | KeyringControllerGetStateAction
  | PreferencesControllerGetStateAction;

/**
 * Event emitted when the state of the {@link AppStateController} changes.
 */
export type AppStateControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  AppStateControllerState
>;

export type AppStateControllerUnlockChangeEvent = {
  type: 'AppStateController:unlockChange';
  payload: [];
};

/**
 * Events emitted by {@link AppStateController}.
 */
export type AppStateControllerEvents =
  | AppStateControllerStateChangeEvent
  | AppStateControllerUnlockChangeEvent;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
  | KeyringControllerUnlockEvent
  | PreferencesControllerStateChangeEvent;

export type AppStateControllerMessenger = Messenger<
  typeof controllerName,
  AppStateControllerActions | AllowedActions,
  AppStateControllerEvents | AllowedEvents
>;

type PollingTokenType =
  | 'popupGasPollTokens'
  | 'notificationGasPollTokens'
  | 'fullScreenGasPollTokens'
  | 'sidePanelGasPollTokens';

type AppStateControllerInitState = Partial<
  Omit<
    AppStateControllerState,
    | 'nftsDropdownState'
    | 'signatureSecurityAlertResponses'
    | 'addressSecurityAlertResponses'
    | 'currentExtensionPopupId'
    | 'networkConnectionBanner'
  >
>;

export type AppStateControllerOptions = {
  state?: AppStateControllerInitState;
  onInactiveTimeout?: () => void;
  messenger: AppStateControllerMessenger;
  extension: Browser;
};

const getDefaultAppStateControllerState = (): AppStateControllerState => ({
  activeQrCodeScanRequest: null,
  appActiveTab: undefined,
  browserEnvironment: {},
  connectedStatusPopoverHasBeenShown: true,
  defaultHomeActiveTabName: null,
  enableEnforcedSimulations: true,
  enableEnforcedSimulationsForTransactions: {},
  enforcedSimulationsSlippage: 10,
  enforcedSimulationsSlippageForTransactions: {},
  fullScreenGasPollTokens: [],
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hadAdvancedGasFeesSetPriorToMigration92_3: false,
  canTrackWalletFundsObtained: true,
  isRampCardClosed: false,
  isUpdateAvailable: false,
  lastUpdatedAt: null,
  lastUpdatedFromVersion: null,
  lastViewedUserSurvey: null,
  newPrivacyPolicyToastClickedOrClosed: null,
  newPrivacyPolicyToastShownDate: null,
  pna25Acknowledged: false,
  nftsDetectionNoticeDismissed: false,
  notificationGasPollTokens: [],
  onboardingDate: null,
  outdatedBrowserWarningLastShown: null,
  popupGasPollTokens: [],
  sidePanelGasPollTokens: [],
  productTour: 'accountIcon',
  recoveryPhraseReminderHasBeenShown: false,
  recoveryPhraseReminderLastShown: new Date().getTime(),
  showAccountBanner: true,
  showBetaHeader: isBeta(),
  showDownloadMobileAppSlide: true,
  showNetworkBanner: true,
  showPermissionsTour: true,
  showTestnetMessageInDropdown: true,
  slides: [],
  surveyLinkLastClickedOrClosed: null,
  shieldEndingToastLastClickedOrClosed: null,
  shieldPausedToastLastClickedOrClosed: null,
  throttledOrigins: {},
  timeoutMinutes: DEFAULT_AUTO_LOCK_TIME_LIMIT,
  trezorModel: null,
  updateModalLastDismissedAt: null,
  hasShownMultichainAccountsIntroModal: false,
  showShieldEntryModalOnce: null,
  pendingShieldCohort: null,
  pendingShieldCohortTxType: null,
  isWalletResetInProgress: false,
  dappSwapComparisonData: {},
  ...getInitialStateOverrides(),
});

/**
 * Return initial state for properties that should overwrite persisted state.
 *
 * TODO: Stop persisting state that we want to override, so that we can remove this function.
 *
 * @returns Initial state for properties that should overwrite persisted state.
 */
function getInitialStateOverrides() {
  return {
    addressSecurityAlertResponses: {},
    currentExtensionPopupId: 0,
    nftsDropdownState: {},
    signatureSecurityAlertResponses: {},
    networkConnectionBanner: {
      status: 'unknown' as const,
    },
  };
}

const controllerMetadata: StateMetadata<AppStateControllerState> = {
  activeQrCodeScanRequest: {
    includeInStateLogs: false,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  addressSecurityAlertResponses: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  appActiveTab: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  browserEnvironment: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  connectedStatusPopoverHasBeenShown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  currentExtensionPopupId: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  currentPopupId: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  defaultHomeActiveTabName: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  enableEnforcedSimulations: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  enableEnforcedSimulationsForTransactions: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  enforcedSimulationsSlippage: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  enforcedSimulationsSlippageForTransactions: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  fullScreenGasPollTokens: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hadAdvancedGasFeesSetPriorToMigration92_3: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  canTrackWalletFundsObtained: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  isRampCardClosed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  isUpdateAvailable: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  lastInteractedConfirmationInfo: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  lastUpdatedAt: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  lastUpdatedFromVersion: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  lastViewedUserSurvey: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  networkConnectionBanner: {
    includeInStateLogs: false,
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  newPrivacyPolicyToastClickedOrClosed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  newPrivacyPolicyToastShownDate: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  pna25Acknowledged: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  nftsDetectionNoticeDismissed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  nftsDropdownState: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  notificationGasPollTokens: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  onboardingDate: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  outdatedBrowserWarningLastShown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  popupGasPollTokens: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  sidePanelGasPollTokens: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  productTour: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  recoveryPhraseReminderHasBeenShown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  recoveryPhraseReminderLastShown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showAccountBanner: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showBetaHeader: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showDownloadMobileAppSlide: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showNetworkBanner: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showPermissionsTour: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  showTestnetMessageInDropdown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  signatureSecurityAlertResponses: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  slides: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  snapsInstallPrivacyWarningShown: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  surveyLinkLastClickedOrClosed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  shieldEndingToastLastClickedOrClosed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  shieldPausedToastLastClickedOrClosed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  termsOfUseLastAgreed: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  throttledOrigins: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  timeoutMinutes: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  trezorModel: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  updateModalLastDismissedAt: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  hasShownMultichainAccountsIntroModal: {
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  showShieldEntryModalOnce: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  pendingShieldCohort: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  pendingShieldCohortTxType: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  isWalletResetInProgress: {
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  defaultSubscriptionPaymentOptions: {
    includeInStateLogs: false,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  shieldSubscriptionMetricsProps: {
    includeInStateLogs: false,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  dappSwapComparisonData: {
    includeInStateLogs: false,
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
};

export class AppStateController extends BaseController<
  typeof controllerName,
  AppStateControllerState,
  AppStateControllerMessenger
> {
  readonly #extension: AppStateControllerOptions['extension'];

  readonly #onInactiveTimeout: () => void;

  #timer: NodeJS.Timeout | null;

  readonly waitingForUnlock: { resolve: () => void }[];

  #approvalRequestId: string | null;

  #qrCodeScanPromise: DeferredPromise<SerializedUR> | null = null;

  constructor({
    state = {},
    messenger,
    onInactiveTimeout,
    extension,
  }: AppStateControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultAppStateControllerState(),
        ...state,
        ...getInitialStateOverrides(),
      },
      messenger,
    });

    this.#extension = extension;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    this.#onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.#timer = null;

    this.waitingForUnlock = [];

    messenger.subscribe(
      'KeyringController:unlock',
      this.#handleUnlock.bind(this),
    );

    messenger.subscribe(
      'PreferencesController:stateChange',
      ({ preferences }: { preferences: Partial<Preferences> }) => {
        const currentState = this.state;
        if (
          typeof preferences?.autoLockTimeLimit === 'number' &&
          currentState.timeoutMinutes !== preferences.autoLockTimeLimit
        ) {
          this.#setInactiveTimeout(preferences.autoLockTimeLimit);
        }
      },
    );

    const { preferences } = messenger.call('PreferencesController:getState');
    if (typeof preferences.autoLockTimeLimit === 'number') {
      this.#setInactiveTimeout(preferences.autoLockTimeLimit);
    }

    this.messenger.registerActionHandler(
      'AppStateController:getUnlockPromise',
      this.getUnlockPromise.bind(this),
    );

    this.messenger.registerActionHandler(
      'AppStateController:requestQrCodeScan',
      this.#requestQrCodeScan.bind(this),
    );

    this.messenger.registerActionHandler(
      'AppStateController:setCanTrackWalletFundsObtained',
      this.setCanTrackWalletFundsObtained.bind(this),
    );

    this.messenger.registerActionHandler(
      'AppStateController:setPendingShieldCohort',
      this.setPendingShieldCohort.bind(this),
    );

    this.#approvalRequestId = null;
  }

  /**
   * Get a Promise that resolves when the extension is unlocked.
   * This Promise will never reject.
   *
   * @param shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   * @returns A promise that resolves when the extension is
   * unlocked, or immediately if the extension is already unlocked.
   */
  getUnlockPromise(shouldShowUnlockRequest: boolean): Promise<void> {
    return new Promise((resolve) => {
      const { isUnlocked } = this.messenger.call('KeyringController:getState');

      if (isUnlocked) {
        resolve();
      } else {
        this.#waitForUnlock(resolve, shouldShowUnlockRequest);
      }
    });
  }

  /**
   * Adds a Promise's resolve function to the waitingForUnlock queue.
   * Also opens the extension popup if specified.
   *
   * @param resolve - A Promise's resolve function that will
   * be called when the extension is unlocked.
   * @param shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   */
  #waitForUnlock(resolve: () => void, shouldShowUnlockRequest: boolean): void {
    this.waitingForUnlock.push({ resolve });
    this.messenger.publish('AppStateController:unlockChange');
    if (shouldShowUnlockRequest) {
      this.#requestApproval();
    }
  }

  /**
   * Drains the waitingForUnlock queue, resolving all the related Promises.
   */
  #handleUnlock(): void {
    if (this.waitingForUnlock.length > 0) {
      while (this.waitingForUnlock.length > 0) {
        this.waitingForUnlock.shift()?.resolve();
      }
      this.messenger.publish('AppStateController:unlockChange');
    }

    this.#acceptApproval();
  }

  /**
   * Sets the default home tab
   *
   * @param defaultHomeActiveTabName - the tab name
   */
  setDefaultHomeActiveTabName(
    defaultHomeActiveTabName: AccountOverviewTabKey | null,
  ): void {
    this.update((state) => {
      state.defaultHomeActiveTabName = defaultHomeActiveTabName;
    });
  }

  /**
   * Record that the user has seen the connected status info popover
   */
  setConnectedStatusPopoverHasBeenShown(): void {
    this.update((state) => {
      state.connectedStatusPopoverHasBeenShown = true;
    });
  }

  /**
   * Record that the user has been shown the recovery phrase reminder.
   */
  setRecoveryPhraseReminderHasBeenShown(): void {
    this.update((state) => {
      state.recoveryPhraseReminderHasBeenShown = true;
    });
  }

  setSurveyLinkLastClickedOrClosed(time: number): void {
    this.update((state) => {
      state.surveyLinkLastClickedOrClosed = time;
    });
  }

  setOnboardingDate(): void {
    this.update((state) => {
      state.onboardingDate = Date.now();
    });
  }

  setLastViewedUserSurvey(id: number) {
    this.update((state) => {
      state.lastViewedUserSurvey = id;
    });
  }

  setRampCardClosed(): void {
    this.update((state) => {
      state.isRampCardClosed = true;
    });
  }

  setNewPrivacyPolicyToastClickedOrClosed(): void {
    this.update((state) => {
      state.newPrivacyPolicyToastClickedOrClosed = true;
    });
  }

  setNewPrivacyPolicyToastShownDate(time: number): void {
    this.update((state) => {
      state.newPrivacyPolicyToastShownDate = time;
    });
  }

  setPna25Acknowledged(acknowledged: boolean): void {
    this.update((state) => {
      state.pna25Acknowledged = acknowledged;
    });
  }

  setShieldPausedToastLastClickedOrClosed(time: number): void {
    this.update((state) => {
      state.shieldPausedToastLastClickedOrClosed = time;
    });
  }

  setShieldEndingToastLastClickedOrClosed(time: number): void {
    this.update((state) => {
      state.shieldEndingToastLastClickedOrClosed = time;
    });
  }

  /**
   * Replaces slides in state with new slides. If a slide with the same id
   * already exists, it will be merged with the new slide.
   *
   * @param slides - Array of new slides
   */
  updateSlides(slides: CarouselSlide[]): void {
    this.update((state) => {
      const currentSlides = state.slides || [];

      const newSlides = slides.map((slide) => {
        const existingSlide = currentSlides.find((s) => s.id === slide.id);
        if (existingSlide) {
          return {
            ...existingSlide,
            ...slide,
          };
        }
        return slide;
      });

      state.slides = [...newSlides];
    });
  }

  /**
   * Marks a slide as dismissed by ID
   *
   * @param id - ID of the slide to dismiss
   */
  removeSlide(id: string): void {
    this.update((state) => {
      const slides = state.slides || [];
      state.slides = slides.map((slide) => {
        if (slide.id === id) {
          return { ...slide, dismissed: true };
        }
        return slide;
      });

      if (id === DOWNLOAD_MOBILE_APP_SLIDE_ID) {
        state.showDownloadMobileAppSlide = false;
      }
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the recovery phrase reminder
   *
   * @param lastShown - timestamp when user was last shown the reminder.
   */
  setRecoveryPhraseReminderLastShown(lastShown: number): void {
    this.update((state) => {
      state.recoveryPhraseReminderLastShown = lastShown;
    });
  }

  /**
   * Record the timestamp of the last time the user has acceoted the terms of use
   *
   * @param lastAgreed - timestamp when user last accepted the terms of use
   */
  setTermsOfUseLastAgreed(lastAgreed: number): void {
    this.update((state) => {
      state.termsOfUseLastAgreed = lastAgreed;
    });
  }

  /**
   * Record if popover for snaps privacy warning has been shown
   * on the first install of a snap.
   *
   * @param shown - shown status
   */
  setSnapsInstallPrivacyWarningShownStatus(shown: boolean): void {
    this.update((state) => {
      state.snapsInstallPrivacyWarningShown = shown;
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the outdated browser warning
   *
   * @param lastShown - Timestamp (in milliseconds) of when the user was last shown the warning.
   */
  setOutdatedBrowserWarningLastShown(lastShown: number): void {
    this.update((state) => {
      state.outdatedBrowserWarningLastShown = lastShown;
    });
  }

  /**
   * Sets the last active time to the current time.
   */
  setLastActiveTime(): void {
    this.#resetTimer();
  }

  /**
   * Set whether or not there is an update available
   *
   * @param isUpdateAvailable - Whether or not there is an update available
   */
  setIsUpdateAvailable(isUpdateAvailable: boolean): void {
    this.update((state) => {
      state.isUpdateAvailable = isUpdateAvailable;
    });
  }

  /**
   * Record the timestamp of the last time the user has dismissed the update modal
   *
   * @param updateModalLastDismissedAt - timestamp of the last time the user has dismissed the update modal.
   */
  setUpdateModalLastDismissedAt(updateModalLastDismissedAt: number): void {
    this.update((state) => {
      state.updateModalLastDismissedAt = updateModalLastDismissedAt;
    });
  }

  /**
   * Record the timestamp of the last time the user has updated
   *
   * @param lastUpdatedAt - timestamp of the last time the user has updated
   */
  setLastUpdatedAt(lastUpdatedAt: number): void {
    this.update((state) => {
      state.lastUpdatedAt = lastUpdatedAt;
    });
  }

  /**
   * Record the previous version the user updated from
   *
   * @param fromVersion - the version the user updated from
   */
  setLastUpdatedFromVersion(fromVersion: string): void {
    this.update((state) => {
      state.lastUpdatedFromVersion = fromVersion;
    });
  }

  /**
   * Sets the inactive timeout for the app
   *
   * @param timeoutMinutes - The inactive timeout in minutes.
   */
  #setInactiveTimeout(timeoutMinutes: number): void {
    this.update((state) => {
      state.timeoutMinutes = timeoutMinutes;
    });

    this.#resetTimer();
  }

  /**
   * Resets the internal inactive timer
   *
   * If the {@code timeoutMinutes} state is falsy (i.e., zero) then a new
   * timer will not be created.
   *
   */
  #resetTimer(): void {
    const { timeoutMinutes } = this.state;

    if (this.#timer) {
      clearTimeout(this.#timer);
    } else if (isManifestV3) {
      this.#extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
    }

    if (!timeoutMinutes) {
      return;
    }

    // This is a temporary fix until we add a state migration.
    // Due to a bug in ui/pages/settings/advanced-tab/advanced-tab.component.js,
    // it was possible for timeoutMinutes to be saved as a string, as explained
    // in PR 25109. `alarms.create` will fail in that case. We are
    // converting this to a number here to prevent that failure. Once
    // we add a migration to update the malformed state to the right type,
    // we will remove this conversion.
    const timeoutToSet = Number(timeoutMinutes);

    if (isManifestV3) {
      this.#extension.alarms.create(AUTO_LOCK_TIMEOUT_ALARM, {
        delayInMinutes: timeoutToSet,
        periodInMinutes: timeoutToSet,
      });
      this.#extension.alarms.onAlarm.addListener(
        (alarmInfo: { name: string }) => {
          if (alarmInfo.name === AUTO_LOCK_TIMEOUT_ALARM) {
            this.#onInactiveTimeout();
            this.#extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
          }
        },
      );
    } else {
      this.#timer = setTimeout(
        () => this.#onInactiveTimeout(),
        timeoutToSet * MINUTE,
      );
    }
  }

  /**
   * Sets the current browser and OS environment
   *
   * @param os
   * @param browser
   */
  setBrowserEnvironment(os: string, browser: string): void {
    this.update((state) => {
      state.browserEnvironment = { os, browser };
    });
  }

  /**
   * Adds a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  addPollingToken(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ): void {
    if (
      pollingTokenType.toString() !==
        POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND] &&
      this.#isValidPollingTokenType(pollingTokenType)
    ) {
      this.#updatePollingTokens(pollingToken, pollingTokenType);
    }
  }

  /**
   * Updates the polling token in the state.
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  #updatePollingTokens(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ) {
    this.update((state) => {
      state[pollingTokenType].push(pollingToken);
    });
  }

  /**
   * removes a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  removePollingToken(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ): void {
    if (
      pollingTokenType.toString() !==
      POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND]
    ) {
      const currentTokens: string[] = this.state[pollingTokenType];
      if (this.#isValidPollingTokenType(pollingTokenType)) {
        this.update((state) => {
          state[pollingTokenType] = currentTokens.filter(
            (token: string) => token !== pollingToken,
          );
        });
      }
    }
  }

  /**
   * Validates whether the given polling token type is a valid one.
   *
   * @param pollingTokenType
   * @returns true if valid, false otherwise.
   */
  #isValidPollingTokenType(pollingTokenType: PollingTokenType): boolean {
    const validTokenTypes: PollingTokenType[] = [
      'popupGasPollTokens',
      'notificationGasPollTokens',
      'fullScreenGasPollTokens',
      'sidePanelGasPollTokens',
    ];

    return validTokenTypes.includes(pollingTokenType);
  }

  /**
   * clears all pollingTokens
   */
  clearPollingTokens(): void {
    this.update((state) => {
      state.popupGasPollTokens = [];
      state.notificationGasPollTokens = [];
      state.fullScreenGasPollTokens = [];
      state.sidePanelGasPollTokens = [];
    });
  }

  /**
   * Sets whether the testnet dismissal link should be shown in the network dropdown
   *
   * @param showTestnetMessageInDropdown
   */
  setShowTestnetMessageInDropdown(showTestnetMessageInDropdown: boolean): void {
    this.update((state) => {
      state.showTestnetMessageInDropdown = showTestnetMessageInDropdown;
    });
  }

  /**
   * Sets whether the beta notification heading on the home page
   *
   * @param showBetaHeader
   */
  setShowBetaHeader(showBetaHeader: boolean): void {
    this.update((state) => {
      state.showBetaHeader = showBetaHeader;
    });
  }

  /**
   * Sets whether the permissions tour should be shown to the user
   *
   * @param showPermissionsTour
   */
  setShowPermissionsTour(showPermissionsTour: boolean): void {
    this.update((state) => {
      state.showPermissionsTour = showPermissionsTour;
    });
  }

  /**
   * Sets whether the multichain intro modal has been shown to the user
   *
   * @param hasShown - Whether the modal has been shown
   */
  setHasShownMultichainAccountsIntroModal(hasShown: boolean): void {
    this.update((state) => {
      state.hasShownMultichainAccountsIntroModal = hasShown;
    });
  }

  /**
   * Sets the product tour to be shown to the user
   *
   * @param productTour - Tour name to show (e.g., 'accountIcon') or empty string to hide
   */
  setProductTour(productTour: string): void {
    this.update((state) => {
      state.productTour = productTour;
    });
  }

  /**
   * Sets whether the Network Banner should be shown
   *
   * @param showNetworkBanner
   */
  setShowNetworkBanner(showNetworkBanner: boolean): void {
    this.update((state) => {
      state.showNetworkBanner = showNetworkBanner;
    });
  }

  /**
   * Updates the network connection banner state
   *
   * @param networkConnectionBanner - The new banner state
   */
  updateNetworkConnectionBanner(
    networkConnectionBanner: AppStateControllerState['networkConnectionBanner'],
  ): void {
    this.update((state) => {
      state.networkConnectionBanner = networkConnectionBanner;
    });
  }

  /**
   * Sets whether the Account Banner should be shown
   *
   * @param showAccountBanner
   */
  setShowAccountBanner(showAccountBanner: boolean): void {
    this.update((state) => {
      state.showAccountBanner = showAccountBanner;
    });
  }

  /**
   * Sets a unique ID for the current extension popup
   *
   * @param currentExtensionPopupId
   */
  setCurrentExtensionPopupId(currentExtensionPopupId: number): void {
    this.update((state) => {
      state.currentExtensionPopupId = currentExtensionPopupId;
    });
  }

  /**
   * Sets a property indicating the model of the user's Trezor hardware wallet
   *
   * @param trezorModel - The Trezor model.
   */
  setTrezorModel(trezorModel: string | null): void {
    this.update((state) => {
      state.trezorModel = trezorModel;
    });
  }

  /**
   * A setter for the `nftsDropdownState` property
   *
   * @param nftsDropdownState
   */
  updateNftDropDownState(nftsDropdownState: Json): void {
    this.update((state) => {
      // @ts-expect-error this is caused by a bug in Immer, not being able to handle recursive types like Json
      state.nftsDropdownState = nftsDropdownState;
    });
  }

  getSignatureSecurityAlertResponse(
    securityAlertId: string,
  ): SecurityAlertResponse {
    return this.state.signatureSecurityAlertResponses[securityAlertId];
  }

  addSignatureSecurityAlertResponse(
    securityAlertResponse: SecurityAlertResponse,
  ): void {
    if (securityAlertResponse.securityAlertId) {
      this.update((state) => {
        state.signatureSecurityAlertResponses[
          String(securityAlertResponse.securityAlertId)
        ] = securityAlertResponse;
      });
    }
  }

  getAddressSecurityAlertResponse: GetAddressSecurityAlertResponse = (
    cacheKey: string,
  ): ScanAddressResponse | undefined => {
    const cached = this.state.addressSecurityAlertResponses[cacheKey];

    if (!cached) {
      return undefined;
    }

    // Check if the cached response has expired (15 minute TTL)
    const now = Date.now();
    const ADDRESS_SECURITY_ALERT_TTL = 15 * MINUTE;
    if (now - cached.timestamp > ADDRESS_SECURITY_ALERT_TTL) {
      // Remove expired entry
      this.update((state) => {
        delete state.addressSecurityAlertResponses[cacheKey];
      });
      return undefined;
    }

    // Return the response without the timestamp
    const { timestamp, ...response } = cached;
    return response;
  };

  addAddressSecurityAlertResponse: AddAddressSecurityAlertResponse = (
    cacheKey: string,
    addressSecurityAlertResponse: ScanAddressResponse,
  ): void => {
    this.update((state) => {
      state.addressSecurityAlertResponses[cacheKey] = {
        ...addressSecurityAlertResponse,
        timestamp: Date.now(),
      };
    });
  };

  /**
   * A setter for the currentPopupId which indicates the id of popup window that's currently active
   *
   * @param currentPopupId
   */
  setCurrentPopupId(currentPopupId: number): void {
    this.update((state) => {
      state.currentPopupId = currentPopupId;
    });
  }

  /**
   * The function returns information about the last confirmation user interacted with
   */
  getLastInteractedConfirmationInfo():
    | LastInteractedConfirmationInfo
    | undefined {
    return this.state.lastInteractedConfirmationInfo;
  }

  /**
   * Update the information about the last confirmation user interacted with
   *
   * @param lastInteractedConfirmationInfo
   */
  setLastInteractedConfirmationInfo(
    lastInteractedConfirmationInfo: LastInteractedConfirmationInfo | undefined,
  ): void {
    this.update((state) => {
      state.lastInteractedConfirmationInfo = lastInteractedConfirmationInfo;
    });
  }

  /**
   * A getter to retrieve currentPopupId saved in the appState
   */
  getCurrentPopupId(): number | undefined {
    return this.state.currentPopupId;
  }

  #requestApproval(): void {
    // If we already have a pending request this is a no-op
    if (this.#approvalRequestId) {
      return;
    }
    this.#approvalRequestId = uuid();

    this.messenger
      .call(
        'ApprovalController:addRequest',
        {
          id: this.#approvalRequestId,
          origin: ORIGIN_METAMASK,
          type: ApprovalType.Unlock,
        },
        true,
      )
      .catch(() => {
        // If the promise fails, we allow a new popup to be triggered
        this.#approvalRequestId = null;
      });
  }

  #acceptApproval(): void {
    if (!this.#approvalRequestId) {
      return;
    }
    try {
      this.messenger.call(
        'ApprovalController:acceptRequest',
        this.#approvalRequestId,
      );
    } catch (error) {
      log.error('Failed to unlock approval request', error);
    }

    this.#approvalRequestId = null;
  }

  getThrottledOriginState(origin: string): ThrottledOrigin {
    return this.state.throttledOrigins[origin];
  }

  updateThrottledOriginState(
    origin: string,
    throttledOriginState: ThrottledOrigin,
  ): void {
    this.update((state) => {
      state.throttledOrigins[origin] = throttledOriginState;
    });
  }

  /**
   * Completes a QR code scan by resolving the promise with the scanned data.
   *
   * @param scannedData - The data that was scanned from the QR code.
   * @throws If no QR code scan is in progress.
   */
  completeQrCodeScan(scannedData: SerializedUR): void {
    if (!this.#qrCodeScanPromise) {
      throw new Error('No QR code scan is in progress.');
    }

    this.update((state) => {
      state.activeQrCodeScanRequest = null;
    });

    this.#qrCodeScanPromise.resolve(scannedData);
    this.#qrCodeScanPromise = null;
  }

  /**
   * Cancels the current QR code scan, if one is in progress.
   * This will reject the promise with an error.
   *
   * @param error - The error to reject the promise with.
   * @throws If no QR code scan is in progress.
   */
  cancelQrCodeScan(error?: Error): void {
    if (!this.#qrCodeScanPromise) {
      throw new Error('No QR code scan is in progress.');
    }

    this.update((state) => {
      state.activeQrCodeScanRequest = null;
    });

    this.#qrCodeScanPromise.reject(error || new Error('Scan cancelled'));
    this.#qrCodeScanPromise = null;
  }

  /**
   * Requests a QR code scan and returns a promise that resolves with the scanned data.
   * If a scan is already in progress, it returns the existing promise.
   *
   * @param request - The QR code scan request.
   * @returns The scanned QR code data.
   */
  #requestQrCodeScan(request: QrScanRequest): Promise<SerializedUR> {
    if (this.#qrCodeScanPromise) {
      return this.#qrCodeScanPromise.promise;
    }

    const deferredPromise = createDeferredPromise<SerializedUR>();
    this.#qrCodeScanPromise = deferredPromise;

    this.update((state) => {
      state.activeQrCodeScanRequest = request;
    });

    return deferredPromise.promise;
  }

  setEnableEnforcedSimulations(enabled: boolean): void {
    this.update((state) => {
      state.enableEnforcedSimulations = enabled;
    });
  }

  setEnableEnforcedSimulationsForTransaction(
    transactionId: string,
    enabled: boolean,
  ): void {
    this.update((state) => {
      state.enableEnforcedSimulationsForTransactions[transactionId] = enabled;
    });
  }

  setEnforcedSimulationsSlippage(value: number): void {
    this.update((state) => {
      state.enforcedSimulationsSlippage = value;
    });
  }

  setEnforcedSimulationsSlippageForTransaction(
    transactionId: string,
    value: number,
  ): void {
    this.update((state) => {
      state.enforcedSimulationsSlippageForTransactions[transactionId] = value;
    });
  }

  /**
   * Sets the active tab information
   *
   * @param tabData - The active tab data
   */

  setAppActiveTab(tabData: {
    id: number;
    title: string;
    origin: string;
    protocol: string;
    url: string;
    host: string;
    href: string;
    favIconUrl?: string;
  }): void {
    this.update((state) => {
      state.appActiveTab = tabData;
    });
  }

  setShowShieldEntryModalOnce(showShieldEntryModalOnce: boolean | null): void {
    this.update((state) => {
      state.showShieldEntryModalOnce = showShieldEntryModalOnce;
    });
  }

  setPendingShieldCohort(cohort: string | null, txType?: string | null): void {
    this.update((state) => {
      state.pendingShieldCohort = cohort;
      if (txType !== undefined) {
        state.pendingShieldCohortTxType = txType;
      }
    });
  }

  setCanTrackWalletFundsObtained(enabled: boolean): void {
    this.update((state) => {
      state.canTrackWalletFundsObtained = enabled;
    });
  }

  setIsWalletResetInProgress(isResetting: boolean): void {
    this.update((state) => {
      state.isWalletResetInProgress = isResetting;
    });
  }

  getIsWalletResetInProgress(): boolean {
    return this.state.isWalletResetInProgress;
  }

  setDefaultSubscriptionPaymentOptions(
    defaultSubscriptionPaymentOptions: DefaultSubscriptionPaymentOptions,
  ): void {
    this.update((state) => {
      state.defaultSubscriptionPaymentOptions =
        defaultSubscriptionPaymentOptions;
    });
  }

  /**
   * Update the Shield subscription metrics properties which are not accessible in the background directly.
   *
   * @param shieldSubscriptionMetricsProps - The Shield subscription metrics properties.
   */
  setShieldSubscriptionMetricsProps(
    shieldSubscriptionMetricsProps: ShieldSubscriptionMetricsPropsFromUI,
  ): void {
    this.update((state) => {
      state.shieldSubscriptionMetricsProps = shieldSubscriptionMetricsProps;
    });
  }

  deleteDappSwapComparisonData(uniqueId: string): void {
    this.update((state) => {
      delete state.dappSwapComparisonData?.[uniqueId];
      state.dappSwapComparisonData = {
        ...state.dappSwapComparisonData,
      };
    });
  }

  setDappSwapComparisonData(
    uniqueId: string,
    info: DappSwapComparisonData,
  ): void {
    this.update((state) => {
      state.dappSwapComparisonData = {
        ...state.dappSwapComparisonData,
        [uniqueId]: {
          ...(state.dappSwapComparisonData?.[uniqueId] ?? {}),
          ...info,
        },
      };
    });
  }

  getDappSwapComparisonData(
    uniqueId: string,
  ): DappSwapComparisonData | undefined {
    return this.state.dappSwapComparisonData?.[uniqueId] ?? undefined;
  }
}

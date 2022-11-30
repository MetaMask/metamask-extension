import endOfStream from 'end-of-stream';
import pump from 'pump';
import debounce from 'debounce-stream';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { storeAsStream } from '@metamask/obs-store';
import PortStream from 'extension-port-stream';
import { ethErrors } from 'eth-rpc-errors';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_FIREFOX,
} from '../../shared/constants/app';
import { SECOND } from '../../shared/constants/time';
import {
  REJECT_NOTFICIATION_CLOSE,
  REJECT_NOTFICIATION_CLOSE_SIG,
} from '../../shared/constants/metametrics';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { maskObject } from '../../shared/modules/object.utils';
import { SENTRY_STATE } from './lib/setupSentry';

import createStreamSink from './lib/createStreamSink';
import { NOTIFICATION_MANAGER_EVENTS } from './lib/notification-manager';
import MetamaskController, {
  METAMASK_CONTROLLER_EVENTS,
} from './metamask-controller';
import setupEnsIpfsResolver from './lib/ens-ipfs/setup';
import { deferredPromise, getPlatform } from './lib/util';

const ACK_KEEP_ALIVE_MESSAGE = 'ACK_KEEP_ALIVE_MESSAGE';
const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE';

/**
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 */
export default class BackgroundController {
  popupIsOpen = false;

  notificationIsOpen = false;

  uiIsTriggering = false;

  requestAccountTabIds = {};

  openMetamaskTabsIDs = {};

  metamaskBlockedPorts = ['trezor-connect'];

  metamaskInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
  };

  phishingPageUrl = new URL(process.env.PHISHING_WARNING_PAGE_URL);

  constructor({ localStore, platform, notificationManager }) {
    this.localStore = localStore;
    this.platform = platform;
    this.notificationManager = notificationManager;

    this.hasInitialized = deferredPromise();

    this.getSentryState = this.getSentryState.bind(this);
    this.endStreamFullScreenCb = this.endStreamFullScreenCb.bind(this);
    this.endStreamNotificationCb = this.endStreamNotificationCb.bind(this);
    this.endStreamPopUpCb = this.endStreamPopUpCb.bind(this);
    this.connectRemote = this.connectRemote.bind(this);
    this.connectExternal = this.connectExternal.bind(this);
    this.remotePortOnMessageRequestAccountsCb =
      this.remotePortOnMessageRequestAccountsCb.bind(this);
    this.updateBadge = this.updateBadge.bind(this);
    this.notificationManagerOnPopUpCloseListener =
      this.notificationManagerOnPopUpCloseListener.bind(this);
    this.getUnapprovedTransactionCount =
      this.getUnapprovedTransactionCount.bind(this);
    this.rejectUnapprovedNotifications =
      this.rejectUnapprovedNotifications.bind(this);
    this.triggerUi = this.triggerUi.bind(this);
    this.openPopup = this.openPopup.bind(this);
    this.getRequestAccountTabIds = this.getRequestAccountTabIds.bind(this);
    this.getOpenMetamaskTabsIds = this.getOpenMetamaskTabsIds.bind(this);
    this.onConnectRemoteListener = this.onConnectRemoteListener.bind(this);
    this.onConnectExternalListener = this.onConnectExternalListener.bind(this);

    this.registerRuntimeListeners();
  }

  getRequestAccountTabIds() {
    return this.requestAccountTabIds;
  }

  getOpenMetamaskTabsIds() {
    return this.openMetamaskTabsIDs;
  }

  registerRuntimeListeners() {
    browser.runtime.onConnect.addListener(this.onConnectRemoteListener);
    browser.runtime.onConnectExternal.addListener(
      this.onConnectExternalListener,
    );
  }

  async onConnectRemoteListener(remotePort) {
    // Queue up connection attempts here, waiting until after initialization
    await this.hasInitialized;

    // This is set in `setupController`, which is called as part of initialization
    this.connectRemote(remotePort);
  }

  async onConnectExternalListener(remotePort) {
    // Queue up connection attempts here, waiting until after initialization
    await this.hasInitialized;

    // This is set in `setupController`, which is called as part of initialization
    this.connectExternal(remotePort);
  }

  init(initState, initLangCode) {
    this.initMetaMaskController(initState, initLangCode);
    this.initEnsIpfsResolver();
    this.persistStorage();
    this.setupSentryGetStateGlobal();
    this.initUserInterface();
  }

  initMetaMaskController(initState, initLangCode) {
    //
    // MetaMask Controller
    //
    this.controller = new MetamaskController({
      infuraProjectId: process.env.INFURA_PROJECT_ID,
      // User confirmation callbacks:
      showUserConfirmation: this.triggerUi,
      openPopup: this.openPopup,
      // initial state
      initState,
      // initial locale code
      initLangCode,
      // platform specific api
      platform: this.platform,
      notificationManager: this.notificationManager,
      browser,
      getRequestAccountTabIds: this.getRequestAccountTabIds,
      getOpenMetamaskTabsIds: this.getOpenMetamaskTabsIds,
      localStore: this.localStore,
    });
  }

  initEnsIpfsResolver() {
    setupEnsIpfsResolver({
      getCurrentChainId:
        this.controller.networkController.getCurrentChainId.bind(
          this.controller.networkController,
        ),
      getIpfsGateway: this.controller.preferencesController.getIpfsGateway.bind(
        this.controller.preferencesController,
      ),
      provider: this.controller.provider,
    });
  }

  persistStorage() {
    // setup state persistence
    pump(
      storeAsStream(this.controller.store),
      debounce(1000),
      createStreamSink((state) => this.localStore.set(state)),
      (error) => {
        log.error('MetaMask - Persistence pipeline failed', error);
      },
    );
  }

  setupSentryGetStateGlobal() {
    global.stateHooks.getSentryState = this.getSentryState;
  }

  getSentryState() {
    const fullState = this.controller.getState();
    const debugState = maskObject({ metamask: fullState }, SENTRY_STATE);
    return {
      browser: window.navigator.userAgent,
      store: debugState,
      version: this.platform.getVersion(),
    };
  }

  //
  // User Interface setup
  //
  initUserInterface() {
    this.updateBadge();
    this.controller.txController.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.messageManager.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.personalMessageManager.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.decryptMessageManager.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.encryptionPublicKeyManager.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.typedMessageManager.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );
    this.controller.appStateController.on(
      METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
      this.updateBadge,
    );

    this.controller.controllerMessenger.subscribe(
      METAMASK_CONTROLLER_EVENTS.APPROVAL_STATE_CHANGE,
      this.updateBadge,
    );
  }

  isClientOpenStatus() {
    return (
      this.popupIsOpen ||
      Boolean(Object.keys(this.openMetamaskTabsIDs).length) ||
      this.notificationIsOpen
    );
  }

  onCloseEnvironmentInstances(isClientOpen, environmentType) {
    // if all instances of metamask are closed we call a method on the controller to stop gasFeeController polling
    if (isClientOpen === false) {
      this.controller.onClientClosed();
      // otherwise we want to only remove the polling tokens for the environment type that has closed
    } else {
      // in the case of fullscreen environment a user might have multiple tabs open so we don't want to disconnect all of
      // its corresponding polling tokens unless all tabs are closed.
      if (
        environmentType === ENVIRONMENT_TYPE_FULLSCREEN &&
        Boolean(Object.keys(this.openMetamaskTabsIDs).length)
      ) {
        return;
      }
      this.controller.onEnvironmentTypeClosed(environmentType);
    }
  }

  /**
   * A runtime.Port object, as provided by the browser:
   *
   * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */

  /**
   * Connects a Port to the MetaMask controller via a multiplexed duplex stream.
   * This method identifies trusted (MetaMask) interfaces, and connects them differently from untrusted (web pages).
   *
   * @param {Port} remotePort - The port provided by a new context.
   */
  connectRemote(remotePort) {
    const processName = remotePort.name;

    if (this.metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    let isMetaMaskInternalProcess = false;
    const sourcePlatform = getPlatform();

    if (sourcePlatform === PLATFORM_FIREFOX) {
      isMetaMaskInternalProcess = this.metamaskInternalProcessHash[processName];
    } else {
      isMetaMaskInternalProcess =
        remotePort.sender.origin === `chrome-extension://${browser.runtime.id}`;
    }

    const senderUrl = remotePort.sender?.url
      ? new URL(remotePort.sender.url)
      : null;

    if (isMetaMaskInternalProcess) {
      const portStream = new PortStream(remotePort);
      // communication with popup
      this.controller.isClientOpen = true;
      this.controller.setupTrustedCommunication(portStream, remotePort.sender);

      if (isManifestV3) {
        // If we get a WORKER_KEEP_ALIVE message, we respond with an ACK
        remotePort.onMessage.addListener((message) => {
          if (message.name === WORKER_KEEP_ALIVE_MESSAGE) {
            // To test un-comment this line and wait for 1 minute. An error should be shown on MetaMask UI.
            remotePort.postMessage({ name: ACK_KEEP_ALIVE_MESSAGE });
          }
        });
      }

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        this.popupIsOpen = true;
        endOfStream(portStream, this.endStreamPopUpCb);
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        this.notificationIsOpen = true;

        endOfStream(portStream, this.endStreamNotificationCb);
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        this.openMetamaskTabsIDs[tabId] = true;

        endOfStream(portStream, () => {
          this.endStreamFullScreenCb(tabId);
        });
      }
    } else if (
      senderUrl &&
      senderUrl.origin === this.phishingPageUrl.origin &&
      senderUrl.pathname === this.phishingPageUrl.pathname
    ) {
      const portStream = new PortStream(remotePort);
      this.controller.setupPhishingCommunication({
        connectionStream: portStream,
      });
    } else {
      if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
        const tabId = remotePort.sender.tab.id;
        const url = new URL(remotePort.sender.url);
        const { origin } = url;

        remotePort.onMessage.addListener((msg) => {
          this.remotePortOnMessageRequestAccountsCb(msg, origin, tabId);
        });
      }
      this.connectExternal(remotePort);
    }
  }

  remotePortOnMessageRequestAccountsCb(msg, origin, tabId) {
    if (msg.data && msg.data.method === 'eth_requestAccounts') {
      this.requestAccountTabIds[origin] = tabId;
    }
  }

  endStreamPopUpCb() {
    this.popupIsOpen = false;
    const isClientOpen = this.isClientOpenStatus();
    this.controller.isClientOpen = isClientOpen;
    this.onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
  }

  endStreamNotificationCb() {
    this.notificationIsOpen = false;
    const isClientOpen = this.isClientOpenStatus();
    this.controller.isClientOpen = isClientOpen;
    this.onCloseEnvironmentInstances(
      isClientOpen,
      ENVIRONMENT_TYPE_NOTIFICATION,
    );
  }

  endStreamFullScreenCb(tabId) {
    delete this.openMetamaskTabsIDs[tabId];
    const isClientOpen = this.isClientOpenStatus();
    this.controller.isClientOpen = isClientOpen;
    this.onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_FULLSCREEN);
  }

  // communication with page or other extension
  connectExternal(remotePort) {
    const portStream = new PortStream(remotePort);
    this.controller.setupUntrustedCommunication({
      connectionStream: portStream,
      sender: remotePort.sender,
    });
  }

  /**
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * The number reflects the current number of pending transactions or message signatures needing user approval.
   */
  updateBadge() {
    let label = '';
    const count = this.getUnapprovedTransactionCount();
    if (count) {
      label = String(count);
    }
    // browserAction has been replaced by action in MV3
    if (isManifestV3) {
      browser.action.setBadgeText({ text: label });
      browser.action.setBadgeBackgroundColor({ color: '#037DD6' });
    } else {
      browser.browserAction.setBadgeText({ text: label });
      browser.browserAction.setBadgeBackgroundColor({ color: '#037DD6' });
    }
  }

  getUnapprovedTransactionCount() {
    const unapprovedTxCount =
      this.controller.txController.getUnapprovedTxCount();
    const { unapprovedMsgCount } = this.controller.messageManager;
    const { unapprovedPersonalMsgCount } =
      this.controller.personalMessageManager;
    const { unapprovedDecryptMsgCount } = this.controller.decryptMessageManager;
    const { unapprovedEncryptionPublicKeyMsgCount } =
      this.controller.encryptionPublicKeyManager;
    const { unapprovedTypedMessagesCount } =
      this.controller.typedMessageManager;
    const pendingApprovalCount =
      this.controller.approvalController.getTotalApprovalCount();
    const waitingForUnlockCount =
      this.controller.appStateController.waitingForUnlock.length;
    return (
      unapprovedTxCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount +
      unapprovedTypedMessagesCount +
      pendingApprovalCount +
      waitingForUnlockCount
    );
  }

  registerNotificationManagerListeners() {
    this.notificationManager.on(
      NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
      this.notificationManagerOnPopUpCloseListener,
    );
  }

  notificationManagerOnPopUpCloseListener({ automaticallyClosed }) {
    if (!automaticallyClosed) {
      this.rejectUnapprovedNotifications();
    } else if (this.getUnapprovedTransactionCount() > 0) {
      this.triggerUi();
    }
  }

  rejectUnapprovedNotifications() {
    Object.keys(
      this.controller.txController.txStateManager.getUnapprovedTxList(),
    ).forEach((txId) =>
      this.controller.txController.txStateManager.setTxStatusRejected(txId),
    );
    this.controller.messageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        this.controller.messageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    this.controller.personalMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        this.controller.personalMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    this.controller.typedMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        this.controller.typedMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    this.controller.decryptMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        this.controller.decryptMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE,
        ),
      );
    this.controller.encryptionPublicKeyManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        this.controller.encryptionPublicKeyManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE,
        ),
      );

    // Finally, reject all approvals managed by the ApprovalController
    this.controller.approvalController.clear(
      ethErrors.provider.userRejectedRequest(),
    );

    this.updateBadge();
  }

  /**
   * Opens the browser popup for user confirmation
   */
  async triggerUi() {
    const tabs = await this.platform.getActiveTabs();
    const currentlyActiveMetamaskTab = Boolean(
      tabs.find((tab) => this.openMetamaskTabsIDs[tab.id]),
    );
    // Vivaldi is not closing port connection on popup close, so popupIsOpen does not work correctly
    // To be reviewed in the future if this behaviour is fixed - also the way we determine isVivaldi variable might change at some point
    const isVivaldi =
      tabs.length > 0 &&
      tabs[0].extData &&
      tabs[0].extData.indexOf('vivaldi_tab') > -1;
    if (
      !this.uiIsTriggering &&
      (isVivaldi || !this.popupIsOpen) &&
      !currentlyActiveMetamaskTab
    ) {
      this.uiIsTriggering = true;
      try {
        await this.notificationManager.showPopup();
      } finally {
        this.uiIsTriggering = false;
      }
    }
  }

  /**
   * Opens the browser popup for user confirmation of watchAsset
   * then it waits until user interact with the UI
   */
  async openPopup() {
    await this.triggerUi();
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.notificationIsOpen) {
          clearInterval(interval);
          resolve();
        }
      }, SECOND);
    });
  }
}

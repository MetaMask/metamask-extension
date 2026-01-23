import { isEqual } from 'lodash';
import { GetPreferencesResult } from '@metamask/snaps-sdk';
import { Driver } from '../../webdriver/driver';
import { veryLargeDelayMs } from '../../helpers';
import { DAPP_URL } from '../../constants';

/**
 * Page object for the Test Snaps dapp page.
 * Each button and input has a specific method - specs should not need to know selectors.
 */
export class TestSnaps {
  private readonly driver: Driver;

  // Page elements
  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  // Connect button selectors
  private readonly connectBip32ButtonSelector = '#connectbip32';

  private readonly connectBip44ButtonSelector = '#connectbip44';

  private readonly connectClientStatusButtonSelector = '#connectclient-status';

  private readonly connectCronJobsButtonSelector = '#connectcronjobs';

  private readonly connectCronjobDurationButtonSelector =
    '#connectcronjob-duration';

  private readonly connectDialogsButtonSelector = '#connectdialogs';

  private readonly connectErrorsButtonSelector = '#connecterrors';

  private readonly connectGetEntropyButtonSelector = '#connectGetEntropySnap';

  private readonly connectGetFileButtonSelector = '#connectgetfile';

  private readonly connectHomePageButtonSelector = '#connecthomepage';

  private readonly connectJsxButtonSelector = '#connectjsx';

  private readonly connectJsonRpcButtonSelector = '#connectjson-rpc';

  private readonly connectInteractiveButtonSelector = '#connectinteractive-ui';

  private readonly connectImagesButtonSelector = '#connectimages';

  private readonly connectLifeCycleButtonSelector = '#connectlifecycle-hooks';

  private readonly connectNameLookUpButtonSelector = '#connectname-lookup';

  private readonly connectManageStateButtonSelector = '#connectmanage-state';

  private readonly connectStateButtonSelector = '#connectstate';

  private readonly connectPreinstalledButtonSelector =
    '#connectpreinstalled-snap';

  private readonly connectProtocolButtonSelector = '#connectprotocol';

  private readonly connectTransactionInsightButtonSelector =
    '#connecttransaction-insights';

  private readonly connectUpdateButtonSelector = '#connectUpdate';

  private readonly connectUpdateNewButtonSelector = '#connectUpdateNew';

  private readonly connectWasmButtonSelector = '#connectwasm';

  private readonly connectNotificationButtonSelector = '#connectnotifications';

  private readonly connectEthereumProviderButtonSelector =
    '#connectethereum-provider';

  private readonly connectNetworkAccessButtonSelector = '#connectnetwork-access';

  private readonly connectBackgroundEventsButtonSelector =
    '#connectbackground-events';

  private readonly connectPreferencesButtonSelector = '#connectpreferences';

  // Action buttons
  private readonly confirmationButton = '#sendConfirmationButton';

  private readonly createDialogButton = '#createDialogButton';

  private readonly createDialogDisabledButton = '#createDisabledDialogButton';

  private readonly clearManageStateButton = '#clearManageState';

  private readonly clearUnencryptedManageStateButton =
    '#clearUnencryptedManageState';

  private readonly getAccountButton = '#getAccounts';

  private readonly getAccountsButton = '#sendEthproviderAccounts';

  private readonly getBip32CompressedPublicKeyButton =
    '#bip32GetCompressedPublic';

  private readonly getBip32PublicKeyButton = '#bip32GetPublic';

  private readonly getPreferencesSubmitButton = '#getPreferences';

  private readonly getVersionButton = '#sendEthprovider';

  private readonly incrementButton = '#increment';

  private readonly getSettingsStateButton = '#settings-state';

  private readonly personalSignButton = '#signPersonalSignMessage';

  private readonly publicKeyBip44Button = '#sendBip44Test';

  private readonly sendErrorButton = '#sendError';

  private readonly sendExpandedViewNotificationButton =
    '#sendExpandedViewNotification';

  private readonly sendInAppNotificationButton = '#sendInAppNotification';

  private readonly sendGetFileBase64Button = '#sendGetFileBase64Button';

  private readonly sendGetFileHexButton = '#sendGetFileHexButton';

  private readonly sendGetFileTextButton = '#sendGetFileTextButton';

  private readonly sendGenesisBlockEthProviderButton =
    '#sendGenesisBlockEthProvider';

  private readonly sendInsightButton = '#sendInsights';

  private readonly sendGetStateButton = '#sendGetState';

  private readonly sendNetworkAccessTestButton = '#sendNetworkAccessTest';

  private readonly sendManageStateButton = '#sendManageState';

  private readonly sendStateButton = '#sendState';

  private readonly sendRpcButton = '#sendRpc';

  private readonly sendUnencryptedManageStateButton =
    '#sendUnencryptedManageState';

  private readonly sendWasmMessageButton = '#sendWasmMessage';

  private readonly signBip32MessageSecp256k1Button = '#sendBip32-secp256k1';

  private readonly signBip44MessageButton = '#signBip44Message';

  private readonly signEd25519Bip32MessageButton = '#sendBip32-ed25519Bip32';

  private readonly signEd25519MessageButton = '#sendBip32-ed25519';

  private readonly signEntropyMessageButton = '#signEntropyMessage';

  private readonly signTypedDataButton = '#signTypedDataButton';

  private readonly submitClientStatusButton = '#sendClientStatusTest';

  private readonly trackErrorButton = '#trackError';

  private readonly trackEventButton = '#trackEvent';

  private readonly startTraceButton = '#start-trace';

  private readonly endTraceButton = '#end-trace';

  private readonly clearStateButton = '#clearState';

  private readonly sendUnencryptedStateButton = '#sendUnencryptedState';

  private readonly sendGetUnencryptedStateButton = '#sendGetUnencryptedState';

  private readonly clearStateUnencryptedButton = '#clearStateUnencrypted';

  private readonly scheduleBackgroundEventWithDateButton =
    '#scheduleBackgroundEventWithDate';

  private readonly scheduleBackgroundEventWithDurationButton =
    '#scheduleBackgroundEventWithDuration';

  private readonly cancelBackgroundEventButton = '#cancelBackgroundEvent';

  private readonly getBackgroundEventResultButton = '#getBackgroundEvents';

  private readonly showPreinstalledDialogButton = '#showPreinstalledDialog';

  private readonly displayJsxButton = '#displayJsx';

  private readonly startWebSocketButton = '#startWebSocket';

  private readonly stopWebSocketButton = '#stopWebSocket';

  private readonly getWebSocketStateButton = '#getWebSocketState';

  // Input fields
  private readonly dataManageStateInput = '#dataManageState';

  private readonly dataStateInput = '#dataState';

  private readonly dataUnencryptedManageStateInput =
    '#dataUnencryptedManageState';

  private readonly entropyMessageInput = '#entropyMessage';

  private readonly getStateInput = '#getState';

  private readonly messageBip44Input = '#bip44Message';

  private readonly messageEd25519Bip32Input = '#bip32Message-ed25519Bip32';

  private readonly messageEd25519Input = '#bip32Message-ed25519';

  private readonly messageSecp256k1Input = '#bip32Message-secp256k1';

  private readonly personalSignMessageInput = '#personalSignMessage';

  private readonly setStateKeyInput = '#setStateKey';

  private readonly setStateKeyUnencryptedInput = '#setStateKeyUnencrypted';

  private readonly signTypedDataMessageInput = '#signTypedData';

  private readonly dataUnencryptedStateInput = '#dataUnencryptedState';

  private readonly getUnencryptedStateInput = '#getUnencryptedState';

  private readonly wasmInput = '#wasmInput';

  private readonly backgroundEventDateInput = '#backgroundEventDate';

  private readonly backgroundEventDurationInput = '#backgroundEventDuration';

  private readonly cancelBackgroundEventInput = '#backgroundEventId';

  private readonly networkUrlInput = '#fetchUrl';

  // Result spans
  private readonly addressResultSpan = '#ethproviderResult';

  private readonly bip32MessageResultEd25519Span =
    '#bip32MessageResult-ed25519';

  private readonly bip32MessageResultSecp256k1Span =
    '#bip32MessageResult-secp256k1';

  private readonly bip32PublicKeyResultSpan = '#bip32PublicKeyResult';

  private readonly bip32ResultSpan = '#bip32Result';

  private readonly bip44ResultSpan = '#bip44Result';

  private readonly bip44SignResultSpan = '#bip44SignResult';

  private readonly clientStatusResultSpan = '#clientStatusResult';

  private readonly clearManageStateResultSpan = '#clearManageStateResult';

  private readonly clearUnencryptedManageStateResultSpan =
    '#clearUnencryptedManageStateResult';

  private readonly encryptedStateResultSpan = '#encryptedStateResult';

  private readonly entropySignResultSpan = '#entropySignResult';

  private readonly errorResultSpan = '#errorResult';

  private readonly getStateResultSpan = '#getStateResult';

  private readonly fileResultSpan = '#getFileResult';

  private readonly installedSnapResultSpan = '#installedSnapsResult';

  private readonly interactiveUIResultSpan = '#interactiveUIResult';

  private readonly networkAccessResultSpan = '#networkAccessResult';

  private readonly messageResultEd25519Bip32Span =
    '#bip32MessageResult-ed25519Bip32';

  private readonly personalSignResultSpan = '#personalSignResult';

  private readonly preferencesResultSpan = '#preferencesResult';

  private readonly sendManageStateResultSpan = '#sendManageStateResult';

  private readonly snapUIRenderer = '.snap-ui-renderer__content';

  private readonly sendUnencryptedManageStateResultSpan =
    '#sendUnencryptedManageStateResult';

  private readonly signTypedDataResultSpan = '#signTypedDataResult';

  private readonly retrieveManageStateResultSpan = '#retrieveManageStateResult';

  private readonly retrieveManageStateUnencryptedResultSpan =
    '#retrieveManageStateUnencryptedResult';

  private readonly rpcResultSpan = '#rpcResult';

  private readonly updateVersionSpan = '#updateSnapVersion';

  private readonly wasmResultSpan = '#wasmResult';

  private readonly unencryptedStateResultSpan = '#unencryptedStateResult';

  private readonly getStateUnencryptedResultSpan = '#getStateUnencryptedResult';

  private readonly backgroundEventResultSpan = '#schedulebackgroundEventResult';

  private readonly getBackgroundEventResultSpan = '#getBackgroundEventsResult';

  // Dropdowns
  private readonly bip32EntropyDropDown = '#bip32-entropy-selector';

  private readonly bip44EntropyDropDown = '#bip44-entropy-selector';

  private readonly getEntropyDropDown = '#get-entropy-entropy-selector';

  private readonly networkDropDown = '#select-chain';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage(url?: string): Promise<void> {
    await this.driver.openNewPage(url ?? DAPP_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.installedSnapsHeader,
        this.connectBip32ButtonSelector,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Test Snap Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Test Snap Dapp page is loaded');
  }

  // =====================
  // Connect Button Methods
  // =====================

  async connectBip32Button(): Promise<void> {
    console.log('Clicking Connect BIP-32 button');
    await this.driver.clickElement(this.connectBip32ButtonSelector);
  }

  async connectBip44Button(): Promise<void> {
    console.log('Clicking Connect BIP-44 button');
    await this.driver.clickElement(this.connectBip44ButtonSelector);
  }

  async connectClientStatusButton(): Promise<void> {
    console.log('Clicking Connect Client Status button');
    await this.driver.clickElement(this.connectClientStatusButtonSelector);
  }

  async connectCronJobsButton(): Promise<void> {
    console.log('Clicking Connect Cron Jobs button');
    await this.driver.clickElement(this.connectCronJobsButtonSelector);
  }

  async connectCronjobDurationButton(): Promise<void> {
    console.log('Clicking Connect Cronjob Duration button');
    await this.driver.clickElement(this.connectCronjobDurationButtonSelector);
  }

  async connectDialogsButton(): Promise<void> {
    console.log('Clicking Connect Dialogs button');
    await this.driver.clickElement(this.connectDialogsButtonSelector);
  }

  async connectErrorsButton(): Promise<void> {
    console.log('Clicking Connect Errors button');
    await this.driver.clickElement(this.connectErrorsButtonSelector);
  }

  async connectGetEntropyButton(): Promise<void> {
    console.log('Clicking Connect Get Entropy button');
    await this.driver.clickElement(this.connectGetEntropyButtonSelector);
  }

  async connectGetFileButton(): Promise<void> {
    console.log('Clicking Connect Get File button');
    await this.driver.clickElement(this.connectGetFileButtonSelector);
  }

  async connectHomePageButton(): Promise<void> {
    console.log('Clicking Connect Home Page button');
    await this.driver.clickElement(this.connectHomePageButtonSelector);
  }

  async connectJsxButton(): Promise<void> {
    console.log('Clicking Connect JSX button');
    await this.driver.clickElement(this.connectJsxButtonSelector);
  }

  async connectJsonRpcButton(): Promise<void> {
    console.log('Clicking Connect JSON-RPC button');
    await this.driver.clickElement(this.connectJsonRpcButtonSelector);
  }

  async connectInteractiveButton(): Promise<void> {
    console.log('Clicking Connect Interactive UI button');
    await this.driver.clickElement(this.connectInteractiveButtonSelector);
  }

  async connectImagesButton(): Promise<void> {
    console.log('Clicking Connect Images button');
    await this.driver.clickElement(this.connectImagesButtonSelector);
  }

  async connectLifeCycleButton(): Promise<void> {
    console.log('Clicking Connect LifeCycle button');
    await this.driver.clickElement(this.connectLifeCycleButtonSelector);
  }

  async connectNameLookUpButton(): Promise<void> {
    console.log('Clicking Connect Name Lookup button');
    await this.driver.clickElement(this.connectNameLookUpButtonSelector);
  }

  async connectManageStateButton(): Promise<void> {
    console.log('Clicking Connect Manage State button');
    await this.driver.clickElement(this.connectManageStateButtonSelector);
  }

  async connectStateButton(): Promise<void> {
    console.log('Clicking Connect State button');
    await this.driver.clickElement(this.connectStateButtonSelector);
  }

  async connectPreinstalledButton(): Promise<void> {
    console.log('Clicking Connect Preinstalled button');
    await this.driver.clickElement(this.connectPreinstalledButtonSelector);
  }

  async connectProtocolButton(): Promise<void> {
    console.log('Clicking Connect Protocol button');
    await this.driver.clickElement(this.connectProtocolButtonSelector);
  }

  async connectTransactionInsightButton(): Promise<void> {
    console.log('Clicking Connect Transaction Insight button');
    await this.driver.clickElement(this.connectTransactionInsightButtonSelector);
  }

  async connectUpdateButton(): Promise<void> {
    console.log('Clicking Connect Update button');
    await this.driver.clickElement(this.connectUpdateButtonSelector);
  }

  async connectUpdateNewButton(): Promise<void> {
    console.log('Clicking Connect Update New button');
    await this.driver.clickElement(this.connectUpdateNewButtonSelector);
  }

  async connectWasmButton(): Promise<void> {
    console.log('Clicking Connect Wasm button');
    await this.driver.clickElement(this.connectWasmButtonSelector);
  }

  async connectNotificationButton(): Promise<void> {
    console.log('Clicking Connect Notification button');
    await this.driver.clickElement(this.connectNotificationButtonSelector);
  }

  async connectEthereumProviderButton(): Promise<void> {
    console.log('Clicking Connect Ethereum Provider button');
    await this.driver.clickElement(this.connectEthereumProviderButtonSelector);
  }

  async connectNetworkAccessButton(): Promise<void> {
    console.log('Clicking Connect Network Access button');
    await this.driver.clickElement(this.connectNetworkAccessButtonSelector);
  }

  async connectBackgroundEventsButton(): Promise<void> {
    console.log('Clicking Connect Background Events button');
    await this.driver.clickElement(this.connectBackgroundEventsButtonSelector);
  }

  async connectPreferencesButton(): Promise<void> {
    console.log('Clicking Connect Preferences button');
    await this.driver.clickElement(this.connectPreferencesButtonSelector);
  }

  // =====================
  // Action Button Methods
  // =====================

  async clickConfirmationButton(): Promise<void> {
    console.log('Clicking Confirmation button');
    await this.driver.clickElement(this.confirmationButton);
  }

  async clickCreateDialogButton(): Promise<void> {
    console.log('Clicking Create Dialog button');
    await this.driver.clickElement(this.createDialogButton);
  }

  async clickCreateDialogDisabledButton(): Promise<void> {
    console.log('Clicking Create Dialog Disabled button');
    await this.driver.clickElement(this.createDialogDisabledButton);
  }

  async clickClearManageStateButton(): Promise<void> {
    console.log('Clicking Clear Manage State button');
    await this.driver.clickElement(this.clearManageStateButton);
  }

  async clickClearUnencryptedManageStateButton(): Promise<void> {
    console.log('Clicking Clear Unencrypted Manage State button');
    await this.driver.clickElement(this.clearUnencryptedManageStateButton);
  }

  async clickGetAccountButton(): Promise<void> {
    console.log('Clicking Get Account button');
    await this.driver.clickElement(this.getAccountButton);
  }

  async clickGetAccountsButton(): Promise<void> {
    console.log('Clicking Get Accounts button');
    await this.driver.clickElement(this.getAccountsButton);
  }

  async clickGetBip32CompressedPublicKeyButton(): Promise<void> {
    console.log('Clicking Get BIP-32 Compressed Public Key button');
    await this.driver.clickElement(this.getBip32CompressedPublicKeyButton);
  }

  async clickGetBip32PublicKeyButton(): Promise<void> {
    console.log('Clicking Get BIP-32 Public Key button');
    await this.driver.clickElement(this.getBip32PublicKeyButton);
  }

  async clickGetPreferencesSubmitButton(): Promise<void> {
    console.log('Clicking Get Preferences Submit button');
    await this.driver.clickElement(this.getPreferencesSubmitButton);
  }

  async clickGetVersionButton(): Promise<void> {
    console.log('Clicking Get Version button');
    await this.driver.clickElement(this.getVersionButton);
  }

  async clickIncrementButton(): Promise<void> {
    console.log('Clicking Increment button');
    await this.driver.clickElement(this.incrementButton);
  }

  async clickGetSettingsStateButton(): Promise<void> {
    console.log('Clicking Get Settings State button');
    await this.driver.clickElement(this.getSettingsStateButton);
  }

  async clickPersonalSignButton(): Promise<void> {
    console.log('Clicking Personal Sign button');
    await this.driver.clickElement(this.personalSignButton);
  }

  async clickPublicKeyBip44Button(): Promise<void> {
    console.log('Clicking Public Key BIP-44 button');
    await this.driver.clickElement(this.publicKeyBip44Button);
  }

  async clickSendErrorButton(): Promise<void> {
    console.log('Clicking Send Error button');
    await this.driver.clickElement(this.sendErrorButton);
  }

  async clickSendExpandedViewNotificationButton(): Promise<void> {
    console.log('Clicking Send Expanded View Notification button');
    await this.driver.clickElement(this.sendExpandedViewNotificationButton);
  }

  async clickSendInAppNotificationButton(): Promise<void> {
    console.log('Clicking Send In-App Notification button');
    await this.driver.clickElement(this.sendInAppNotificationButton);
  }

  async clickSendGetFileBase64Button(): Promise<void> {
    console.log('Clicking Send Get File Base64 button');
    await this.driver.clickElement(this.sendGetFileBase64Button);
  }

  async clickSendGetFileHexButton(): Promise<void> {
    console.log('Clicking Send Get File Hex button');
    await this.driver.clickElement(this.sendGetFileHexButton);
  }

  async clickSendGetFileTextButton(): Promise<void> {
    console.log('Clicking Send Get File Text button');
    await this.driver.clickElement(this.sendGetFileTextButton);
  }

  async clickSendGenesisBlockEthProviderButton(): Promise<void> {
    console.log('Clicking Send Genesis Block Eth Provider button');
    await this.driver.clickElement(this.sendGenesisBlockEthProviderButton);
  }

  async clickSendInsightButton(): Promise<void> {
    console.log('Clicking Send Insight button');
    await this.driver.clickElement(this.sendInsightButton);
  }

  async clickSendGetStateButton(): Promise<void> {
    console.log('Clicking Send Get State button');
    await this.driver.clickElement(this.sendGetStateButton);
  }

  async clickSendNetworkAccessTestButton(): Promise<void> {
    console.log('Clicking Send Network Access Test button');
    await this.driver.clickElement(this.sendNetworkAccessTestButton);
  }

  async clickSendManageStateButton(): Promise<void> {
    console.log('Clicking Send Manage State button');
    await this.driver.clickElement(this.sendManageStateButton);
  }

  async clickSendStateButton(): Promise<void> {
    console.log('Clicking Send State button');
    await this.driver.clickElement(this.sendStateButton);
  }

  async clickSendRpcButton(): Promise<void> {
    console.log('Clicking Send RPC button');
    await this.driver.clickElement(this.sendRpcButton);
  }

  async clickSendUnencryptedManageStateButton(): Promise<void> {
    console.log('Clicking Send Unencrypted Manage State button');
    await this.driver.clickElement(this.sendUnencryptedManageStateButton);
  }

  async clickSendWasmMessageButton(): Promise<void> {
    console.log('Clicking Send Wasm Message button');
    await this.driver.clickElement(this.sendWasmMessageButton);
  }

  async clickSignBip32MessageSecp256k1Button(): Promise<void> {
    console.log('Clicking Sign BIP-32 Message Secp256k1 button');
    await this.driver.clickElement(this.signBip32MessageSecp256k1Button);
  }

  async clickSignBip44MessageButton(): Promise<void> {
    console.log('Clicking Sign BIP-44 Message button');
    await this.driver.clickElement(this.signBip44MessageButton);
  }

  async clickSignEd25519Bip32MessageButton(): Promise<void> {
    console.log('Clicking Sign Ed25519 BIP-32 Message button');
    await this.driver.clickElement(this.signEd25519Bip32MessageButton);
  }

  async clickSignEd25519MessageButton(): Promise<void> {
    console.log('Clicking Sign Ed25519 Message button');
    await this.driver.clickElement(this.signEd25519MessageButton);
  }

  async clickSignEntropyMessageButton(): Promise<void> {
    console.log('Clicking Sign Entropy Message button');
    await this.driver.clickElement(this.signEntropyMessageButton);
  }

  async clickSignTypedDataButton(): Promise<void> {
    console.log('Clicking Sign Typed Data button');
    await this.driver.clickElement(this.signTypedDataButton);
  }

  async clickSubmitClientStatusButton(): Promise<void> {
    console.log('Clicking Submit Client Status button');
    await this.driver.clickElement(this.submitClientStatusButton);
  }

  async clickTrackErrorButton(): Promise<void> {
    console.log('Clicking Track Error button');
    await this.driver.clickElement(this.trackErrorButton);
  }

  async clickTrackEventButton(): Promise<void> {
    console.log('Clicking Track Event button');
    await this.driver.clickElement(this.trackEventButton);
  }

  async clickStartTraceButton(): Promise<void> {
    console.log('Clicking Start Trace button');
    await this.driver.clickElement(this.startTraceButton);
  }

  async clickEndTraceButton(): Promise<void> {
    console.log('Clicking End Trace button');
    await this.driver.clickElement(this.endTraceButton);
  }

  async clickClearStateButton(): Promise<void> {
    console.log('Clicking Clear State button');
    await this.driver.clickElement(this.clearStateButton);
  }

  async clickSendUnencryptedStateButton(): Promise<void> {
    console.log('Clicking Send Unencrypted State button');
    await this.driver.clickElement(this.sendUnencryptedStateButton);
  }

  async clickSendGetUnencryptedStateButton(): Promise<void> {
    console.log('Clicking Send Get Unencrypted State button');
    await this.driver.clickElement(this.sendGetUnencryptedStateButton);
  }

  async clickClearStateUnencryptedButton(): Promise<void> {
    console.log('Clicking Clear State Unencrypted button');
    await this.driver.clickElement(this.clearStateUnencryptedButton);
  }

  async clickScheduleBackgroundEventWithDateButton(): Promise<void> {
    console.log('Clicking Schedule Background Event With Date button');
    await this.driver.clickElement(this.scheduleBackgroundEventWithDateButton);
  }

  async clickScheduleBackgroundEventWithDurationButton(): Promise<void> {
    console.log('Clicking Schedule Background Event With Duration button');
    await this.driver.clickElement(
      this.scheduleBackgroundEventWithDurationButton,
    );
  }

  async clickCancelBackgroundEventButton(): Promise<void> {
    console.log('Clicking Cancel Background Event button');
    await this.driver.clickElement(this.cancelBackgroundEventButton);
  }

  async clickGetBackgroundEventResultButton(): Promise<void> {
    console.log('Clicking Get Background Event Result button');
    await this.driver.clickElement(this.getBackgroundEventResultButton);
  }

  async clickShowPreinstalledDialogButton(): Promise<void> {
    console.log('Clicking Show Preinstalled Dialog button');
    await this.driver.clickElement(this.showPreinstalledDialogButton);
  }

  async clickDisplayJsxButton(): Promise<void> {
    console.log('Clicking Display JSX button');
    await this.driver.clickElement(this.displayJsxButton);
  }

  async clickStartWebSocketButton(): Promise<void> {
    console.log('Clicking Start WebSocket button');
    await this.driver.clickElement(this.startWebSocketButton);
  }

  async clickStopWebSocketButton(): Promise<void> {
    console.log('Clicking Stop WebSocket button');
    await this.driver.clickElement(this.stopWebSocketButton);
  }

  async clickGetWebSocketStateButton(): Promise<void> {
    console.log('Clicking Get WebSocket State button');
    await this.driver.clickElement(this.getWebSocketStateButton);
  }

  // =====================
  // Input Field Methods
  // =====================

  async fillDataManageStateInput(value: string): Promise<void> {
    console.log('Filling Data Manage State input');
    await this.driver.fill(this.dataManageStateInput, value);
  }

  async fillDataStateInput(value: string): Promise<void> {
    console.log('Filling Data State input');
    await this.driver.fill(this.dataStateInput, value);
  }

  async fillDataUnencryptedManageStateInput(value: string): Promise<void> {
    console.log('Filling Data Unencrypted Manage State input');
    await this.driver.fill(this.dataUnencryptedManageStateInput, value);
  }

  async fillEntropyMessageInput(value: string): Promise<void> {
    console.log('Filling Entropy Message input');
    await this.driver.fill(this.entropyMessageInput, value);
  }

  async fillGetStateInput(value: string): Promise<void> {
    console.log('Filling Get State input');
    await this.driver.fill(this.getStateInput, value);
  }

  async fillMessageBip44Input(value: string): Promise<void> {
    console.log('Filling Message BIP-44 input');
    await this.driver.fill(this.messageBip44Input, value);
  }

  async fillMessageEd25519Bip32Input(value: string): Promise<void> {
    console.log('Filling Message Ed25519 BIP-32 input');
    await this.driver.fill(this.messageEd25519Bip32Input, value);
  }

  async fillMessageEd25519Input(value: string): Promise<void> {
    console.log('Filling Message Ed25519 input');
    await this.driver.fill(this.messageEd25519Input, value);
  }

  async fillMessageSecp256k1Input(value: string): Promise<void> {
    console.log('Filling Message Secp256k1 input');
    await this.driver.fill(this.messageSecp256k1Input, value);
  }

  async fillPersonalSignMessageInput(value: string): Promise<void> {
    console.log('Filling Personal Sign Message input');
    await this.driver.fill(this.personalSignMessageInput, value);
  }

  async fillSetStateKeyInput(value: string): Promise<void> {
    console.log('Filling Set State Key input');
    await this.driver.fill(this.setStateKeyInput, value);
  }

  async fillSetStateKeyUnencryptedInput(value: string): Promise<void> {
    console.log('Filling Set State Key Unencrypted input');
    await this.driver.fill(this.setStateKeyUnencryptedInput, value);
  }

  async fillSignTypedDataMessageInput(value: string): Promise<void> {
    console.log('Filling Sign Typed Data Message input');
    await this.driver.fill(this.signTypedDataMessageInput, value);
  }

  async fillDataUnencryptedStateInput(value: string): Promise<void> {
    console.log('Filling Data Unencrypted State input');
    await this.driver.fill(this.dataUnencryptedStateInput, value);
  }

  async fillGetUnencryptedStateInput(value: string): Promise<void> {
    console.log('Filling Get Unencrypted State input');
    await this.driver.fill(this.getUnencryptedStateInput, value);
  }

  async fillWasmInput(value: string): Promise<void> {
    console.log('Filling Wasm input');
    await this.driver.fill(this.wasmInput, value);
  }

  async fillBackgroundEventDateInput(value: string): Promise<void> {
    console.log('Filling Background Event Date input');
    await this.driver.fill(this.backgroundEventDateInput, value);
  }

  async fillBackgroundEventDurationInput(value: string): Promise<void> {
    console.log('Filling Background Event Duration input');
    await this.driver.fill(this.backgroundEventDurationInput, value);
  }

  async fillCancelBackgroundEventInput(value: string): Promise<void> {
    console.log('Filling Cancel Background Event input');
    await this.driver.fill(this.cancelBackgroundEventInput, value);
  }

  async fillNetworkUrlInput(value: string): Promise<void> {
    console.log('Filling Network URL input');
    await this.driver.fill(this.networkUrlInput, value);
  }

  // =====================
  // Check/Verification Methods
  // =====================

  async checkConnectBip32ButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect BIP-32 button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectBip32ButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectBip44ButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect BIP-44 button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectBip44ButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectClientStatusButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(`Checking Connect Client Status button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectClientStatusButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectCronJobsButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Cron Jobs button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectCronJobsButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectCronjobDurationButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(
      `Checking Connect Cronjob Duration button text: ${expectedText}`,
    );
    await this.driver.waitForSelector({
      css: this.connectCronjobDurationButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectDialogsButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Dialogs button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectDialogsButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectErrorsButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Errors button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectErrorsButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectGetEntropyButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Get Entropy button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectGetEntropyButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectGetFileButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Get File button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectGetFileButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectHomePageButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Home Page button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectHomePageButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectJsxButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect JSX button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectJsxButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectJsonRpcButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect JSON-RPC button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectJsonRpcButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectInteractiveButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Interactive button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectInteractiveButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectImagesButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Images button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectImagesButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectLifeCycleButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect LifeCycle button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectLifeCycleButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectManageStateButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Manage State button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectManageStateButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectStateButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect State button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectStateButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectPreinstalledButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(`Checking Connect Preinstalled button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectPreinstalledButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectUpdateButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Update button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectUpdateButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectUpdateNewButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Update New button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectUpdateNewButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectWasmButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Wasm button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectWasmButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectNotificationButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(`Checking Connect Notification button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectNotificationButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectEthereumProviderButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(
      `Checking Connect Ethereum Provider button text: ${expectedText}`,
    );
    await this.driver.waitForSelector({
      css: this.connectEthereumProviderButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectNetworkAccessButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(`Checking Connect Network Access button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectNetworkAccessButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectBackgroundEventsButtonText(
    expectedText: string,
  ): Promise<void> {
    console.log(
      `Checking Connect Background Events button text: ${expectedText}`,
    );
    await this.driver.waitForSelector({
      css: this.connectBackgroundEventsButtonSelector,
      text: expectedText,
    });
  }

  async checkConnectPreferencesButtonText(expectedText: string): Promise<void> {
    console.log(`Checking Connect Preferences button text: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.connectPreferencesButtonSelector,
      text: expectedText,
    });
  }

  // Result span check methods
  async checkInstalledSnapsResult(expectedMessage: string): Promise<void> {
    console.log('Checking installed snaps result');
    await this.driver.waitForSelector({
      css: this.installedSnapResultSpan,
      text: expectedMessage,
    });
  }

  async checkBip32PublicKeyResult(expectedMessage: string): Promise<void> {
    console.log('Checking BIP-32 public key result');
    await this.driver.waitForSelector({
      css: this.bip32PublicKeyResultSpan,
      text: expectedMessage,
    });
  }

  async checkBip32MessageResultSecp256k1(
    expectedMessage: string,
  ): Promise<void> {
    console.log('Checking BIP-32 message result Secp256k1');
    await this.driver.waitForSelector({
      css: this.bip32MessageResultSecp256k1Span,
      text: expectedMessage,
    });
  }

  async checkBip32MessageResultEd25519(expectedMessage: string): Promise<void> {
    console.log('Checking BIP-32 message result Ed25519');
    await this.driver.waitForSelector({
      css: this.bip32MessageResultEd25519Span,
      text: expectedMessage,
    });
  }

  async checkBip32MessageResultEd25519Bip32(
    expectedMessage: string,
  ): Promise<void> {
    console.log('Checking BIP-32 message result Ed25519 BIP-32');
    await this.driver.waitForSelector({
      css: this.messageResultEd25519Bip32Span,
      text: expectedMessage,
    });
  }

  async checkBip44Result(expectedMessage: string): Promise<void> {
    console.log('Checking BIP-44 result');
    await this.driver.waitForSelector({
      css: this.bip44ResultSpan,
      text: expectedMessage,
    });
  }

  async checkBip44SignResult(expectedMessage: string): Promise<void> {
    console.log('Checking BIP-44 sign result');
    await this.driver.waitForSelector({
      css: this.bip44SignResultSpan,
      text: expectedMessage,
    });
  }

  async checkClientStatusResult(
    expectedStatus: Record<string, unknown>,
  ): Promise<void> {
    const { clientVersion: expectedClientVersion, ...expectedStatusRest } =
      expectedStatus;
    console.log(
      `Checking client status result: ${JSON.stringify(expectedStatus, null, 2)}`,
    );

    await this.driver.waitUntil(
      async () => {
        const element = await this.driver.findElement(
          this.clientStatusResultSpan,
        );

        const spanText = await element.getAttribute('textContent');
        if (!spanText) {
          return false;
        }

        const { clientVersion: actualClientVersion, ...actualStatus } =
          JSON.parse(spanText);

        return (
          actualClientVersion.startsWith(expectedClientVersion as string) &&
          isEqual(actualStatus, expectedStatusRest)
        );
      },
      {
        interval: 200,
        timeout: veryLargeDelayMs,
      },
    );
  }

  async checkClearManageStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking clear manage state result');
    await this.driver.waitForSelector({
      css: this.clearManageStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkClearUnencryptedManageStateResult(
    expectedMessage: string,
  ): Promise<void> {
    console.log('Checking clear unencrypted manage state result');
    await this.driver.waitForSelector({
      css: this.clearUnencryptedManageStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkEncryptedStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking encrypted state result');
    await this.driver.waitForSelector({
      css: this.encryptedStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkEntropySignResult(expectedMessage: string): Promise<void> {
    console.log('Checking entropy sign result');
    await this.driver.waitForSelector({
      css: this.entropySignResultSpan,
      text: expectedMessage,
    });
  }

  async checkErrorResult(expectedMessage: string): Promise<void> {
    console.log('Checking error result');
    await this.driver.waitForSelector({
      css: this.errorResultSpan,
      text: expectedMessage,
    });
  }

  async checkGetStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking get state result');
    await this.driver.waitForSelector({
      css: this.getStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkFileResult(expectedMessage: string): Promise<void> {
    console.log('Checking file result');
    await this.driver.waitForSelector({
      css: this.fileResultSpan,
      text: expectedMessage,
    });
  }

  async checkInteractiveUIResult(expectedMessage: string): Promise<void> {
    console.log('Checking interactive UI result');
    await this.driver.waitForSelector({
      css: this.interactiveUIResultSpan,
      text: expectedMessage,
    });
  }

  async checkInteractiveUIResultIncludes(
    partialMessage: string,
  ): Promise<void> {
    console.log(`Checking interactive UI result includes: ${partialMessage}`);
    await this.driver.waitUntil(
      async () => {
        const element = await this.driver.findElement(
          this.interactiveUIResultSpan,
        );
        const spanText = await element.getAttribute('textContent');
        return spanText.includes(partialMessage);
      },
      { timeout: veryLargeDelayMs * 2, interval: 200 },
    );
  }

  async checkNetworkAccessResult(expectedMessage: string): Promise<void> {
    console.log('Checking network access result');
    await this.driver.waitForSelector({
      css: this.networkAccessResultSpan,
      text: expectedMessage,
    });
  }

  async checkPersonalSignResult(expectedMessage: string): Promise<void> {
    console.log('Checking personal sign result');
    await this.driver.waitForSelector({
      css: this.personalSignResultSpan,
      text: expectedMessage,
    });
  }

  async checkPreferencesResult(
    expectedPreferences: GetPreferencesResult,
  ): Promise<void> {
    console.log('Validating preferences result');

    const element = await this.driver.findElement(this.preferencesResultSpan);
    const spanText = await element.getAttribute('textContent');
    const actualPreferences = JSON.parse(spanText);

    console.log(`Actual preferences: ${JSON.stringify(actualPreferences)}`);
    console.log(`Expected preferences: ${JSON.stringify(expectedPreferences)}`);

    if (!isEqual(actualPreferences, expectedPreferences)) {
      throw new Error(
        'Preferences result span JSON does not match expected values',
      );
    }
    console.log('Preferences result span JSON is valid');
  }

  async checkSendManageStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking send manage state result');
    await this.driver.waitForSelector({
      css: this.sendManageStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkSendUnencryptedManageStateResult(
    expectedMessage: string,
  ): Promise<void> {
    console.log('Checking send unencrypted manage state result');
    await this.driver.waitForSelector({
      css: this.sendUnencryptedManageStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkSignTypedDataResult(expectedMessage: string): Promise<void> {
    console.log('Checking sign typed data result');
    await this.driver.waitForSelector({
      css: this.signTypedDataResultSpan,
      text: expectedMessage,
    });
  }

  async checkRetrieveManageStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking retrieve manage state result');
    await this.driver.waitForSelector({
      css: this.retrieveManageStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkRetrieveManageStateUnencryptedResult(
    expectedMessage: string,
  ): Promise<void> {
    console.log('Checking retrieve manage state unencrypted result');
    await this.driver.waitForSelector({
      css: this.retrieveManageStateUnencryptedResultSpan,
      text: expectedMessage,
    });
  }

  async checkRpcResult(expectedMessage: string): Promise<void> {
    console.log('Checking RPC result');
    await this.driver.waitForSelector({
      css: this.rpcResultSpan,
      text: expectedMessage,
    });
  }

  async checkUpdateVersionSpan(expectedMessage: string): Promise<void> {
    console.log('Checking update version');
    await this.driver.waitForSelector({
      css: this.updateVersionSpan,
      text: expectedMessage,
    });
  }

  async checkWasmResult(expectedMessage: string): Promise<void> {
    console.log('Checking WASM result');
    await this.driver.waitForSelector({
      css: this.wasmResultSpan,
      text: expectedMessage,
    });
  }

  async checkUnencryptedStateResult(expectedMessage: string): Promise<void> {
    console.log('Checking unencrypted state result');
    await this.driver.waitForSelector({
      css: this.unencryptedStateResultSpan,
      text: expectedMessage,
    });
  }

  async checkGetStateUnencryptedResult(expectedMessage: string): Promise<void> {
    console.log('Checking get state unencrypted result');
    await this.driver.waitForSelector({
      css: this.getStateUnencryptedResultSpan,
      text: expectedMessage,
    });
  }

  async checkBackgroundEventResult(expectedMessage: string): Promise<void> {
    console.log('Checking background event result');
    await this.driver.waitForSelector({
      css: this.backgroundEventResultSpan,
      text: expectedMessage,
    });
  }

  async checkGetBackgroundEventResult(expectedMessage: string): Promise<void> {
    console.log('Checking get background event result');
    await this.driver.waitForSelector({
      css: this.getBackgroundEventResultSpan,
      text: expectedMessage,
    });
  }

  async checkGetBackgroundEventResultIncludes(
    partialMessage: string,
  ): Promise<void> {
    console.log(
      `Checking get background event result includes: ${partialMessage}`,
    );
    await this.driver.waitUntil(
      async () => {
        const element = await this.driver.findElement(
          this.getBackgroundEventResultSpan,
        );
        const spanText = await element.getAttribute('textContent');
        return spanText.includes(partialMessage);
      },
      { timeout: veryLargeDelayMs * 2, interval: 200 },
    );
  }

  async checkSnapUIRendererResult(expectedMessage: string): Promise<void> {
    console.log('Checking snap UI renderer result');
    await this.driver.waitForSelector({
      css: this.snapUIRenderer,
      text: expectedMessage,
    });
  }

  async checkAddressResult(expectedMessage: string): Promise<void> {
    console.log('Checking address result');
    await this.driver.waitForSelector({
      css: this.addressResultSpan,
      text: expectedMessage,
    });
  }

  async checkAddressResultIncludes(partialMessage: string): Promise<void> {
    console.log(`Checking address result includes: ${partialMessage}`);
    await this.driver.waitUntil(
      async () => {
        const element = await this.driver.findElement(this.addressResultSpan);
        const spanText = await element.getAttribute('textContent');
        return spanText.includes(partialMessage);
      },
      { timeout: veryLargeDelayMs * 2, interval: 200 },
    );
  }

  async checkCount(expectedCount: string): Promise<void> {
    console.log(`Checking the count is ${expectedCount}`);
    await this.driver.waitForSelector({
      tag: 'p',
      text: expectedCount,
    });
  }

  // =====================
  // Dropdown Methods
  // =====================

  async selectBip32EntropySource(name: string): Promise<void> {
    console.log(`Selecting BIP-32 entropy source: ${name}`);
    await this.driver.clickElement(this.bip32EntropyDropDown);
    await this.driver.clickElement({
      text: name,
      css: `${this.bip32EntropyDropDown} option`,
    });
  }

  async selectBip44EntropySource(name: string): Promise<void> {
    console.log(`Selecting BIP-44 entropy source: ${name}`);
    await this.driver.clickElement(this.bip44EntropyDropDown);
    await this.driver.clickElement({
      text: name,
      css: `${this.bip44EntropyDropDown} option`,
    });
  }

  async selectGetEntropySource(name: string): Promise<void> {
    console.log(`Selecting Get Entropy source: ${name}`);
    await this.driver.clickElement(this.getEntropyDropDown);
    await this.driver.clickElement({
      text: name,
      css: `${this.getEntropyDropDown} option`,
    });
  }

  async selectNetwork(name: 'Ethereum' | 'Linea' | 'Sepolia'): Promise<void> {
    console.log(`Selecting network: ${name}`);
    await this.driver.clickElement(this.networkDropDown);
    await this.driver.clickElement({
      text: name,
      css: `${this.networkDropDown} option`,
    });
  }

  // =====================
  // Utility Methods
  // =====================

  async waitForWebSocketUpdate(state: {
    open: boolean;
    origin: string | null;
    blockNumber: string | null;
  }): Promise<void> {
    const resultElement = await this.driver.findElement(
      this.networkAccessResultSpan,
    );
    await this.driver.waitUntil(
      async () => {
        try {
          await this.clickGetWebSocketStateButton();

          await this.driver.waitForSelector(this.getWebSocketStateButton, {
            state: 'enabled',
          });

          const text = await resultElement.getText();

          const { open, origin, blockNumber } = JSON.parse(text);

          console.log('Retrieved WebSocket state:', {
            open,
            origin,
            blockNumber,
          });

          const blockNumberMatch =
            typeof state.blockNumber === 'string'
              ? typeof blockNumber === state.blockNumber
              : blockNumber === state.blockNumber;

          return (
            open === state.open && origin === state.origin && blockNumberMatch
          );
        } catch {
          return false;
        }
      },
      { timeout: veryLargeDelayMs * 2, interval: 200 },
    );
  }
}

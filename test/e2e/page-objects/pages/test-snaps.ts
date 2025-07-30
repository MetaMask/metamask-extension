import { isEqual } from 'lodash';
import { GetPreferencesResult } from '@metamask/snaps-sdk';
import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';
import { veryLargeDelayMs } from '../../helpers';

const inputLocator = {
  dataManageStateInput: '#dataManageState',
  dataStateInput: '#dataState',
  dataUnencryptedManageStateInput: '#dataUnencryptedManageState',
  entropyMessageInput: '#entropyMessage',
  getStateInput: '#getState',
  messageBip44Input: '#bip44Message',
  messageEd25519Bip32Input: '#bip32Message-ed25519Bip32',
  messageEd25519Input: '#bip32Message-ed25519',
  messageSecp256k1Input: '#bip32Message-secp256k1',
  personalSignMessageInput: '#personalSignMessage',
  setStateKeyInput: '#setStateKey',
  setStateKeyUnencryptedInput: '#setStateKeyUnencrypted',
  signTypedDataMessageInput: '#signTypedData',
  dataUnencryptedStateInput: '#dataUnencryptedState',
  getUnencryptedStateInput: '#getUnencryptedState',
  wasmInput: '#wasmInput',
  backgroundEventDateInput: '#backgroundEventDate',
  backgroundEventDurationInput: '#backgroundEventDuration',
  cancelBackgroundEventInput: '#backgroundEventId',
} satisfies Record<string, string>;

export const buttonLocator = {
  connectBip32Button: '#connectbip32',
  connectBip44Button: '#connectbip44',
  connectClientStatusButton: '#connectclient-status',
  connectCronJobsButton: '#connectcronjobs',
  connectCronjobDurationButton: '#connectcronjob-duration',
  connectDialogsButton: '#connectdialogs',
  connectErrorsButton: '#connecterrors',
  connectGetEntropyButton: '#connectGetEntropySnap',
  connectGetFileButton: '#connectgetfile',
  connectHomePageButton: '#connecthomepage',
  connectjsxButton: '#connectjsx',
  displayJsxButton: '#displayJsx',
  connectJsonRpcButton: '#connectjson-rpc',
  connectInteractiveButton: '#connectinteractive-ui',
  connectImagesButton: '#connectimages',
  connectLifeCycleButton: '#connectlifecycle-hooks',
  connectNameLookUpButton: '#connectname-lookup',
  connectManageStateButton: '#connectmanage-state',
  connectstateButton: '#connectstate',
  connectPreinstalledButton: '#connectpreinstalled-snap',
  connectProtocolButton: '#connectprotocol',
  connectTransactionInsightButton: '#connecttransaction-insights',
  connectUpdateButton: '#connectUpdate',
  connectUpdateNewButton: '#connectUpdateNew',
  connectWasmButton: '#connectwasm',
  connectNotificationButton: '#connectnotifications',
  confirmationButton: '#sendConfirmationButton',
  createDialogButton: '#createDialogButton',
  createDialogDisabledButton: '#createDisabledDialogButton',
  clearManageStateButton: '#clearManageState',
  clearUnencryptedManageStateButton: '#clearUnencryptedManageState',
  ethereumProviderConnectButton: '#connectethereum-provider',
  getAccountButton: '#getAccounts',
  getAccountsButton: '#sendEthproviderAccounts',
  getBip32CompressedPublicKeyButton: '#bip32GetCompressedPublic',
  getBip32PublicKeyButton: '#bip32GetPublic',
  getPreferencesConnectButton: '#connectpreferences',
  getPreferencesSubmitButton: '#getPreferences',
  getVersionButton: '#sendEthprovider',
  incrementButton: '#increment',
  getSettingsStateButton: '#settings-state',
  personalSignButton: '#signPersonalSignMessage',
  publicKeyBip44Button: '#sendBip44Test',
  connectNetworkAccessButton: '#connectnetwork-access',
  sendErrorButton: '#sendError',
  sendExpandedViewNotificationButton: '#sendExpandedViewNotification',
  sendInAppNotificationButton: '#sendInAppNotification',
  sendGetFileBase64Button: '#sendGetFileBase64Button',
  sendGetFileHexButton: '#sendGetFileHexButton',
  sendGetFileTextButton: '#sendGetFileTextButton',
  sendInsightButton: '#sendInsights',
  sendGetStateButton: '#sendGetState',
  sendNetworkAccessTestButton: '#sendNetworkAccessTest',
  sendManageStateButton: '#sendManageState',
  sendStateButton: '#sendState',
  sendRpcButton: '#sendRpc',
  sendUnencryptedManageStateButton: '#sendUnencryptedManageState',
  sendWasmMessageButton: '#sendWasmMessage',
  signBip32messageSecp256k1Button: '#sendBip32-secp256k1',
  signBip44MessageButton: '#signBip44Message',
  signEd25519Bip32MessageButton: '#sendBip32-ed25519Bip32',
  signEd25519MessageButton: '#sendBip32-ed25519',
  signEntropyMessageButton: '#signEntropyMessage',
  signTypedDataButton: '#signTypedDataButton',
  submitClientStatusButton: '#sendClientStatusTest',
  trackErrorButton: '#trackError',
  startTraceButton: '#start-trace',
  endTraceButton: '#end-trace',
  clearStateButton: '#clearState',
  sendUnencryptedStateButton: '#sendUnencryptedState',
  sendGetUnencryptedStateButton: '#sendGetUnencryptedState',
  clearStateUnencryptedButton: '#clearStateUnencrypted',
  connectBackgroundEventsButton: '#connectbackground-events',
  scheduleBackgroundEventWithDateButton: '#scheduleBackgroundEventWithDate',
  scheduleBackgroundEventWithDurationButton:
    '#scheduleBackgroundEventWithDuration',
  cancelBackgroundEventButton: '#cancelBackgroundEvent',
  getBackgroundEventResultButton: '#getBackgroundEvents',
  showPreinstalledDialogButton: '#showPreinstalledDialog',
  startWebSocket: '#startWebSocket',
  stopWebSocket: '#stopWebSocket',
  getWebSocketState: '#getWebSocketState',
} satisfies Record<string, string>;

const spanLocator = {
  addressResultSpan: '#ethproviderResult',
  bip32MessageResultEd25519Span: '#bip32MessageResult-ed25519',
  bip32MessageResultSecp256k1Span: '#bip32MessageResult-secp256k1',
  bip32PublicKeyResultSpan: '#bip32PublicKeyResult',
  bip32ResultSpan: '#bip32Result',
  bip44ResultSpan: '#bip44Result',
  bip44SignResultSpan: '#bip44SignResult',
  clientStatusResultSpan: '#clientStatusResult',
  clearManageStateResultSpan: '#clearManageStateResult',
  clearUnencryptedManageStateResultSpan: '#clearUnencryptedManageStateResult',
  encryptedStateResultSpan: '#encryptedStateResult',
  entropySignResultSpan: '#entropySignResult',
  errorResultSpan: '#errorResult',
  getStateResultSpan: '#getStateResult',
  fileResultSpan: '#getFileResult',
  installedSnapResultSpan: '#installedSnapsResult',
  interactiveUIResultSpan: '#interactiveUIResult',
  networkAccessResultSpan: '#networkAccessResult',
  messageResultEd25519SBip32Span: '#bip32MessageResult-ed25519Bip32',
  personalSignResultSpan: '#personalSignResult',
  preferencesResultSpan: '#preferencesResult',
  providerVersionResultSpan: '#ethproviderResult',
  sendManageStateResultSpan: '#sendManageStateResult',
  snapUIRenderer: '.snap-ui-renderer__content',
  sendUnencryptedManageStateResultSpan: '#sendUnencryptedManageStateResult',
  signTypedDataResultSpan: '#signTypedDataResult',
  retrieveManageStateResultSpan: '#retrieveManageStateResult',
  retrieveManageStateUnencryptedResultSpan:
    '#retrieveManageStateUnencryptedResult',
  rpcResultSpan: '#rpcResult',
  updateVersionSpan: '#updateSnapVersion',
  wasmResultSpan: '#wasmResult',
  unencryptedStateResultSpan: '#unencryptedStateResult',
  getStateUnencryptedResultSpan: '#getStateUnencryptedResult',
  backgroundEventResultSpan: '#schedulebackgroundEventResult',
  getBackgroundEventResultSpan: '#getBackgroundEventsResult',
} satisfies Record<string, string>;

const dropDownLocator = {
  bip32EntropyDropDown: '#bip32-entropy-selector',
  bip44EntropyDropDown: '#bip44-entropy-selector',
  getEntropyDropDown: '#get-entropy-entropy-selector',
  networkDropDown: '#select-chain',
} satisfies Record<string, string>;

export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    console.log('Opening Test Snap Dapp page');
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.installedSnapsHeader,
        buttonLocator.connectBip32Button,
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_clientStatus(expectedStatus: string): Promise<void> {
    console.log(`Checking that the client status should be ${expectedStatus}`);
    await this.driver.waitForSelector({
      css: spanLocator.clientStatusResultSpan,
      text: expectedStatus,
    });
  }

  async scrollAndClickButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Finding, scrolling to, and clicking ${buttonElement}`);
    await this.driver.findScrollToAndClickElement(buttonLocator[buttonElement]);
  }

  async fillMessage(inputElement: keyof typeof inputLocator, message: string) {
    console.log(`Filling message in ${inputElement}`);
    await this.driver.fill(inputLocator[inputElement], message);
  }

  async clickButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Clicking button ${buttonElement}`);
    await this.driver.clickElement(buttonLocator[buttonElement]);
  }

  async scrollToButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Scrolling button ${buttonElement}`);
    const buttonSelector = await this.driver.findElement(
      buttonLocator[buttonElement],
    );
    await this.driver.scrollToElement(buttonSelector);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_installationComplete(
    selector: keyof typeof buttonLocator,
    expectedMessage: string,
  ) {
    console.log(`Checking installation is complete - ${expectedMessage}`);
    await this.driver.waitForSelector({
      css: buttonLocator[selector],
      text: expectedMessage,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_installedSnapsResult(expectedMessage: string) {
    console.log('Checking installed snaps, result section on the top left');
    await this.driver.waitForSelector({
      css: spanLocator.installedSnapResultSpan,
      text: expectedMessage,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_messageResultSpan(
    spanSelectorId: keyof typeof spanLocator,
    expectedMessage: string,
  ) {
    console.log(
      `Checking the received result against the following expected result: ${expectedMessage}`,
    );
    await this.driver.waitForSelector({
      css: spanLocator[spanSelectorId],
      text: expectedMessage,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_messageResultSpanIncludes(
    spanSelectorId: keyof typeof spanLocator,
    partialMessage: string,
  ) {
    const element = await this.driver.findElement(spanLocator[spanSelectorId]);
    const spanText = await element.getAttribute('textContent');
    if (!spanText.includes(partialMessage)) {
      throw new Error(`Expected partial message "${partialMessage}" not found`);
    }
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_Count(expectedCount: string) {
    console.log(`Checking the count is ${expectedCount}`);
    await this.driver.waitForSelector({
      tag: 'p',
      text: expectedCount,
    });
  }

  /**
   * Select an entropy source from the dropdown with the given name.
   *
   * @param dropDownName - The name of the dropdown locator to select the entropy source from.
   * @param name - The name of the entropy source to select.
   */
  async scrollAndSelectEntropySource(
    dropDownName: keyof typeof dropDownLocator,
    name: string,
  ) {
    const locator = dropDownLocator[dropDownName];
    console.log(`Select ${dropDownName} entropy source`);
    const selector = await this.driver.findElement(locator);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(locator);
    await this.driver.clickElement({
      text: name,
      css: `${locator} option`,
    });
  }

  /**
   * Validate the preferences result span JSON response.
   *
   * @param expectedPreferences - The expected preferences object to validate against.
   * @param expectedPreferences.locale
   * @param expectedPreferences.currency
   * @param expectedPreferences.hideBalances
   * @param expectedPreferences.useSecurityAlerts
   * @param expectedPreferences.useExternalPricingData
   * @param expectedPreferences.simulateOnChainActions
   * @param expectedPreferences.useTokenDetection
   * @param expectedPreferences.batchCheckBalances
   * @param expectedPreferences.displayNftMedia
   * @param expectedPreferences.useNftDetection
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_preferencesResult(expectedPreferences: GetPreferencesResult) {
    console.log('Validating preferences result span JSON response');

    const element = await this.driver.findElement(
      spanLocator.preferencesResultSpan,
    );
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

  /**
   * Select a network from the dropdown with the given name.
   *
   * @param dropDownName - The name of the dropdown locator to select the
   * network from.
   * @param name - The name of the network to select.
   */
  async scrollAndSelectNetwork(
    dropDownName: keyof typeof dropDownLocator,
    name: 'Ethereum' | 'Linea' | 'Sepolia',
  ) {
    const locator = dropDownLocator[dropDownName];
    console.log(`Select ${name} network`);
    const selector = await this.driver.findElement(locator);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(locator);
    await this.driver.clickElement({
      text: name,
      css: `${locator} option`,
    });
  }

  async waitForWebSocketUpdate(state: {
    open: boolean;
    origin: string | null;
    blockNumber: string | null;
  }) {
    const resultElement = await this.driver.findElement('#networkAccessResult');
    await this.driver.waitUntil(
      async () => {
        try {
          await this.clickButton('getWebSocketState');

          // Wait for response from Snap.
          await this.driver.waitForSelector('#getWebSocketState', {
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

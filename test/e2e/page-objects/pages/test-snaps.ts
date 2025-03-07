import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';

export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

  private readonly connectHomePageButton = '#connecthomepage';

  public readonly connectDialogsButton = '#connectdialogs';

  private readonly connectErrorsButton = '#connecterrors';

  private readonly connectBip32Button = '#connectbip32';

  private readonly connectBip44Button = '#connectbip44';

  public readonly connectUpdateButton = '#connectUpdate';

  public readonly connectUpdateNewButton = '#connectUpdateNew';

  private readonly connectClientStatusButton = '#connectclient-status';

  private readonly connectGetEntropySnapButton = '#connectGetEntropySnap';

  private readonly sendGetFileTextButton = '#sendGetFileTextButton';

  private readonly sendGetFileBase64Button = '#sendGetFileBase64Button';

  private readonly sendGetFileHexButton = '#sendGetFileHexButton';

  private readonly connectImagesButton = '#connectimages';

  public readonly connectGetFileButton = '#connectgetfile';

  public readonly fileResultSpan = '#getFileResult';

  public readonly connectLifeCycleButton = '#connectlifecycle-hooks';

  private readonly connectTransactionInsightButton =
    '#connecttransaction-insights';

  public readonly connectWasmButton = '#connectwasm';

  private readonly getAccountButton = '#getAccounts';

  private readonly sendInsightButton = '#sendInsights';

  private readonly nameLookUpButton = '#connectname-lookup';

  private readonly submitClientStatusButton = '#sendClientStatusTest';

  private readonly sendErrorButton = '#sendError';

  public readonly reconnectBip32Button = '#connectbip32';

  public readonly reconnectBip44Button = '#connectbip44';

  private readonly getPublicKeyButton = '#bip32GetPublic';

  private readonly getCompressedKeyButton = '#bip32GetCompressedPublic';

  private readonly publicKeyBip44Button = '#sendBip44Test';

  private readonly wasmInput = '#wasmInput';

  private readonly messageEd25519Input = '#bip32Message-ed25519';

  private readonly entropyMessageInput = '#entropyMessage';

  private readonly messageEd25519Bip32Input = '#bip32Message-ed25519Bip32';

  private readonly messageSecp256k1Input = '#bip32Message-secp256k1';

  private readonly sendWasmMessageButton = '#sendWasmMessage';

  private readonly messageSecp256k1Button = '#sendBip32-secp256k1';

  private readonly signEd25519MessageButton = '#sendBip32-ed25519';

  private readonly messageBip44Input = '#bip44Message';

  private readonly signBip44MessageButton = '#signBip44Message';

  private readonly signEd25519Bip32MessageButton = '#sendBip32-ed25519Bip32';

  private readonly signEntropyMessageButton = '#signEntropyMessage';

  private readonly clientStatusResultSpan = '#clientStatusResult';

  public readonly bip32ResultSpan = '#bip32Result';

  public readonly bip32PublicKeyResultSpan = '#bip32PublicKeyResult';

  public readonly bip32MessageResultSecp256k1Span =
    '#bip32MessageResult-secp256k1';

  public readonly bip32MessageResultEd25519Span = '#bip32MessageResult-ed25519';

  public readonly messageResultEd25519SBip32Span =
    '#bip32MessageResult-ed25519Bip32';

  public readonly bip44ResultSpan = '#bip44Result';

  public readonly bip44SignResultSpan = '#bip44SignResult';

  public readonly errorResultSpan = '#errorResult';

  public readonly installedSnapResultSpan = '#installedSnapsResult';

  public readonly wasmResultSpan = '#wasmResult';

  public readonly updateVersionSpan = '#updateSnapVersion';

  public readonly entropySignResultSpan = '#entropySignResult';

  public readonly bip32EntropyDropDown = '#bip32-entropy-selector';

  public readonly bip44EntropyDropDown = '#bip44-entropy-selector';

  public readonly getEntropyDropDown = '#get-entropy-entropy-selector';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    console.log('Opening Test Snap Dapp page');
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.installedSnapsHeader,
        this.connectBip32Button,
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

  async check_clientStatus(expectedStatus: string): Promise<void> {
    console.log(`Checking that the client status should be ${expectedStatus}`);
    await this.driver.waitForSelector({
      css: this.clientStatusResultSpan,
      text: expectedStatus,
    });
  }

  async clickButton(buttonElement: string, scrollTo: boolean = true) {
    if (scrollTo) {
      console.log(`Finding, scrolling to, and clicking ${buttonElement}`);
      await this.driver.findScrollToAndClickElement(buttonElement);
    } else {
      console.log(`Clicking the button ${buttonElement}`);
      await this.driver.clickElement(buttonElement);
    }
  }

  async clickConnectDialogsSnapButton() {
    await this.driver.clickElement(this.connectDialogsButton);
  }

  async clickConnectGetEntropySnapButton() {
    await this.clickButton(this.connectGetEntropySnapButton);
  }

  async clickGetFileTextButton() {
    await this.clickButton(this.sendGetFileTextButton);
  }

  async clickGetFileBase64Button() {
    await this.clickButton(this.sendGetFileBase64Button, false);
  }

  async clickGetFileTextHexButton() {
    await this.driver.clickElement(this.sendGetFileHexButton);
  }

  async clickConnectGetFileButton() {
    await this.clickButton(this.connectGetFileButton, true);
  }

  async clickConnectUpdateButton() {
    await this.clickButton(this.connectUpdateButton);
  }

  async clickConnectUpdateNewButton() {
    await this.clickButton(this.connectUpdateNewButton);
  }

  async clickConnectWasmButton() {
    await this.clickButton(this.connectWasmButton);
  }

  async clickSendErrorButton() {
    await this.clickButton(this.sendErrorButton);
  }

  async clickDialogsSnapConfirmationButton() {
    await this.clickButton(this.dialogsSnapConfirmationButton, false);
  }

  async clickConnectBip32Button() {
    await this.clickButton(this.connectBip32Button);
  }

  async clickConnectBip44Button() {
    await this.clickButton(this.connectBip44Button);
  }

  async clickConnectClientStatusButton() {
    await this.clickButton(this.connectClientStatusButton);
  }

  async clickGetAccountButton() {
    await this.clickButton(this.getAccountButton, false);
  }

  async clickSendInsightButton() {
    await this.clickButton(this.sendInsightButton, false);
  }

  async clickConnectDialogsButton() {
    await this.clickButton(this.connectDialogsButton, false);
  }

  async clickGetPublicKeyBip32Button() {
    await this.clickButton(this.getPublicKeyButton, false);
  }

  async clickPublicKeyBip44Button() {
    await this.clickButton(this.publicKeyBip44Button, false);
  }

  async clickGetCompressedPublicKeyBip32Button() {
    await this.clickButton(this.getCompressedKeyButton, false);
  }

  async clickConnectHomePage() {
    await this.clickButton(this.connectHomePageButton);
  }

  async clickConnectErrorsButton() {
    await this.clickButton(this.connectErrorsButton);
  }

  async clickConnectImagesButton() {
    await this.clickButton(this.connectImagesButton);
  }

  async clickLifeCycleHooksButton() {
    await this.clickButton(this.connectLifeCycleButton);
  }

  async clickNameLookupButton() {
    await this.clickButton(this.nameLookUpButton);
  }

  async clickTransactionInsightButton() {
    await this.clickButton(this.connectTransactionInsightButton);
  }

  async clickSubmitClientStatusButton() {
    await this.clickButton(this.submitClientStatusButton);
  }

  async fillWasmMessageAndSign(message: string) {
    console.log('Filling message in wasm');
    await this.driver.fill(this.wasmInput, message);
    await this.clickButton(this.sendWasmMessageButton, false);
  }

  async fillMessageAndSignSecp256k1(message: string) {
    console.log('Filling message in secp256k1');
    await this.driver.fill(this.messageSecp256k1Input, message);
    await this.clickButton(this.messageSecp256k1Button, false);
  }

  async fillMessageAndSignEd25519(message: string) {
    console.log('Filling message in ed25519');
    await this.driver.fill(this.messageEd25519Input, message);
    await this.clickButton(this.signEd25519MessageButton, false);
  }

  async fillMessageAndSignEd25519Bip32(message: string) {
    console.log('Filling message in ed25519 bip32');
    await this.driver.fill(this.messageEd25519Bip32Input, message);
    await this.clickButton(this.signEd25519Bip32MessageButton, false);
  }

  async fillBip44MessageAndSign(message: string) {
    console.log('Filling bip44 message ');
    await this.driver.pasteIntoField(this.messageBip44Input, message);
    await this.clickButton(this.signBip44MessageButton);
  }

  async fillEntropyMessage(message: string) {
    console.log('Filling entropy message ');
    await this.driver.pasteIntoField(this.entropyMessageInput, message);
    await this.clickButton(this.signEntropyMessageButton);
  }

  async scrollToSignWithEd25519Button() {
    console.log('Scrolling to sign with ed25519 button');
    const sendEd25519 = await this.driver.findElement(this.messageEd25519Input);
    await this.driver.scrollToElement(sendEd25519);
  }

  async check_installationComplete(selector: string, expectedMessage: string) {
    console.log(`Checking installation is complete - ${expectedMessage}`);
    await this.driver.waitForSelector({
      css: selector,
      text: expectedMessage,
    });
  }

  async check_installedSnapsResult(expectedMessage: string) {
    console.log('Checking installed snaps, result section on the top left');
    await this.driver.waitForSelector({
      css: this.installedSnapResultSpan,
      text: expectedMessage,
    });
  }

  async check_messageResultSpan(
    spanSelectorId: string,
    expectedMessage: string,
  ) {
    console.log(
      `Checking the received result against the following expected result: ${expectedMessage}`,
    );
    await this.driver.waitForSelector({
      css: spanSelectorId,
      text: expectedMessage,
    });
  }

  /**
   * Select an entropy source from the dropdown with the given name.
   *
   * @param dropDownName - The name of the dropdown locator to select the entropy source from.
   * @param name - The name of the entropy source to select.
   */
  async scrollAndSelectEntropySource(dropDownName: string, name: string) {
    let dropDownLocator: string;
    switch (dropDownName) {
      case 'bip32':
        dropDownLocator = this.bip32EntropyDropDown;
        break;
      case 'bip44':
        dropDownLocator = this.bip44EntropyDropDown;
        break;
      case 'getEntropy':
        dropDownLocator = this.getEntropyDropDown;
        break;
      default:
        throw new Error(`Unknown entropy source type: ${dropDownName}`);
    }
    console.log(`Select ${dropDownName} entropy source`);
    const selector = await this.driver.findElement(dropDownLocator);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(dropDownLocator);
    await this.driver.clickElement({
      text: name,
      css: `${dropDownLocator} option`,
    });
  }
}

import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';

export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  private readonly connectDialogsSnapButton =
    '[data-testid="dialogs"] [data-testid="connect-button"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

  private readonly connectHomePage = '#connecthomepage';

  public readonly connectDialogsButton = '#connectdialogs';

  private readonly connectErrorsButton = '#connecterrors';

  private readonly connectBip32Button = '#connectbip32';

  private readonly connectBip44Button = '#connectbip44';

  public readonly connectUpdateButton = '#connectUpdate';

  public readonly connectUpdateNewButton = '#connectUpdateNew';

  private readonly connectClientStatusButton = '#connectclient-status';

  private readonly sendGetFileTextButton = '#sendGetFileTextButton';

  private readonly sendGetFileBase64Button = '#sendGetFileBase64Button';

  private readonly sendGetFileHexButton = '#sendGetFileHexButton';

  private readonly connectImagesButton = '#connectimages';

  public readonly connectGetFile = '#connectgetfile';

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

  private readonly inputWasm = '#wasmInput';

  private readonly inputMessageEd25519 = '#bip32Message-ed25519';

  private readonly inputMessageEd25519Bip32 = '#bip32Message-ed25519Bip32';

  private readonly inputMessageSecp256k1 = '#bip32Message-secp256k1';

  private readonly buttonSendWasmMessage = '#sendWasmMessage';

  private readonly buttonMessageSecp256k1 = '#sendBip32-secp256k1';

  private readonly buttonSignEd25519Message = '#sendBip32-ed25519';

  private readonly inputMessageBip44 = '#bip44Message';

  private readonly buttonSignBip44Message = '#signBip44Message';

  private readonly buttonSignEd25519Bip32Message = '#sendBip32-ed25519Bip32';

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
      await this.driver.findScrollToElementClick(buttonElement);
    } else {
      console.log(`Clicking the button ${buttonElement}`);
      await this.driver.clickElement(buttonElement);
    }
  }

  async clickConnectDialogsSnapButton() {
    await this.clickButton(this.connectDialogsSnapButton);
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

  async connectGetFileButton() {
    await this.clickButton(this.connectGetFile, true);
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
    await this.clickButton(this.connectHomePage);
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
    await this.driver.fill(this.inputWasm, message);
    await this.driver.clickElement(this.buttonSendWasmMessage);
  }

  async fillMessageAndSignSecp256k1(message: string) {
    console.log('Filling message in secp256k1');
    await this.driver.fill(this.inputMessageSecp256k1, message);
    await this.driver.clickElement(this.buttonMessageSecp256k1);
  }

  async fillMessageAndSignEd25519(message: string) {
    console.log('Filling message in ed25519');
    await this.driver.fill(this.inputMessageEd25519, message);
    await this.driver.clickElement(this.buttonSignEd25519Message);
  }

  async fillMessageAndSignEd25519Bip32(message: string) {
    console.log('Filling message in ed25519 bip32');
    await this.driver.fill(this.inputMessageEd25519Bip32, message);
    await this.driver.clickElement(this.buttonSignEd25519Bip32Message);
  }

  async fillBip44MessageAndSign(message: string) {
    console.log('Filling bip44 message ');
    await this.driver.pasteIntoField(this.inputMessageBip44, message);
    await this.clickButton(this.buttonSignBip44Message);
  }

  async scrollToSendEd25519() {
    console.log('Scrolling to sign with ed25519 button');
    const sendEd25519 = await this.driver.findElement(this.inputMessageEd25519);
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
      `Checking message result that is received - ${expectedMessage}`,
    );
    await this.driver.waitForSelector({
      css: spanSelectorId,
      text: expectedMessage,
    });
  }
}

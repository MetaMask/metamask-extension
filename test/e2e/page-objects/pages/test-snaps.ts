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

  private readonly statusResultSpan = '#clientStatusResult';

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
    console.log(`Check that client status should ${expectedStatus}`);
    await this.driver.waitForSelector({
      css: this.statusResultSpan,
      text: expectedStatus,
    });
  }

  async clickConnectDialogsSnapButton() {
    console.log('Find, scroll and click dialog snap button');
    await this.driver.findScrollToElementClick(this.connectDialogsSnapButton);
  }

  async clickGetFileTextButton() {
    console.log('Finding, scrolling to and clicking the get file text button');
    await this.driver.findScrollToElementClick(this.sendGetFileTextButton);
  }

  async clickGetFileBase64Button() {
    console.log('Find, scroll and click get file button');
    await this.driver.clickElement(this.sendGetFileBase64Button);
  }

  async clickGetFileTextHexButton() {
    console.log('Find, scroll and click get file button');
    await this.driver.clickElement(this.sendGetFileHexButton);
  }

  async connectGetFileButton() {
    console.log('Find, scroll and click get file button');
    await this.driver.findScrollToElementClick(this.connectGetFile);
  }

  async clickConnectUpdateButton() {
    console.log('Find, scroll and click connect update button');
    await this.driver.findScrollToElementClick(this.connectUpdateButton);
  }

  async clickConnectUpdateNewButton() {
    console.log('Find, scroll and click connect update button');
    await this.driver.findScrollToElementClick(this.connectUpdateNewButton);
  }

  async clickConnectWasmButton() {
    console.log('Find, scroll and click connect wasm button');
    await this.driver.findScrollToElementClick(this.connectWasmButton);
  }

  async clickSendErrorButton() {
    console.log('Find, scroll and click send error button');
    await this.driver.findScrollToElementClick(this.sendErrorButton);
  }

  async clickDialogsSnapConfirmationButton() {
    console.log('Click dialogs snap confirmation button');
    await this.driver.clickElement(this.dialogsSnapConfirmationButton);
  }

  async clickConnectBip32Button() {
    console.log('Find, scroll and click connect bip32 button');
    await this.driver.findScrollToElementClick(this.connectBip32Button);
  }

  async clickConnectBip44Button() {
    console.log('Find, scroll and click connect bip44 button');
    await this.driver.findScrollToElementClick(this.connectBip44Button);
  }

  async clickConnectClientStatusButton() {
    console.log('Find, scroll and click connect client status button');
    await this.driver.findScrollToElementClick(this.connectClientStatusButton);
  }

  async clickGetAccountButton() {
    console.log('Click get account button');
    await this.driver.clickElement(this.getAccountButton);
  }

  async clickSendInsightButton() {
    console.log('Click send insight button');
    await this.driver.clickElement(this.sendInsightButton);
  }

  async clickConnectDialogsButton() {
    console.log('Click connect dialogs button');
    await this.driver.clickElement(this.connectDialogsButton);
  }

  async clickGetPublicKeyBip32Button() {
    console.log('Click get public key button');
    await this.driver.clickElement(this.getPublicKeyButton);
  }

  async clickPublicKeyBip44Button() {
    console.log('Click get public key button');
    await this.driver.clickElement(this.publicKeyBip44Button);
  }

  async clickGetCompressedPublicKeyBip32Button() {
    console.log('Click get compressed public key button');
    await this.driver.clickElement(this.getCompressedKeyButton);
  }

  async clickConnectHomePage() {
    await this.driver.findScrollToElementClick(this.connectHomePage);
  }

  async clickConnectErrorsButton() {
    console.log('Click connect errors button');
    await this.driver.findScrollToElementClick(this.connectErrorsButton);
  }

  async clickConnectImagesButton() {
    console.log('Find, scroll and click connect images button');
    await this.driver.findScrollToElementClick(this.connectImagesButton);
  }

  async clickLifeCycleHooksButton() {
    console.log('Find, scroll and click connect life cycle hooks button');
    await this.driver.findScrollToElementClick(this.connectLifeCycleButton);
  }

  async clickNameLookupButton() {
    console.log('Find, scroll and click connect name lookup button');
    await this.driver.findScrollToElementClick(this.nameLookUpButton);
  }

  async clickTransactionInsightButton() {
    console.log('Find, scroll and click connect transaction insight button');
    await this.driver.findScrollToElementClick(
      this.connectTransactionInsightButton,
    );
  }

  async clickSubmitClientStatusButton() {
    console.log('Find, scroll and click submit client status button');
    await this.driver.findScrollToElementClick(this.submitClientStatusButton);
  }

  async fillWasmMessageAndSign(message: string) {
    console.log('Fill message in wasm');
    await this.driver.fill(this.inputWasm, message);
    await this.driver.clickElement(this.buttonSendWasmMessage);
  }

  async fillMessageAndSignSecp256k1(message: string) {
    console.log('Fill message in secp256k1');
    await this.driver.fill(this.inputMessageSecp256k1, message);
    await this.driver.clickElement(this.buttonMessageSecp256k1);
  }

  async fillMessageAndSignEd25519(message: string) {
    console.log('Fill message in ed25519');
    await this.driver.fill(this.inputMessageEd25519, message);
    await this.driver.clickElement(this.buttonSignEd25519Message);
  }

  async fillMessageAndSignEd25519Bip32(message: string) {
    console.log('Fill message in ed25519 bip32');
    await this.driver.fill(this.inputMessageEd25519Bip32, message);
    await this.driver.clickElement(this.buttonSignEd25519Bip32Message);
  }

  async fillBip44MessageAndSign(message: string) {
    console.log('Fill bip44 message ');
    await this.driver.pasteIntoField(this.inputMessageBip44, message);
    await this.driver.findScrollToElementClick(this.buttonSignBip44Message);
  }

  async scrollToSendEd25519() {
    console.log('Scroll to send ed25519');
    const sendEd25519 = await this.driver.findElement(this.inputMessageEd25519);
    await this.driver.scrollToElement(sendEd25519);
  }

  async check_installationComplete(selector: string, expectedMessage: string) {
    console.log('Check Installation Complete');
    await this.driver.waitForSelector({
      css: selector,
      text: expectedMessage,
    });
  }

  async check_installedSnapsResult(expectedMessage: string) {
    console.log('Check installed snaps result section on the top right');
    await this.driver.waitForSelector({
      css: this.installedSnapResultSpan,
      text: expectedMessage,
    });
  }

  async check_messageResultSpan(
    spanSelectorId: string,
    expectedMessage: string,
  ) {
    console.log('Check message result that is received');
    await this.driver.waitForSelector({
      css: spanSelectorId,
      text: expectedMessage,
    });
  }
}

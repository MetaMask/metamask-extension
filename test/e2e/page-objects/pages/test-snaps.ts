import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';

export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  private readonly connectDialogsSnapButton =
    '[data-testid="dialogs"] [data-testid="connect-button"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

  private readonly dialogConnectButton = {
    text: 'Connect',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly dialogConfirmButton = {
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly dialogOkButton = {
    text: 'OK',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly connectHomePage = '#connecthomepage';

  private readonly connectBip32 = '#connectbip32';

  private readonly connectBip44 = '#connectbip44';

  private readonly connectClientStatusButton = '#connectclient-status';

  private readonly submitClientStatusButton = '#sendClientStatusTest';

  private readonly reconnectButton = {
    css: '#connectbip32',
    text: 'Reconnect to BIP-32 Snap',
  };

  private readonly reconnectBip44Button = {
    css: '#connectbip44',
    text: 'Reconnect to BIP-44 Snap',
  };

  private readonly getPublicKeyButton = {
    css: '#bip32GetPublic',
    text: 'Get Public Key',
  };

  private readonly getCompressedKeyButton = {
    css: '#bip32GetCompressedPublic',
    text: 'Get Compressed Public Key',
  };

  private readonly publicKeyBip44Button = '#sendBip44Test';

  private readonly inputMessageEd25519 = '#bip32Message-ed25519';

  private readonly inputMessageEd25519Bip32 = '#bip32Message-ed25519Bip32';

  private readonly inputMessageSecp256k1 = '#bip32Message-secp256k1';

  private readonly buttonMessageSecp256k1 = '#sendBip32-secp256k1';

  private readonly buttonSignEd25519Message = '#sendBip32-ed25519';

  private readonly inputMessageBip44 = '#bip44Message';

  private readonly buttonSignBip44Message = '#signBip44Message';

  private readonly buttonSignEd25519Bip32Message = '#sendBip32-ed25519Bip32';

  private readonly statusResultSpan = '#clientStatusResult';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.installedSnapsHeader,
        this.connectBip32,
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
    await this.driver.scrollToElement(
      this.driver.findClickableElement(this.connectDialogsSnapButton),
    );
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElement(this.connectDialogsSnapButton);
  }

  async clickDialogsSnapConfirmationButton() {
    await this.driver.clickElement(this.dialogsSnapConfirmationButton);
  }

  async clickConnectBip32() {
    console.log('Wait, scroll and click connect button');
    await this.driver.scrollToElement(
      this.driver.findClickableElement(this.connectBip32),
    );
    await this.driver.delay(largeDelayMs);
    await this.driver.waitForSelector(this.connectBip32);
    await this.driver.clickElement(this.connectBip32);
  }

  async clickConnectBip44() {
    console.log('Wait, scroll and click connect button');
    await this.driver.scrollToElement(
      this.driver.findClickableElement(this.connectBip44),
    );
    await this.driver.delay(largeDelayMs);
    await this.driver.waitForSelector(this.connectBip44);
    await this.driver.clickElement(this.connectBip44);
  }

  async clickConnectClientStatus() {
    console.log('Click connect client status button');
    await this.driver.clickElement(this.connectClientStatusButton);
  }

  async clickGetPublicKeyButton() {
    console.log('Wait and click get public key button');
    await this.driver.waitForSelector(this.getPublicKeyButton);
    await this.driver.clickElement(this.getPublicKeyButton);
  }

  async clickPublicKeyBip44Button() {
    console.log('Wait and click get public key button');
    await this.driver.waitForSelector(this.publicKeyBip44Button);
    await this.driver.clickElement(this.publicKeyBip44Button);
  }

  async clickGetCompressedPublicKeyButton() {
    console.log('Wait and click get compressed public key button');
    await this.driver.waitForSelector(this.getCompressedKeyButton);
    await this.driver.clickElement(this.getCompressedKeyButton);
  }

  async completeSnapInstallConfirmation() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    await this.driver.waitForSelector(this.dialogConnectButton);

    await this.driver.clickElement(this.dialogConnectButton);

    await this.driver.waitForSelector(this.dialogConfirmButton);

    await this.driver.clickElement(this.dialogConfirmButton);

    await this.driver.waitForSelector(this.dialogOkButton);

    await this.driver.clickElement(this.dialogOkButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  }

  async clickConnectHomePage() {
    // find and scroll to the homepage snap
    const connectHomePageButton = await this.driver.findElement(
      this.connectHomePage,
    );
    await this.driver.scrollToElement(connectHomePageButton);

    // added delay for firefox
    await this.driver.delayFirefox(1000);

    // wait for and click connect
    await this.driver.waitForSelector(this.connectHomePage);
    await this.driver.clickElement(this.connectHomePage);
  }

  async clickSubmitClientStatus() {
    console.log('Click send client status button');
    await this.driver.clickElement(this.submitClientStatusButton);
  }

  async fillMessageSecp256k1(message: string) {
    console.log('Wait and fill message in secp256k1');
    await this.driver.fill(this.inputMessageSecp256k1, message);
    await this.driver.clickElement(this.buttonMessageSecp256k1);
  }

  async fillMessageEd25519(message: string) {
    console.log('Wait and fill message in ed25519');
    await this.driver.waitForSelector(this.inputMessageEd25519);
    await this.driver.fill(this.inputMessageEd25519, message);
    await this.driver.clickElement(this.buttonSignEd25519Message);
  }

  async fillMessageEd25519Bip32(message: string) {
    console.log('Wait and fill message in ed25519 bip32');
    await this.driver.waitForSelector(this.inputMessageEd25519Bip32);
    await this.driver.fill(this.inputMessageEd25519Bip32, message);
    await this.driver.clickElement(this.buttonSignEd25519Bip32Message);
  }

  async fillBip44MessageAndSign(message: string) {
    console.log('Wait and enter bip44 message ');
    await this.driver.pasteIntoField(this.inputMessageBip44, message);
    const buttonSignBip44 = await this.driver.findElement(
      this.buttonSignBip44Message,
    );
    await this.driver.scrollToElement(buttonSignBip44);
    await this.driver.waitForSelector(this.buttonSignBip44Message);
    await this.driver.clickElement(this.buttonSignBip44Message);
  }

  async scrollToSendEd25519() {
    console.log('Scroll to send ed25519');
    const sendEd25519 = await this.driver.findElement(this.inputMessageEd25519);
    await this.driver.scrollToElement(sendEd25519);
  }

  async scrollToConnectClientStatus() {
    console.log('Scroll to Connect Client Status');
    const connectClientStatus = await this.driver.findElement(
      this.connectClientStatusButton,
    );
    await this.driver.scrollToElement(connectClientStatus);
  }

  async waitForReconnectButton() {
    console.log('Wait for reconnect button');
    await this.driver.waitForSelector(this.reconnectButton);
  }

  async waitForReconnectBip44Button() {
    console.log('Wait for reconnect button');
    await this.driver.waitForSelector(this.reconnectBip44Button);
  }
}

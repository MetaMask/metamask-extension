import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';
import SnapInstall from './dialog/snap-install';
import SnapInstallWarning from './dialog/snap-install-warning';

export class TestSnaps {
  driver: Driver;

  public readonly snapInstall;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

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

  constructor(driver: Driver) {
    this.driver = driver;
    this.snapInstall = new SnapInstall(driver);
  }

  async openPage() {
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  /**
   * Install a Snap with the given `connectButton` selector. This assumes a
   * button exists on the `test-snaps` page that will open a dialog to install
   * the Snap.
   *
   * @param connectButton - The selector for the button that will open the
   * dialog to install the Snap.
   * @param withWarning - Whether the installation will have a warning dialog,
   * e.g., in the case of entropy Snaps requiring special permissions.
   */
  async installSnap(connectButton: string, withWarning = false) {
    await this.driver.scrollToElement(
      this.driver.findClickableElement(connectButton),
    );

    await this.driver.delay(largeDelayMs);
    await this.driver.waitForSelector(connectButton);
    await this.driver.clickElement(connectButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.snapInstall.check_pageIsLoaded();
    await this.snapInstall.clickNextButton();

    // click confirm
    await this.snapInstall.clickConfirmButton();

    if (withWarning) {
      const snapInstallWarning = new SnapInstallWarning(this.driver);
      await snapInstallWarning.clickCheckboxPermission();
      await snapInstallWarning.clickConfirmButton();
    }

    await this.snapInstall.clickNextButton();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

    await this.driver.waitForSelector({
      css: connectButton,
      text: 'Reconnect',
    });
  }

  /**
   * Click a button with the given selector.
   *
   * @param selector - The selector for the button to click.
   * @returns A promise that resolves after the button is clicked.
   */
  async clickButton(selector: string) {
    console.log('Wait and click button');
    await this.driver.waitForSelector(selector);
    await this.driver.clickElement(selector);
  }

  /**
   * Paste a message into a field with the given selector.
   *
   * @param selector - The selector for the field to paste the message into.
   * @param message - The message to paste into the field.
   * @returns A promise that resolves after the message is pasted into the
   * field.
   */
  async pasteIntoField(selector: string, message: string) {
    await this.driver.pasteIntoField(selector, message);
  }

  /**
   * Click the approve button in the dialog window.
   *
   * @returns A promise that resolves after the approve button is clicked.
   */
  async approveDialog() {
    // Switch to approve window.
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    // Wait for and click on approve and wait for window to close.
    await this.driver.waitForSelector({
      text: 'Approve',
      tag: 'button',
    });
    await this.driver.clickElementAndWaitForWindowToClose({
      text: 'Approve',
      tag: 'button',
    });

    // Switch back to `test-snaps` page.
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  }

  async clickDialogsSnapConfirmationButton() {
    await this.driver.clickElement(this.dialogsSnapConfirmationButton);
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

  /**
   * Select an entropy source from the dropdown with the given ID.
   *
   * @param id - The ID of the dropdown.
   * @param name - The name of the entropy source to select.
   */
  async selectEntropySource(id: string, name: string) {
    console.log('Select entropy source');
    const selector = await this.driver.findElement(`#${id}-entropy-selector`);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(`#${id}-entropy-selector`);

    await this.driver.clickElement({
      text: name,
      css: `#${id}-entropy-selector option`,
    });
  }
}

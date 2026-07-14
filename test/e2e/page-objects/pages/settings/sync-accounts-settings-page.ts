import { Driver } from '../../../webdriver/driver';

const OTP_LENGTH = 6;

/**
 * Page object for Settings → Sync accounts (QrSync) flow.
 *
 * Selectors match `data-testid` values on sync-accounts components.
 */
class SyncAccountsSettingsPage {
  private readonly doneButton = '[data-testid="qr-sync-done-button"]';

  private readonly driver: Driver;

  private readonly loading = '[data-testid="qr-sync-loading"]';

  private readonly otpExpired = '[data-testid="qr-sync-otp-expired"]';

  private readonly otpFirstInput = '[data-testid="qr-sync-otp-input-0"]';

  private readonly page = '[data-testid="sync-accounts-page"]';

  private readonly passwordContinue =
    '[data-testid="qr-sync-password-continue"]';

  private readonly passwordInput = '[data-testid="qr-sync-password-input"]';

  private readonly qrCode = '[data-testid="qr-sync-qr-code"]';

  private readonly qrLoading = '[data-testid="qr-sync-qr-loading"]';

  private readonly success = '[data-testid="qr-sync-success"]';

  private readonly syncButton = '[data-testid="qr-sync-sync-button"]';

  private readonly qrSyncWalletRowId = (walletId: string) =>
    `[data-testid="qr-sync-wallet-row-${walletId}"]`;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.page);
  }

  async clickDone(): Promise<void> {
    await this.driver.clickElement(this.doneButton);
  }

  async confirmSync(): Promise<void> {
    await this.driver.clickElement(this.syncButton);
  }

  async enterOtp(otp: string): Promise<void> {
    if (otp.length !== OTP_LENGTH) {
      throw new Error(
        `QrSync OTP must be ${OTP_LENGTH} digits, received ${otp.length}`,
      );
    }

    await this.driver.waitForSelector(this.otpFirstInput);

    // Paste the full code into the first box so `handlePaste` → `writeDigits`
    // updates all digits in one React commit and triggers `submitOtp`.
    // Per-box `fill()` does not reliably fire controlled `onChange` events.
    await this.driver.pasteIntoField(this.otpFirstInput, otp);
  }

  async enterPassword(password: string): Promise<void> {
    await this.driver.fill(this.passwordInput, password, { retries: 3 });
    await this.driver.clickElement(this.passwordContinue);
  }

  async selectWalletRow(walletId: string): Promise<void> {
    await this.driver.clickElement(this.qrSyncWalletRowId(walletId));
  }

  async waitForLoadingStep(): Promise<void> {
    await this.driver.waitForSelector(this.loading);
  }

  async waitForOtpExpired(): Promise<void> {
    await this.driver.waitForSelector(this.otpExpired);
  }

  async waitForOtpScreen(): Promise<void> {
    await this.driver.waitForSelector(this.otpFirstInput);
  }

  async waitForPasswordScreen(): Promise<void> {
    await this.driver.waitForSelector(this.passwordInput);
  }

  async waitForQrCode(): Promise<void> {
    await this.driver.waitForSelector(this.qrLoading);
    await this.driver.waitForSelector(this.qrCode);
  }

  async waitForQrLoading(): Promise<void> {
    await this.driver.waitForSelector(this.qrLoading);
  }

  async waitForSuccess(): Promise<void> {
    await this.driver.waitForSelector(this.success);
  }

  async waitForSyncButton(): Promise<void> {
    await this.driver.waitForSelector(this.syncButton);
  }
}

export default SyncAccountsSettingsPage;

import { Driver } from '../../../webdriver/driver';

const OTP_LENGTH = 6;

/**
 * Page object for Settings → Sync accounts (QrSync) flow.
 *
 * Selectors match `data-testid` values on sync-accounts components.
 */
class SyncAccountsSettingsPage {
  private readonly backButton = '[data-testid="sync-accounts-back-button"]';

  private readonly doneButton = '[data-testid="qr-sync-done-button"]';

  private readonly driver: Driver;

  private readonly generateNewQrCodeButton =
    '[data-testid="qr-sync-generate-new-qr-code"]';

  private readonly loading = '[data-testid="qr-sync-loading"]';

  private readonly otpExpiredMessage = { text: 'Verification code expired' };

  private readonly otpFirstInput = '[data-testid="qr-sync-otp-input-0"]';

  private readonly page = '[data-testid="sync-accounts-page"]';

  private readonly passwordContinue =
    '[data-testid="qr-sync-password-continue"]';

  private readonly passwordInput = '[data-testid="qr-sync-password-input"]';

  private readonly qrCode = '[data-testid="qr-sync-qr-code"]';

  private readonly qrExpiredMessage = { text: 'QR code expired' };

  private readonly sessionExpiredErrorMessage = {
    text: 'This sync session expired. Start again to generate a new QR code.',
  };

  private readonly startWithNewQrCodeButton =
    '[data-testid="qr-sync-start-with-new-qr-code"]';

  private readonly success = '[data-testid="qr-sync-success"]';

  private readonly syncButton = '[data-testid="qr-sync-sync-button"]';

  private readonly qrSyncWalletRowId = (walletId: string) =>
    `[data-testid="qr-sync-wallet-row-${walletId}"]`;

  private readonly successWithSyncedCountsLocator = (
    walletCount: number,
    accountCount: number,
  ): string =>
    `[data-testid="qr-sync-success"][data-synced-wallet-count="${walletCount}"][data-synced-account-count="${accountCount}"]`;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(driver: Driver) {
    this.driver = driver;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async assertSuccessSyncedCounts(
    walletCount: number,
    accountCount: number,
  ): Promise<void> {
    await this.driver.waitForSelector(
      this.successWithSyncedCountsLocator(walletCount, accountCount),
    );
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.page);
  }

  async clickBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  async clickDone(): Promise<void> {
    await this.driver.clickElement(this.doneButton);
  }

  async clickGenerateNewQrCode(): Promise<void> {
    await this.driver.clickElement(this.generateNewQrCodeButton);
  }

  async clickStartWithNewQrCode(): Promise<void> {
    await this.driver.clickElement(this.startWithNewQrCodeButton);
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
    await this.driver.waitForSelector(this.otpExpiredMessage);
  }

  async waitForOtpScreen(): Promise<void> {
    await this.driver.waitForSelector(this.otpFirstInput);
  }

  async waitForPasswordScreen(): Promise<void> {
    await this.driver.waitForSelector(this.passwordInput);
  }

  async waitForQrCode(): Promise<void> {
    await this.driver.waitForSelector(this.qrCode);
  }

  async waitForQrExpiredMessage(): Promise<void> {
    await this.driver.waitForSelector(this.qrExpiredMessage);
  }

  async waitForSessionExpiredError(): Promise<void> {
    await this.driver.waitForSelector(this.sessionExpiredErrorMessage);
  }

  async waitForSuccess(): Promise<void> {
    await this.driver.waitForSelector(this.success);
  }

  async waitForSyncButton(): Promise<void> {
    await this.driver.waitForSelector(this.syncButton);
  }
}

export default SyncAccountsSettingsPage;

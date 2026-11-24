import { Driver } from '../../../webdriver/driver';

const OTP_LENGTH = 6;

const QR_PAYLOAD_REFRESH_TIMEOUT_MS = 10_000;

/**
 * Sync accounts (QrSync): password, QR, OTP, wallet selection, success.
 *
 * Screen: `#/sync-accounts`, reached from
 * `SettingsPage.goToSyncAccountsSettings`.
 * Owns: sync page shell, password continue, QR code and payload, OTP entry,
 * wallet rows, sync/done/back, and success / expiry assertions.
 * Boundaries: QR sync flow only. Backup-and-sync toggles belong to
 * `BackupAndSyncSettings`.
 * Related: `SettingsPage`, `BackupAndSyncSettings`.
 *
 * @see ui/pages/settings/sync-accounts/sync-accounts-settings.tsx
 * @see ui/pages/settings/sync-accounts/sync-accounts-tab.tsx
 */
class SyncAccountsSettingsPage {
  private readonly backButton = '[data-testid="sync-accounts-back-button"]';

  private readonly doneButton = '[data-testid="qr-sync-done-button"]';

  private readonly driver: Driver;

  private readonly loading = '[data-testid="qr-sync-loading"]';

  private readonly otpExpiredMessage = {
    text: 'This code expired. Get a new QR code to try again.',
  };

  private readonly otpInput = '[data-testid="qr-sync-otp-input"]';

  private readonly otpTryAgainButton = '[data-testid="qr-sync-otp-try-again"]';

  private readonly otpVerifying = '[data-testid="qr-sync-otp-verifying"]';

  private readonly page = '[data-testid="parent-selector-sync-accounts-page"]';

  private readonly passwordContinue =
    '[data-testid="qr-sync-password-continue"]';

  private readonly passwordInput = '[data-testid="qr-sync-password-input"]';

  private readonly qrCode = '[data-testid="qr-sync-qr-code"]';

  private readonly qrPayload = '[data-testid="qr-sync-qr-payload"]';

  private readonly qrPayloadToggle =
    '[data-testid="qr-sync-toggle-qr-payload"]';

  private readonly qrSyncWalletRowId = (walletId: string) =>
    `[data-testid="qr-sync-wallet-row-${walletId}"]`;

  private readonly sessionExpiredErrorMessage = {
    text: 'This sync session expired. Start again to generate a new QR code.',
  };

  private readonly success = '[data-testid="qr-sync-success"]';

  private readonly successWithSyncedCountsLocator = (
    walletCount: number,
    accountCount: number,
  ): string =>
    `[data-testid="qr-sync-success"][data-synced-wallet-count="${walletCount}"][data-synced-account-count="${accountCount}"]`;

  private readonly syncButton = '[data-testid="qr-sync-sync-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

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
    await this.driver.clickElementAndWaitToDisappear(this.backButton);
  }

  async clickDone(): Promise<void> {
    await this.driver.clickElement(this.doneButton);
  }

  /**
   * Clicks the "Get new code" button shown once the verification code expired.
   */
  async clickGetNewCode(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.otpTryAgainButton);
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

    // The input is a transparent overlay above the digit cells, so Selenium
    // never treats it as visible. Send keys to it directly instead of using
    // helpers (`clickElement`, `fill`, `pasteIntoField`) that wait for
    // visibility.
    const input = await this.driver.findElement(this.otpInput);
    await input.sendKeys(otp);
  }

  async enterPassword(password: string): Promise<void> {
    await this.driver.fill(this.passwordInput, password, { retries: 3 });
    await this.driver.clickElement(this.passwordContinue);
  }

  /**
   * Reveals and returns the raw QR payload. Only available in development and
   * test builds.
   *
   * @returns The text encoded in the QR code.
   */
  async getQrPayload(): Promise<string> {
    await this.driver.clickElement(this.qrPayloadToggle);
    const payload = await this.driver.findElement(this.qrPayload);
    return payload.getText();
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
    await this.driver.waitForSelector(this.otpInput);
  }

  /**
   * Waits for the verifying status shown on the verification code step after
   * the code is submitted, while the wallet's sync offer is pending.
   */
  async waitForOtpVerifying(): Promise<void> {
    await this.driver.waitForSelector(this.otpVerifying);
  }

  async waitForPasswordScreen(): Promise<void> {
    await this.driver.waitForSelector(this.passwordInput);
  }

  async waitForQrCode(): Promise<void> {
    await this.driver.waitForSelector(this.qrCode);
  }

  /**
   * Waits until the displayed QR payload differs from `previousPayload`, which
   * means the expired session was replaced by a new one.
   *
   * @param previousPayload - The payload read before the session expired.
   */
  async waitForQrPayloadToChange(previousPayload: string): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const payload = await this.driver.findElement(this.qrPayload);
        return (await payload.getText()) !== previousPayload;
      },
      { interval: 250, timeout: QR_PAYLOAD_REFRESH_TIMEOUT_MS },
    );
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

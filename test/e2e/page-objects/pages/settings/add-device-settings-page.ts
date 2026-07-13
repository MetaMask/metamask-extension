import { Driver } from '../../../webdriver/driver';

const OTP_LENGTH = 6;

/**
 * Page object for Settings → Add device (QrSync) flow.
 *
 * Selectors match `data-testid` values on add-device-tab components.
 */
class AddDeviceSettingsPage {
  private readonly doneButton = '[data-testid="qr-sync-done-button"]';

  private readonly driver: Driver;

  private readonly loading = '[data-testid="qr-sync-loading"]';

  private readonly otpExpired = '[data-testid="qr-sync-otp-expired"]';

  private readonly passwordContinue =
    '[data-testid="qr-sync-password-continue"]';

  private readonly passwordInput = '[data-testid="qr-sync-password-input"]';

  private readonly qrCode = '[data-testid="qr-sync-qr-code"]';

  private readonly qrLoading = '[data-testid="qr-sync-qr-loading"]';

  private readonly success = '[data-testid="qr-sync-success"]';

  private readonly syncButton = '[data-testid="qr-sync-sync-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickDone(): Promise<void> {
    console.log('Clicking QrSync done button');
    await this.driver.clickElement(this.doneButton);
  }

  async confirmSync(): Promise<void> {
    console.log('Confirming QrSync wallet selection');
    await this.driver.clickElement(this.syncButton);
  }

  async enterOtp(otp: string): Promise<void> {
    if (otp.length !== OTP_LENGTH) {
      throw new Error(
        `QrSync OTP must be ${OTP_LENGTH} digits, received ${otp.length}`,
      );
    }

    console.log('Entering QrSync OTP');
    for (let index = 0; index < OTP_LENGTH; index += 1) {
      await this.driver.fill(
        `[data-testid="qr-sync-otp-input-${index}"]`,
        otp[index],
        { retries: 3 },
      );
    }
  }

  async enterPassword(password: string): Promise<void> {
    console.log('Entering QrSync password');
    await this.driver.fill(this.passwordInput, password, { retries: 3 });
    await this.driver.clickElement(this.passwordContinue);
  }

  async selectWalletRow(walletOrGroupId: string): Promise<void> {
    console.log(`Selecting QrSync wallet row ${walletOrGroupId}`);
    await this.driver.clickElement(
      `[data-testid="qr-sync-wallet-row-${walletOrGroupId}"]`,
    );
  }

  async waitForLoading(): Promise<void> {
    console.log('Waiting for QrSync loading step');
    await this.driver.waitForSelector(this.loading);
  }

  async waitForOtpExpired(): Promise<void> {
    console.log('Waiting for QrSync OTP expired message');
    await this.driver.waitForSelector(this.otpExpired);
  }

  async waitForOtpScreen(): Promise<void> {
    console.log('Waiting for QrSync OTP screen');
    await this.driver.waitForSelector('[data-testid="qr-sync-otp-input-0"]');
  }

  async waitForPasswordScreen(): Promise<void> {
    console.log('Waiting for QrSync password screen');
    await this.driver.waitForSelector(this.passwordInput);
  }

  async waitForQrCode(): Promise<void> {
    console.log('Waiting for QrSync QR code');
    await this.driver.waitForSelector(this.qrLoading);
    await this.driver.waitForSelector(this.qrCode);
  }

  async waitForQrLoading(): Promise<void> {
    console.log('Waiting for QrSync QR loading state');
    await this.driver.waitForSelector(this.qrLoading);
  }

  async waitForSuccess(): Promise<void> {
    console.log('Waiting for QrSync success screen');
    await this.driver.waitForSelector(this.success);
  }

  async waitForSyncButton(): Promise<void> {
    console.log('Waiting for QrSync wallet sync button');
    await this.driver.waitForSelector(this.syncButton);
  }
}

export default AddDeviceSettingsPage;

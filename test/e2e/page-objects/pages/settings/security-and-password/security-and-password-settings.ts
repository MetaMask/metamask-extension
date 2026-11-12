import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Security and password.
 *
 * Screen: `#/settings/security-and-password`, reached from
 * `SettingsPage.goToSecurityAndPasswordSettings` or
 * `flows/settings.flow.ts` `navigateToSecurityAndPassword`.
 * Owns: entry points to manage wallet recovery, change password, auto-lock and
 * the passkey toggle.
 * Boundaries: the security tab only. Its sub-pages belong to
 * `ManageWalletRecoverySettings`, `ChangePasswordPage`, `AutoLockSettings`,
 * `RegisterPasskeySettings` and `TurnOffPasskeySettings`.
 * Related: `SettingsPage`, `flows/settings.flow.ts`.
 *
 * @see ui/pages/settings/security-and-password-tab/security-and-password-tab.tsx
 */
class SecurityAndPasswordSettings {
  private readonly autoLockButton = '[data-testid="auto-lock-button"]';

  private readonly changePasswordButton =
    '[data-testid="change-password-button"]';

  private readonly driver: Driver;

  private readonly manageWalletRecoveryButton =
    '[data-testid="reveal-seed-words"]';

  private readonly passkeySettingsRow =
    '[data-testid="security-passkey-settings-row"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Security and password settings page is loaded');
    await this.driver.waitForSelector(this.manageWalletRecoveryButton);
  }

  async checkPasskeyRowIsDisplayed(): Promise<void> {
    console.log('Check passkey settings row is displayed');
    await this.driver.waitForSelector(this.passkeySettingsRow);
  }

  async clickPasskeyToggle(): Promise<void> {
    console.log('Click passkey toggle in settings');
    await this.driver.clickElement(this.passkeySettingsRow);
  }

  async openAutoLockSettings(): Promise<void> {
    console.log('Open auto-lock settings');
    await this.driver.clickElement(this.autoLockButton);
  }

  async openChangePassword(): Promise<void> {
    console.log('Open change password');
    await this.driver.clickElement(this.changePasswordButton);
  }

  async openManageWalletRecovery(): Promise<void> {
    console.log('Open manage wallet recovery');
    // The e2e clicks the button too quickly, before the component checks if
    // there are multiple SRPs.
    await this.driver.delay(1000);
    await this.driver.clickElement(this.manageWalletRecoveryButton);
  }
}

export default SecurityAndPasswordSettings;

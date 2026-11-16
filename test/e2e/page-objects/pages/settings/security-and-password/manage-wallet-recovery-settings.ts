import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Security and password → Manage wallet recovery: the SRP list.
 *
 * Screen: `#/settings/security-and-password/manage-wallet-recovery`, reached
 * from `SecurityAndPasswordSettings.openManageWalletRecovery`.
 * Owns: the list of Secret Recovery Phrases, the accounts under each one, and
 * selecting one to reveal.
 * Boundaries: the list only. Revealing the selected SRP belongs to
 * `RevealSrpPage`.
 * Related: `SecurityAndPasswordSettings`, `RevealSrpPage`,
 * `flows/settings.flow.ts` `openRevealSrp`.
 *
 * @see ui/pages/settings/security-and-password-tab/manage-wallet-recovery-sub-page.tsx
 * @see ui/components/app/reveal-srp-list/reveal-srp-list.tsx
 */
class ManageWalletRecoverySettings {
  private readonly driver: Driver;

  private readonly srpList = '[data-testid="select-srp-container"]';

  private readonly srpListItem = '.select-srp__container';

  private readonly srpListItemByIndex = (srpIndex: number) => ({
    css: this.srpListItem,
    text: `Secret Recovery Phrase ${srpIndex.toString()}`,
  });

  private readonly srpShowAccountsButtonByIndex = (srpIndex: number) =>
    `[data-testid="srp-list-show-accounts-${srpIndex - 1}"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check that an account belongs to a given SRP in the SRP list.
   *
   * @param options - Options for the verification.
   * @param options.accountName - The name of the account expected under the SRP.
   * @param options.srpIndex - The 1-based index of the Secret Recovery Phrase.
   */
  async checkAccountBelongsToSrp({
    accountName,
    srpIndex,
  }: {
    accountName: string;
    srpIndex: number;
  }): Promise<void> {
    console.log(
      `Check that account ${accountName} belongs to Secret Recovery Phrase ${srpIndex}`,
    );
    if (srpIndex < 1) {
      throw new Error('SRP index must be > 0');
    }

    await this.driver.waitForSelector(this.srpListItemByIndex(srpIndex));
    await this.driver.clickElement(this.srpShowAccountsButtonByIndex(srpIndex));

    await this.driver.waitUntil(
      async () => {
        try {
          const selectedSrp = await this.driver.findElement(
            this.srpListItemByIndex(srpIndex),
          );
          await this.driver.findNestedElement(selectedSrp, {
            text: accountName,
            tag: 'p',
          });
          return true;
        } catch {
          return false;
        }
      },
      { interval: 500, timeout: this.driver.timeout },
    );
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Manage wallet recovery settings page is loaded');
    await this.driver.waitForSelector(this.srpList);
  }

  /**
   * Select a Secret Recovery Phrase to reveal it.
   *
   * @param srpIndex - The 1-based index of the Secret Recovery Phrase.
   */
  async selectSrp(srpIndex: number = 1): Promise<void> {
    console.log(`Select Secret Recovery Phrase ${srpIndex}`);
    await this.driver.clickElement(this.srpListItemByIndex(srpIndex));
  }
}

export default ManageWalletRecoverySettings;

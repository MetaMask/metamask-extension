import { Driver } from '../../../webdriver/driver';

/**
 * Basic Functionality migration modal shown over home for social-login users.
 *
 * Screen: modal layered over home after social onboarding or unlock when
 * `basicFunctionalityMigrationNotification` is `modal`.
 * Owns: accept control that dismisses the modal.
 * Boundaries: stops at this modal. Home and settings navigation belong to
 * those page objects and flows.
 * Related: `importWalletWithSocialLoginOnboardingFlow`.
 *
 * @see ui/components/app/basic-functionality-migration-modal/basic-functionality-migration-modal.tsx
 */
class BasicFunctionalityMigrationModal {
  private readonly acceptButton = {
    testId: 'basic-functionality-migration-modal-accept',
  };

  private driver: Driver;

  private readonly migrationModal = {
    testId: 'basic-functionality-migration-modal',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async acceptAndClose(): Promise<void> {
    console.log('Accept and close basic functionality migration modal');
    await this.driver.clickElementAndWaitToDisappear(this.acceptButton);
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.migrationModal);
    console.log('Basic functionality migration modal is loaded');
  }
}

export default BasicFunctionalityMigrationModal;

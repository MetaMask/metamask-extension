import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import Confirmation from './confirmation';

/**
 * Contract-deployment transaction confirmation on the redesigned confirm
 * screen.
 *
 * Screen: `#/confirmation` for `deployContract` approvals.
 * Owns: "Deploy a contract" heading and site-wants-deploy copy checks.
 * Boundaries: inherits footer/nav from `Confirmation`. Gas modal overlays
 * remain `GasFeeModal`. Send/approve-specific info belongs to
 * `TransactionConfirmation` subclasses.
 * Related: `Confirmation`, `TransactionConfirmation`, `GasFeeModal`.
 *
 * @see ui/pages/confirmations/components/confirm/title/title.tsx
 * @see ui/pages/confirmations/components/confirm/info/base-transaction-info/base-transaction-info.tsx
 */
class ContractDeploymentConfirmation extends Confirmation {
  private deploymentHeadingTitle: RawLocator;

  private deploymentSiteInfo: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.deploymentHeadingTitle = {
      css: 'h2',
      text: 'Deploy a contract' as string,
    };

    this.deploymentSiteInfo = {
      css: 'p',
      text: 'This site wants you to deploy a contract',
    };
  }

  async checkDeploymentSiteInfo() {
    await this.driver.waitForSelector(this.deploymentSiteInfo);
  }

  async checkTitle() {
    await this.driver.waitForSelector(this.deploymentHeadingTitle);
  }
}

export default ContractDeploymentConfirmation;

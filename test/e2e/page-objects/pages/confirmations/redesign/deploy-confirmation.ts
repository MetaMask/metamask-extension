import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

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

  async checkTitle() {
    await this.driver.waitForSelector(this.deploymentHeadingTitle);
  }

  async checkDeploymentSiteInfo() {
    await this.driver.waitForSelector(this.deploymentSiteInfo);
  }
}

export default ContractDeploymentConfirmation;

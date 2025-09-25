import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

class ContractDeploymentConfirmation extends Confirmation {
  private deploymentHeadingTitle: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.deploymentHeadingTitle = {
      css: 'h2',
      text: 'Deploy a contract' as string,
    };
  }

  async checkTitle() {
    await this.driver.waitForSelector(this.deploymentHeadingTitle);
  }
}

export default ContractDeploymentConfirmation;

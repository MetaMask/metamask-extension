import { Driver } from '../../../webdriver/driver';

class NetworkSwitchModalConfirmation {
  private driver: Driver;

  private readonly submitButton = '[data-testid="confirmation-submit-button"]';

  private readonly addNetworkMessage = {
    text: 'Want to add this network?',
    tag: 'h3',
  };

  private readonly seeDetailsButton = { tag: 'a', text: 'See details' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addNetworkMessage,
        this.submitButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for add network confirmation modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add network confirmation modal is loaded');
  }

  async clickApproveButton(): Promise<void> {
    console.log('Click Approve Button');
    await this.driver.clickElementAndWaitToDisappear(this.submitButton);
  }

  async check_networkInformationIsDisplayed({
    currencySymbol,
    networkURL,
    chainId,
    networkName,
    blockExplorerURL,
  }: {
    currencySymbol: string;
    networkURL: string;
    chainId: string;
    networkName: string;
    blockExplorerURL: string;
  }): Promise<void> {
    console.log(
      'Check network information is correctly displayed on network switch modal',
    );
    await this.driver.waitForMultipleSelectors([
      { text: networkURL, tag: 'dd' },
      { text: currencySymbol, tag: 'dd' },
    ]);
    await this.driver.clickElement(this.seeDetailsButton);
    await this.driver.waitForMultipleSelectors([
      { text: chainId, tag: 'dd' },
      { text: networkName, tag: 'dd' },
      { text: blockExplorerURL, tag: 'dd' },
    ]);
  }
}

export default NetworkSwitchModalConfirmation;

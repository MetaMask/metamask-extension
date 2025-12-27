import { Driver } from '../../../webdriver/driver';

class PreinstalledExampleSettings {
  private readonly driver: Driver;

  private readonly settingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly snapRenderPanel = '.snap-ui-renderer__panel';

  private readonly toggleButton = '.toggle-button';

  private readonly toggleButtonOn = '.toggle-button--on';

  private readonly settingsDropdown = '[data-testid="snaps-dropdown"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.snapRenderPanel,
        this.settingsPageTitle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Pre-installed example settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Pre-installed example Settings page is loaded');
  }

  async clickToggleButtonOn(): Promise<void> {
    console.log('Toggling Setting on');
    await this.driver.clickElement(this.toggleButton);
    await this.driver.waitForSelector(this.toggleButtonOn);
  }

  async selectRadioOption(option: string): Promise<void> {
    console.log(`Selecting option: ${option} radio button`);
    await this.driver.clickElement({ text: option, tag: `label` });
  }

  async selectDropdownOption(option: string): Promise<void> {
    console.log(`Selecting option: ${option} from dropdown`);
    await this.driver.clickElement(this.settingsDropdown);
    await this.driver.clickElement({ text: option, tag: `option` });
  }

  async checkIsToggleOn(): Promise<void> {
    console.log('Checking if the toggle is on');
    await this.driver.waitForSelector(`${this.toggleButton}--on`);
  }

  async checkSelectedRadioOption(option: string): Promise<void> {
    console.log(`Checking if the radio option "${option}" is selected`);
    return this.driver.waitUntil(
      async () => {
        const radioOption = await this.driver.findElement(
          `input[type="radio"][value="${option}"]`,
        );
        return (await radioOption.getAttribute('checked')) === 'true';
      },
      { timeout: this.driver.timeout, interval: 500 },
    );
  }

  async checkSelectedDropdownOption(option: string): Promise<void> {
    console.log(`Checking if the dropdown option "${option}" is selected`);
    return this.driver.waitUntil(
      async () => {
        const dropdownOption = await this.driver.findElement(
          `option[value="${option}"]`,
        );
        return (await dropdownOption.getAttribute('selected')) === 'true';
      },
      { timeout: this.driver.timeout, interval: 500 },
    );
  }
}

export default PreinstalledExampleSettings;

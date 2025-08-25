import { Driver } from '../../../webdriver/driver';

class PreinstalledExampleSettings {
  private readonly driver: Driver;

  private readonly settingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly snapRenderPanel = '.snap-ui-renderer__panel';

  private readonly toggleButton = '.toggle-button';

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

  async checkSelectedRadioOption(option: string): Promise<boolean> {
    console.log(`Checking if the radio option "${option}" is selected`);
    const radioOption = await this.driver.findElement(
      `input[type="radio"][id="${option}"]`,
    );
    const isChecked = (await radioOption.getAttribute('checked')) === 'true';
    return isChecked;
  }

  async checkSelectedDropdownOption(option: string): Promise<void> {
    console.log(`Checking if the dropdown option "${option}" is selected`);
    await this.driver.waitForSelector({
      css: this.settingsDropdown,
      text: option,
    });
  }
}

export default PreinstalledExampleSettings;

import { Driver } from '../../../webdriver/driver';

class SnapInteractiveDialog {
  private driver: Driver;
  private readonly exampleCheckbox = { tag: 'span', text: 'Checkbox' };
  private readonly exampleDropdown = '[data-testid="snaps-dropdown"]';
  private readonly exampleInput = '#example-input';
  private readonly interactiveUITitle = {
    text: 'Interactive UI Example Snap',
    tag: 'p',
  };
  private readonly exampleSelectorDropdown = '[data-testid="snap-ui-renderer-card"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.interactiveUITitle,
        this.exampleInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap Interactive UI dialog to load',
        e,
      );
      throw e;
    }
    console.log('Snap Interactive UI dialog is loaded');
  }

  async clickButton(buttonName: string) {
    console.log(`Clicking button ${buttonName}`);
    await this.driver.clickElement({ text: buttonName, tag: 'button' });
  }

  async fillMessage(message: string) {
    console.log(`Filling message in example field`);
    await this.driver.fill(this.exampleInput, message);
  }

  async selectDropDownOption(exampleDropName: string, option: string) {
    console.log(`Select dropdown option`);
    if (exampleDropName === 'selector') {
      console.log(`Select selector dropdown option`);
      await this.driver.clickElement(this.exampleSelectorDropdown);
      await this.driver.clickElement({ text: option, css: '[data-testid="snap-ui-renderer-card"]' });
    } else {
      await this.driver.clickElement(this.exampleDropdown);
      await this.driver.clickElement({ text: option, tag: `option` });
    }

  }

  async selectRadioOption(option: string) {
    console.log(`Select radio option`);
    await this.driver.clickElement({ text: option, tag: `label` });
  }

  async selectCheckbox() {
    console.log(`Select checkbox`);
    await this.driver.clickElement(this.exampleCheckbox);
  }

  async check_optionSelected() {
    console.log(`Check all the option is selected appear`);
    await this.driver.waitForSelector({ text: 'foo bar', css: '#snap-ui-renderer-panel' });
    await this.driver.waitForSelector({ text: 'option2', css: '#snap-ui-renderer-panel'  });
    await this.driver.waitForSelector({ text: 'option1', css: '#snap-ui-renderer-panel' });
    await this.driver.waitForSelector({ text: 'option3', css: '#snap-ui-renderer-panel'  });
    await this.driver.waitForSelector({ text: 'true', css: '#snap-ui-renderer-panel'  });
  }
}

export default SnapInteractiveDialog;

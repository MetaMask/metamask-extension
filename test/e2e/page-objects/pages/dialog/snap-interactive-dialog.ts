import { Json } from '@metamask/utils';
import { Driver } from '../../../webdriver/driver';
import { strict as assert } from 'assert';

const selectors = {
  exampleDropdown: '[data-testid="snaps-dropdown"]',
  exampleInput: '#example-input',
  interactiveUITitle: {
      text: 'Interactive UI Example Snap',
      tag: 'p',
    },
  exampleSelectorDropdown: '[data-testid="snap-ui-renderer-card"]',
  rendererPanel: '#snap-ui-renderer-panel',
  selectorButton: '.mm-button-base--size-md',
  exampleCheckbox: '.mm-checkbox__input',
} satisfies Record<string, Json>

class SnapInteractiveDialog {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        selectors.interactiveUITitle,
        selectors.exampleInput,
      ]);
    } catch (e: string) {
      console.log(
        'Timed out while waiting for Snap Interactive UI dialog to load',
        e,
      );
      throw e;
    }
    console.log('Snap Interactive UI dialog is loaded');
  }

  async clickButton(buttonName: string) {
    console.log(`Clicking button with the name: "${buttonName}"`);
    await this.driver.clickElement({ text: buttonName, tag: 'span' });
  }

  async fillMessage(message: string) {
    console.log(`Filling message in example input`);
    await this.driver.fill(selectors.exampleInput, message);
  }

  async selectDropDownOption(exampleDropName: string, option: string) {
    console.log(`Select dropdown option`);
    if (exampleDropName === 'selector') {
      await this.driver.clickElement(selectors.exampleSelectorDropdown);
      await this.driver.clickElement({ text: option, css: selectors.exampleSelectorDropdown });
    } else {
      await this.driver.clickElement(selectors.exampleDropdown);
      await this.driver.clickElement({ text: option, tag: `option` });
    }
  }

  async scrollToSelectorDropDown() {
    const selector = await this.driver.findElement(
      selectors.exampleSelectorDropdown,
    );
    await this.driver.scrollToElement(selector);
  }

  async selectRadioOption(option: string) {
    console.log(`Selecting radio option: "${option}"`);
    await this.driver.clickElement({ text: option, tag: `label` });
  }

  async selectCheckbox() {
    console.log(`Select checkbox`);
    await this.driver.clickElement(selectors.exampleCheckbox);
  }

  async check_optionSelected() {
    console.log(`Check all the option is selected appear`);
    await this.driver.waitForSelector({ text: 'foo bar', css: selectors.rendererPanel });
    await this.driver.waitForSelector({ text: 'option2', css: selectors.rendererPanel });
    await this.driver.waitForSelector({ text: 'option1', css: selectors.rendererPanel });
    await this.driver.waitForSelector({ text: 'option3', css: selectors.rendererPanel });
    await this.driver.waitForSelector({ text: 'true', css: selectors.rendererPanel });
  }

  async checkElementDisabled(element: keyof typeof selectors) {
    console.log(`Check if ${element} is disabled`);
    const elementDisabled = await this.driver.findElement(
      selectors[element],
    );
    assert.equal(await elementDisabled.isEnabled(), false);
  }
}

export default SnapInteractiveDialog;

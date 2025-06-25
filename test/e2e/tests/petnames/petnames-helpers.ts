import { Driver } from '../../webdriver/driver';

export default class Petnames {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async expectName(expectedValue: string, isSaved: boolean): Promise<void> {
    const containerClass = isSaved ? 'name__saved' : 'name__missing';
    const valueClass = isSaved ? 'name__name' : 'name__value';

    await this.driver.findElement({
      css: `.${containerClass} .${valueClass}`,
      text: expectedValue,
    });
  }

  async clickName(value: string): Promise<void> {
    await this.driver.clickElement({
      css: `.name`,
      text: value,
    });
  }

  async saveName(
    value: string,
    name?: string,
    proposedName?: string,
  ): Promise<void> {
    await this.clickName(value);
    await this.driver.clickElement('.form-combo-field');

    if (proposedName) {
      await this.driver.clickElement({
        css: '.form-combo-field__option-primary',
        text: proposedName,
      });
    }

    if (name) {
      const input = await this.driver.findElement('.form-combo-field input');
      await input.sendKeys(name);
      // Pressing enter before saving is needed for Firefox to get the dropdown to go away.
      await input.sendKeys(this.driver.Key.ENTER);
    }

    await this.driver.clickElement({ text: 'Save', tag: 'button' });
  }

  async expectProposedNames(
    value: string,
    options: [string, string][],
  ): Promise<void> {
    await this.clickName(value);
    await this.driver.clickElement('.form-combo-field');

    for (const option of options) {
      await this.driver.findElement({
        css: '.form-combo-field__option-primary',
        text: option[0],
      });

      await this.driver.findElement({
        css: '.form-combo-field__option-secondary',
        text: option[1],
      });
    }
  }
}

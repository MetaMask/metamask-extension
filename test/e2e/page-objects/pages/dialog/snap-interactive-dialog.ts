import { strict as assert } from 'assert';
import { DateTime } from 'luxon';
import { Driver } from '../../../webdriver/driver';

const selectors = {
  exampleDropdown: '[data-testid="snaps-dropdown"]',
  exampleInput: '#example-input',
  interactiveUITitle: {
    text: 'Interactive UI Example Snap',
    tag: 'p',
  },
  exampleSelectorDropdown: '.snap-ui-renderer__selector',
  selectorItem: '.snap-ui-renderer__selector-item',
  rendererPanel: '.snap-ui-renderer__panel',
  exampleCheckbox: '.mm-checkbox__input',
  exampleDateTimePicker: '.snap-ui-renderer__date-time-picker--datetime',
  exampleDatePickerContainer: '.snap-ui-renderer__date-time-picker--date',
  exampleTimePicker: '.snap-ui-renderer__date-time-picker--time',
  dateTimePickerInput: '.snap-ui-renderer__date-time-picker--datetime input',
  datePickerInput: '.snap-ui-renderer__date-time-picker--date input',
  timePickerInput: '.snap-ui-renderer__date-time-picker--time input',
} satisfies Record<string, string | Record<string, string>>;

class SnapInteractiveDialog {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        selectors.interactiveUITitle,
        selectors.exampleInput,
      ]);
    } catch (e: unknown) {
      console.log(
        'Timed out while waiting for Snap Interactive UI dialog to load',
        e,
      );
      throw e;
    }
    console.log('Snap Interactive UI dialog is loaded');
  }

  async clickSubmitButton() {
    console.log(`Clicking submit button`);
    await this.driver.clickElement({ text: 'Submit', tag: 'span' });
  }

  async clickCancelButton() {
    console.log(`Clicking cancel button`);
    await this.driver.clickElementAndWaitForWindowToClose({
      text: 'Cancel',
      tag: 'span',
    });
  }

  async clickOKButton() {
    console.log(`Clicking OK button`);
    await this.driver.clickElementAndWaitForWindowToClose({
      text: 'OK',
      tag: 'span',
    });
  }

  async fillMessage(message: string) {
    console.log(`Filling message in example input`);
    await this.driver.fill(selectors.exampleInput, message);
  }

  /**
   * Types digits into a MUI v6 picker input. The input is readonly so
   * driver.fill() cannot be used — click to focus, then sendKeys() directly.
   *
   * @param containerSelector - Selector for the picker container (for scrolling).
   * @param inputSelector - Selector for the readonly `<input>` element.
   * @param digits - Zero-padded digit string (e.g. "0415" not "415").
   */
  async #typeIntoPickerInput(
    containerSelector: string,
    inputSelector: string,
    digits: string,
  ) {
    const container = await this.driver.findElement(containerSelector);
    await this.driver.scrollToElement(container);
    await this.driver.clickElement(inputSelector);
    const inputEl = await this.driver.findElement(inputSelector);
    await inputEl.sendKeys(digits);
  }

  /**
   * Fills the DateTimePicker with a date/time in the previous month.
   * A previous-month date is used so the value stays within the
   * `disableFuture` constraint.
   *
   * @param day - Day of the month to select.
   * @param hour - Hour to select (0–23).
   * @param minute - Minute to select (0–59).
   * @returns ISO string of the selected date-time.
   */
  async selectInDateTimePicker(day: number, hour: number, minute: number) {
    const prevMonthDate = DateTime.now().minus({ months: 1 });
    const digits =
      String(prevMonthDate.month).padStart(2, '0') +
      String(day).padStart(2, '0') +
      String(prevMonthDate.year) +
      String(hour).padStart(2, '0') +
      String(minute).padStart(2, '0');

    await this.#typeIntoPickerInput(
      selectors.exampleDateTimePicker,
      selectors.dateTimePickerInput,
      digits,
    );

    return prevMonthDate
      .set({ day, hour, minute, second: 0, millisecond: 0 })
      .toISO();
  }

  async selectInTimePicker(hour: number, minute: number) {
    const digits =
      String(hour).padStart(2, '0') + String(minute).padStart(2, '0');

    await this.#typeIntoPickerInput(
      selectors.exampleTimePicker,
      selectors.timePickerInput,
      digits,
    );

    return DateTime.now()
      .set({ hour, minute, second: 0, millisecond: 0 })
      .toISO();
  }

  async selectInDatePicker(day: number) {
    const prevMonthDate = DateTime.now().minus({ months: 1 });
    const digits =
      String(prevMonthDate.month).padStart(2, '0') +
      String(day).padStart(2, '0') +
      String(prevMonthDate.year);

    await this.#typeIntoPickerInput(
      selectors.exampleDatePickerContainer,
      selectors.datePickerInput,
      digits,
    );

    return prevMonthDate
      .set({ day, hour: 0, minute: 0, second: 0, millisecond: 0 })
      .toISO();
  }

  async selectDropDownOption(exampleDropName: string, option: string) {
    console.log(`Selecting selector option: "${option}"`);
    if (exampleDropName === 'selector') {
      await this.driver.clickElement(selectors.exampleSelectorDropdown);
      await this.driver.clickElement({
        text: option,
        css: selectors.selectorItem,
      });
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
    console.log(`Selecting checkbox`);
    await this.driver.clickElement(selectors.exampleCheckbox);
  }

  async checkResult({
    dateTimePickerDate,
    datePickerDate,
    timePickerDate,
  }: {
    dateTimePickerDate: string;
    datePickerDate: string;
    timePickerDate: string;
  }) {
    console.log(`Checking that all the selected options appear in the result`);
    await this.driver.waitForSelector({
      text: 'foo bar',
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: 'option2',
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: 'option1',
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: 'option3',
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: 'true',
      css: selectors.rendererPanel,
    });

    await this.driver.waitForSelector({
      text: dateTimePickerDate,
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: datePickerDate,
      css: selectors.rendererPanel,
    });
    await this.driver.waitForSelector({
      text: timePickerDate,
      css: selectors.rendererPanel,
    });
  }

  async checkElementIsDisabled(elementToCheck: keyof typeof selectors) {
    console.log(`Checking if ${elementToCheck} is disabled`);
    const element = await this.driver.findElement(selectors[elementToCheck]);
    assert.equal(await element.isEnabled(), false);
  }
}

export default SnapInteractiveDialog;

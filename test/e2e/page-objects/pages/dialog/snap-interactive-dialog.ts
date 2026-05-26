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
  dateTimePickerField: '.snap-ui-renderer__date-time-picker--datetime',
  datePickerField: '.snap-ui-renderer__date-time-picker--date',
  timePickerField: '.snap-ui-renderer__date-time-picker--time',
  pickerDialogOk: '.MuiDialogActions-root button:last-child',
  pickerPrevMonthArrow:
    '.MuiPickersCalendarHeader-root .MuiPickersArrowSwitcher-root button:first-child',
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
   * Opens a MUI v5 mobile picker dialog by clicking its read-only field.
   *
   * @param containerSelector - Selector for the picker wrapper (for scrolling).
   * @param fieldSelector - Selector for the `<div role="textbox">` element.
   */
  async #openPickerDialog(
    containerSelector: string,
    fieldSelector: string,
  ): Promise<void> {
    const container = await this.driver.findElement(containerSelector);
    await this.driver.scrollToElement(container);
    await this.driver.clickElement(fieldSelector);
    await this.driver.waitForSelector('.MuiDialog-root');
  }

  /**
   * Navigates the calendar inside an open MUI v5 picker dialog to the
   * previous month and clicks the specified day.
   *
   * @param day - Day of the month to select (1–31).
   */
  async #selectCalendarDay(day: number): Promise<void> {
    await this.driver.clickElement(selectors.pickerPrevMonthArrow);
    await this.driver.waitForElementToStopMoving(
      '.MuiDayPicker-slideTransition',
    );
    await this.driver.clickElement({
      text: String(day),
      css: '.MuiPickersDay-root:not(.MuiPickersDay-hiddenDaySpacingFiller)',
    });
  }

  /**
   * Clicks an hour on the MUI v5 analog clock (24h mode) via `clickPoint`
   * so the event lands on the transparent mask that handles selection.
   * Hour 0 is displayed as "00"; all others display without zero-padding.
   *
   * @param hour - Hour to select (0–23).
   */
  async #selectClockHour(hour: number): Promise<void> {
    const label = hour === 0 ? '00' : String(hour);
    await this.driver.clickPoint(
      { text: label, tag: 'span', css: '.MuiClockNumber-root' },
      1,
      1,
    );
    await this.driver.delay(300);
  }

  /**
   * Clicks a minute on the MUI v5 analog clock via `clickPoint`.
   * Minutes are always zero-padded (e.g. "05", "30", "00").
   *
   * @param minute - Minute to select (must be a multiple of 5: 0, 5, 10, …, 55).
   */
  async #selectClockMinute(minute: number): Promise<void> {
    const label = String(minute).padStart(2, '0');
    await this.driver.clickPoint(
      { text: label, tag: 'span', css: '.MuiClockNumber-root' },
      1,
      1,
    );
    await this.driver.delay(300);
  }

  /**
   * Confirms the current picker selection by clicking "OK".
   */
  async #confirmPicker(): Promise<void> {
    await this.driver.clickElement(selectors.pickerDialogOk);
    await this.driver.delay(200);
  }

  /**
   * Selects a date and time in the MobileDateTimePicker dialog.
   * Opens the dialog, navigates to the previous month, clicks the day,
   * then selects hour and minute on the analog clock, and confirms.
   *
   * @param day - Day of the month to select.
   * @param hour - Hour to select (0–23).
   * @param minute - Minute to select (0–59, rounded to nearest 5 on clock face).
   * @returns ISO string of the selected date-time.
   */
  async selectInDateTimePicker(day: number, hour: number, minute: number) {
    const prevMonthDate = DateTime.now().minus({ months: 1 });

    await this.#openPickerDialog(
      selectors.exampleDateTimePicker,
      selectors.dateTimePickerField,
    );
    await this.#selectCalendarDay(day);
    await this.#selectClockHour(hour);
    await this.#selectClockMinute(minute);
    await this.#confirmPicker();

    return prevMonthDate
      .set({ day, hour, minute, second: 0, millisecond: 0 })
      .toISO();
  }

  /**
   * Selects a time in the MobileTimePicker dialog.
   * Opens the dialog, selects hour and minute on the analog clock, and confirms.
   *
   * @param hour - Hour to select (0–23).
   * @param minute - Minute to select (0–59, rounded to nearest 5 on clock face).
   * @returns ISO string of the selected time (today's date).
   */
  async selectInTimePicker(hour: number, minute: number) {
    await this.#openPickerDialog(
      selectors.exampleTimePicker,
      selectors.timePickerField,
    );
    await this.#selectClockHour(hour);
    await this.#selectClockMinute(minute);
    await this.#confirmPicker();

    return DateTime.now()
      .set({ hour, minute, second: 0, millisecond: 0 })
      .toISO();
  }

  /**
   * Selects a date in the MobileDatePicker dialog.
   * Opens the dialog, navigates to the previous month, clicks the day, and confirms.
   *
   * @param day - Day of the month to select.
   * @returns ISO string of the selected date.
   */
  async selectInDatePicker(day: number) {
    const prevMonthDate = DateTime.now().minus({ months: 1 });

    await this.#openPickerDialog(
      selectors.exampleDatePickerContainer,
      selectors.datePickerField,
    );
    await this.#selectCalendarDay(day);
    await this.#confirmPicker();

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

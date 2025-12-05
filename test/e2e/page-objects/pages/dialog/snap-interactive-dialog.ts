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
  exampleDatePicker: '.snap-ui-renderer__date-time-picker--date',
  exampleTimePicker: '.snap-ui-renderer__date-time-picker--time',
  datePickerCalendarContainer: '.MuiPickersSlideTransition-transitionContainer',
  datePickerPreviousMonthButton: '.MuiPickersCalendarHeader-iconButton',
  datePickerDayButton: '.MuiPickersDay-day',
  timePickerHourButton: '.MuiPickersClockNumber-clockNumber',
  dateTimePickerOkButton:
    '.MuiPickersModal-withAdditionalAction > button:nth-child(3)',
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

  async selectInDateTimePicker(day: number, hour: number, minute: number) {
    await this.driver.clickElement(selectors.exampleDateTimePicker);

    await this.selectDateInPicker(day);
    await this.selectTimeInPicker(hour, minute);
    await this.driver.clickElement(selectors.dateTimePickerOkButton);

    return DateTime.now()
      .minus({ months: 1 })
      .set({
        day,
        hour,
        minute,
        second: 0,
        millisecond: 0,
      })
      .toISO();
  }

  async selectInTimePicker(hour: number, minute: number) {
    await this.driver.clickElement(selectors.exampleTimePicker);

    await this.selectTimeInPicker(hour, minute);

    await this.driver.clickElement(selectors.dateTimePickerOkButton);

    return DateTime.now()
      .set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      })
      .toISO();
  }

  async selectInDatePicker(day: number) {
    await this.driver.clickElement(selectors.exampleDatePicker);

    await this.selectDateInPicker(day);

    await this.driver.clickElement(selectors.dateTimePickerOkButton);

    return DateTime.now()
      .minus({ months: 1 })
      .set({
        day,

        second: 0,
        millisecond: 0,
      })
      .toISO();
  }

  async selectDateInPicker(day: number) {
    await this.driver.clickElement(selectors.datePickerPreviousMonthButton);
    await this.driver.waitForElementToStopMoving(
      selectors.datePickerCalendarContainer,
    );

    await this.driver.clickElement({
      xpath: `//button[span[p[contains(text(), "${day}")]]]`,
    });
  }

  async selectTimeInPicker(hours: number, minutes: number) {
    console.log(`Selecting time in picker: ${hours}:${minutes}`);

    const hourText = await this.driver.findElement({
      text: `${hours}`,
      tag: 'span',
      css: selectors.timePickerHourButton,
    });

    // We need to use actions here because the hour and minute selection is made
    // by dragging the clock hand, or clicking the mask behind the numbers.
    await this.driver.driver
      .actions()
      .move({ origin: hourText, x: 1, y: 1 })
      .click()
      .perform();

    const minutesText = await this.driver.findElement({
      text: `${minutes}`,
      tag: 'span',
      css: selectors.timePickerHourButton,
    });

    // We need to use actions here because the hour and minute selection is made
    // by dragging the clock hand, or clicking the mask behind the numbers.
    await this.driver.driver
      .actions()
      .move({ origin: minutesText, x: 1, y: 1 })
      .click()
      .perform();
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

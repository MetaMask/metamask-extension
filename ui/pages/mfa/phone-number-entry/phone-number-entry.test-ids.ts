/**
 * The test ids a `PhoneNumberEntry` renders, derived from its `testIdPrefix`.
 *
 * @param prefix - The `testIdPrefix` passed to the component.
 * @returns The ids, for tests and E2E.
 */
export const getPhoneNumberEntryTestIds = (prefix: string) => ({
  INPUT: `${prefix}-input`,
  COUNTRY_SELECT: `${prefix}-country-select`,
  DISCLAIMER: `${prefix}-disclaimer`,
  INVALID: `${prefix}-invalid`,
  ERROR: `${prefix}-error`,
  SUBMIT_BUTTON: `${prefix}-submit-button`,
});

export const DEFAULT_PHONE_NUMBER_ENTRY_TEST_ID_PREFIX = 'phone-number-entry';

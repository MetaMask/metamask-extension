/**
 * Shared helpers for mocking `useSelector` inside batch-sell unit tests.
 *
 * Tests that use these helpers must already have a `jest.mock('react-redux', …)`
 * at the top of the file that replaces `useSelector` with a `jest.fn()`.
 */

/**
 * Seeds a `useSelector` mock for components that call `getCurrentCurrency`
 * then `getIntlLocale` (in that order) on consecutive selector invocations.
 *
 * Call this inside `beforeEach` or at the start of individual tests.  It
 * resets the mock first so that earlier calls do not bleed across tests.
 *
 * @param mockUseSelector - The jest.Mock replacing `useSelector`.
 * @param currency - The currency string to return for `getCurrentCurrency`.
 * @param locale - The locale string to return for `getIntlLocale`.
 */
export function seedCurrencyLocaleSelectors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSelector: jest.Mock<any, any>,
  currency = 'USD',
  locale = 'en-US',
): void {
  mockUseSelector.mockReset();
  mockUseSelector
    .mockReturnValueOnce(currency as never)
    .mockReturnValueOnce(locale as never);
}

/**
 * Configures `useSelector` to pass every selector through an empty state
 * object (`{}`).  This is the standard pattern used by hook tests that mock
 * individual selectors at module level and then invoke them via `useSelector`.
 *
 * Unlike `seedCurrencyLocaleSelectors`, this does *not* reset the mock first,
 * so it can be composed with other per-test `mockReturnValue` overrides in
 * `beforeEach`.
 *
 * @param mockUseSelector - The jest.Mock replacing `useSelector`.
 */
export function mockUseSelectorPassthrough(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSelector: jest.Mock<any, any>,
): void {
  mockUseSelector.mockImplementation(
    (selectorFn: (state: unknown) => unknown) => selectorFn({}),
  );
}

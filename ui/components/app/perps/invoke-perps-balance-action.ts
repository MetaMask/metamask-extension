/** Handler from perps triggers (e.g. deposit / withdraw); may return a Promise. */
export type PerpsBalanceActionHandler = () => void | Promise<unknown>;

/**
 * Runs an optional UI callback that may be sync or async. If it returns a
 * rejected promise, the failure is logged so it does not surface as an
 * unhandled rejection (e.g. event handlers cannot be `async` in all call sites).
 */
export function invokePerpsBalanceAction(
  callback?: PerpsBalanceActionHandler,
): void {
  void Promise.resolve(callback?.()).catch((error: unknown) => {
    console.error(error);
  });
}

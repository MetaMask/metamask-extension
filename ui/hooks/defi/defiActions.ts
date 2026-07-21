import { submitRequestToBackground } from '../../store/background-connection';

export type FetchDeFiPositionsOptions = {
  /**
   * When true, bypass the controller's minimum-interval throttle and fetch
   * immediately (e.g. user-initiated refresh).
   */
  forceRefresh?: boolean;
};

/**
 * Asks the `DeFiPositionsControllerV2` to fetch DeFi positions for the selected
 * account group and store them in state. Fire-and-forget: the UI reads the
 * resulting positions from state, not from this call's return value.
 *
 * The controller throttles repeated calls per set of accounts, so it is safe to
 * dispatch this whenever the user enters the DeFi tab. Pass
 * `{ forceRefresh: true }` to bypass that throttle (e.g. Refresh list).
 *
 * @param options - Optional fetch modifiers.
 * @param options.forceRefresh - When true, bypass the minimum-interval throttle.
 */
export async function fetchDeFiPositions(
  options?: FetchDeFiPositionsOptions,
): Promise<void> {
  await submitRequestToBackground(
    'fetchDeFiPositions',
    options ? [options] : [],
  );
}

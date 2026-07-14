import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Asks the `DeFiPositionsControllerV2` to fetch DeFi positions for the selected
 * account group and store them in state. Fire-and-forget: the UI reads the
 * resulting positions from state, not from this call's return value.
 *
 * The controller throttles repeated calls per set of accounts, so it is safe to
 * dispatch this whenever the user enters the DeFi tab.
 */
export async function fetchDeFiPositions(): Promise<void> {
  await submitRequestToBackground('fetchDeFiPositions', []);
}

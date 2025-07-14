import { MetaMaskReduxState } from '../../../app/scripts/metamask-controller';

type State = {
  appState: Partial<
    Pick<MetaMaskReduxState['appState'], 'onboardingErrorReport'>
  >;
};

/**
 * Retrieves the onboarding error report
 *
 * @param state - Redux state object.
 * @returns Error | null
 */
export function getOnboardingErrorReport(
  state: Pick<State, 'appState'>,
): Error | null {
  return state.appState.onboardingErrorReport || null;
}

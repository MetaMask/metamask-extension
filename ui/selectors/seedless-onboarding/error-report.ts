import { MetaMaskReduxState } from '../../store/store';

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
): State['appState']['onboardingErrorReport'] {
  return state.appState.onboardingErrorReport || null;
}

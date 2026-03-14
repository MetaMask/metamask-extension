/**
 * Minimal metamask state selectors with no dependency on store/actions or ducks/metamask.
 * Used to break the metamask.js ↔ actions.ts circular dependency.
 */
import { AlertTypes } from '../../shared/constants/alerts';
import { CHAIN_IDS } from '../../shared/constants/network';
import { getCurrentChainId } from '../../shared/lib/selectors/networks';
import type { MetaMaskReduxState } from '../store/store';

export const getAlertEnabledness = (
  state: MetaMaskReduxState,
): Record<string, boolean> => state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (
  state: MetaMaskReduxState,
): boolean => getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export function getCompletedOnboarding(state: MetaMaskReduxState): boolean {
  return state.metamask.completedOnboarding;
}

export function getIsMainnet(state: MetaMaskReduxState): boolean {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.MAINNET;
}

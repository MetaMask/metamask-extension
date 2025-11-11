import { ClaimsControllerState } from '@metamask/claims-controller';

export type ClaimsState = {
  metamask: ClaimsControllerState;
};

/**
 * Get the supported networks for claim.
 *
 * @param state - The state of the claims controller.
 * @returns The supported networks for claim.
 */
export function getSupportedNetworksForClaim(
  state: ClaimsState,
): `0x${string}`[] {
  return state.metamask.claimsConfigurations.supportedNetworks;
}

/**
 * Get the valid submission window days for claim.
 *
 * @param state - The state of the claims controller.
 * @returns The valid submission window days for claim.
 */
export function getValidSubmissionWindowDays(state: ClaimsState): number {
  return state.metamask.claimsConfigurations.validSubmissionWindowDays;
}

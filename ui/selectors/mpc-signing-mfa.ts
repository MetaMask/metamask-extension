type MpcSigningMfaState = {
  metamask: {
    pendingMpcSigningMfaRequestId?: string | null;
  };
};

/**
 * Id of the MPC signing MFA confirmation the background is waiting on.
 *
 * @param state - The UI state.
 * @returns The request id, or null when no confirmation is pending.
 */
export function selectPendingMpcSigningMfaRequestId(
  state: MpcSigningMfaState,
): string | null {
  return state.metamask.pendingMpcSigningMfaRequestId ?? null;
}

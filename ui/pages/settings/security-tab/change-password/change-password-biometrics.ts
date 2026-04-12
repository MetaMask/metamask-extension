export type ChangePasswordBiometricsToggleContext = {
  nextChecked: boolean;
  setEnableBiometrics: (value: boolean) => void;
};

/**
 * Updates only the biometrics preference for change password.
 * Does not clear a stored passkey assertion so the user can toggle off and on without re-WebAuthn.
 * Does not run WebAuthn or background passkey removal — those happen on initial gate or save.
 *
 * @param ctx - Toggle context from the change-password screen.
 */
export function applyChangePasswordBiometricsToggle(
  ctx: ChangePasswordBiometricsToggleContext,
): void {
  const { nextChecked, setEnableBiometrics } = ctx;
  setEnableBiometrics(nextChecked);
}

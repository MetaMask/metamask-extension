const ALREADY_CONFIRMED_SUBSTRING = 'Previous transaction is already confirmed';

/**
 * Maps a raw cancel/speed-up error message to a locale key
 * that provides a user-friendly description.
 *
 * @param errorMessage - The raw error message from the background.
 * @returns A locale key for the resolved description string.
 */
export function resolveCancelSpeedupErrorMessage(
  errorMessage: unknown,
): string {
  if (typeof errorMessage !== 'string') {
    return 'cancelSpeedupFailedDescription';
  }
  if (errorMessage.includes(ALREADY_CONFIRMED_SUBSTRING)) {
    return 'cancelSpeedupAlreadyConfirmedDescription';
  }
  return 'cancelSpeedupFailedDescription';
}

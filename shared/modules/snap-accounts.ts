///: BEGIN:ONLY_INCLUDE_IN(build-main)
/**
 * Compares the current date to a specific date in UTC.
 * This method is meant to be used in a specific case related to the
 * Snap Accounts API. It should not be used in other cases.
 * Note: Months are 0-indexed in JS, so 10 represents November
 *
 * @returns true if the current date is after the specified date, false otherwise.
 */
export function showSnapAccountExperimentalToggle(): boolean {
  const keyringSnapsAvailabilityDate =
    process.env.KEYRING_SNAPS_AVAILABILITY_DATE;
  if (!keyringSnapsAvailabilityDate) {
    return false;
  }

  return (
    new Date().getTime() > new Date(keyringSnapsAvailabilityDate).getTime()
  );
}
///: END:ONLY_INCLUDE_IN

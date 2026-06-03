import { getLatestCommit } from '../../git';

/**
 * Zip file entries use FAT timestamps. Standard zip timestamps must be in the
 * range 1980-01-01 through 2099-12-31.
 */
export const ZIP_MTIME_MINIMUM = Date.UTC(1980, 0, 1);
export const ZIP_MTIME_EXCLUSIVE_MAXIMUM = Date.UTC(2100, 0, 1);
export const ZIP_MTIME_DEFAULT = ZIP_MTIME_MINIMUM;

export const ZIP_MTIME_DESCRIPTION =
  'Modification time for all files in the zip, specified as a UNIX timestamp (milliseconds since 1 January 1970 UTC). This property sets a uniform modification time for the contents of the zip file. Note: Zip files use FAT file timestamps, which have a limited range. Therefore, datetimes before 1980-01-01 (timestamp value of 315532800000) are invalid in standard Zip files, and datetimes on or after 2100-01-01 (timestamp value of 4102444800000) are also invalid. Values must fall within this range.';

/**
 * Returns the shared JSON schema for zip entry mtime values.
 *
 * @returns The zip mtime JSON schema fragment.
 */
export function getZipMtimeSchema() {
  return {
    description: ZIP_MTIME_DESCRIPTION,
    type: 'number',
    minimum: ZIP_MTIME_MINIMUM,
    exclusiveMaximum: ZIP_MTIME_EXCLUSIVE_MAXIMUM,
    default: ZIP_MTIME_DEFAULT,
  } as const;
}

/**
 * Checks whether the given value can be used as a standard zip entry mtime.
 *
 * @param mtime - The timestamp to check.
 * @returns Whether the timestamp is valid.
 */
export function isValidZipMtime(mtime: number): boolean {
  return (
    Number.isFinite(mtime) &&
    mtime >= ZIP_MTIME_MINIMUM &&
    mtime < ZIP_MTIME_EXCLUSIVE_MAXIMUM
  );
}

/**
 * Validates and returns a zip entry mtime.
 *
 * @param mtime - The timestamp to validate.
 * @param optionName - The option name to include in error messages.
 * @returns The validated timestamp.
 */
export function validateZipMtime(
  mtime: number,
  optionName = 'zip mtime',
): number {
  if (isValidZipMtime(mtime)) {
    return mtime;
  }

  throw new Error(
    `Invalid ${optionName} value "${mtime}": expected a UNIX timestamp in milliseconds greater than or equal to ${ZIP_MTIME_MINIMUM} and less than ${ZIP_MTIME_EXCLUSIVE_MAXIMUM}`,
  );
}

/**
 * Returns a valid mtime, falling back to the earliest standard zip timestamp.
 *
 * @param mtime - The preferred timestamp.
 * @returns A valid zip mtime.
 */
export function getValidZipMtimeOrDefault(mtime: number): number {
  return isValidZipMtime(mtime) ? mtime : ZIP_MTIME_DEFAULT;
}

/**
 * Returns the default zip entry mtime.
 *
 * @returns The latest commit timestamp, or the earliest valid zip timestamp if
 * the commit timestamp is unavailable.
 */
export function getDefaultZipMtime(): number {
  return getValidZipMtimeOrDefault(getLatestCommit().timestamp());
}

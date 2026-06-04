import { getLatestCommit } from '../../git';

/**
 * Zip file entries use FAT timestamps. Standard zip timestamps must be in the
 * range 1980-01-01 through 2099-12-31.
 */
export const ZIP_MTIME_MINIMUM = Date.UTC(1980, 0, 1);
export const ZIP_MTIME_EXCLUSIVE_MAXIMUM = Date.UTC(2100, 0, 1);

/**
 * MetaMask's birthday.
 */
export const DEFAULT_ZIP_MTIME = Date.UTC(2016, 6, 14);

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
    default: DEFAULT_ZIP_MTIME,
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
 * @param label - The value label to include in error messages.
 * @returns The validated timestamp.
 */
export function validateZipMtime(
  mtime: number,
  label = 'zip mtime',
): number {
  if (isValidZipMtime(mtime)) {
    return mtime;
  }

  throw new Error(
    `Invalid ${label} value "${mtime}": expected a UNIX timestamp in milliseconds greater than or equal to ${ZIP_MTIME_MINIMUM} and less than ${ZIP_MTIME_EXCLUSIVE_MAXIMUM}`,
  );
}

/**
 * Resolves the default zip entry mtime.
 *
 * SOURCE_DATE_EPOCH is specified in seconds. Zip mtime values are represented
 * in milliseconds throughout this build tool.
 *
 * If SOURCE_DATE_EPOCH is not set, fall back to the timestamp of the latest commit.
 * If git is not available or there is no commit, fall back to the default zip
 * mtime (MetaMask's birthday).
 *
 * @returns The zip mtime in milliseconds.
 */
export function getDefaultZipMtime(): number {
  // Implement the SOURCE_DATE_EPOCH standard:
  // https://reproducible-builds.org/docs/source-date-epoch/
  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  if (sourceDateEpoch === undefined) {
    const fallbackMtime = getLatestCommit().timestamp();
    if (isValidZipMtime(fallbackMtime)) {
      return fallbackMtime;
    }
    return DEFAULT_ZIP_MTIME;
  }

  const epoch = Number(sourceDateEpoch);
  if (!Number.isInteger(epoch)) {
    throw new Error(
      `Invalid SOURCE_DATE_EPOCH value "${sourceDateEpoch}": expected a non-negative integer number of seconds since the Unix epoch`,
    );
  }

  const mtime = epoch * 1000;
  return validateZipMtime(mtime, 'SOURCE_DATE_EPOCH');
}

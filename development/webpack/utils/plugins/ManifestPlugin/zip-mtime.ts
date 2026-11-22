import { getLatestCommit } from '../../git';

/**
 * Zip file entries use FAT timestamps. Standard zip timestamps must be in the
 * range 1980-01-01 through 2099-12-31.
 */
export const ZIP_MTIME_MINIMUM = Date.UTC(1980, 0, 1);
export const ZIP_MTIME_EXCLUSIVE_MAXIMUM = Date.UTC(2100, 0, 1);
const ZIP_MTIME_MINIMUM_SECONDS = ZIP_MTIME_MINIMUM / 1000;
const ZIP_MTIME_EXCLUSIVE_MAXIMUM_SECONDS = ZIP_MTIME_EXCLUSIVE_MAXIMUM / 1000;

/**
 * MetaMask's birthday.
 */
export const DEFAULT_ZIP_MTIME = Date.UTC(2016, 6, 14);

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
  if (sourceDateEpoch.trim() === '' || !Number.isInteger(epoch) || epoch < 0) {
    throw new Error(
      `Invalid SOURCE_DATE_EPOCH value "${sourceDateEpoch}": expected a non-negative integer number of seconds since the Unix epoch`,
    );
  }

  const mtime = epoch * 1000;
  if (isValidZipMtime(mtime)) {
    return mtime;
  }

  throw new Error(
    `Invalid SOURCE_DATE_EPOCH value "${sourceDateEpoch}": expected a Unix timestamp in seconds greater than or equal to ${ZIP_MTIME_MINIMUM_SECONDS} and less than ${ZIP_MTIME_EXCLUSIVE_MAXIMUM_SECONDS}`,
  );
}

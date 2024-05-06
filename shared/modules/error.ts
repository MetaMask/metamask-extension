import log from 'loglevel';

/**
 * Type guard for determining whether the given value is an error object with a
 * `message` property, such as an instance of Error.
 *
 * TODO: Remove once this becomes available at @metamask/utils
 *
 * @param error - The object to check.
 * @returns True or false, depending on the result.
 */
export function isErrorWithMessage(
  error: unknown,
): error is { message: string } {
  return typeof error === 'object' && error !== null && (
    'message' in error
    || typeof (error as any)?.data?.cause?.message === 'string'
  );
}

export function logErrorWithMessage(error: unknown) {
  if (isErrorWithMessage(error)) {
    log.error((error as any)?.data?.cause?.message || error.message);
  } else {
    log.error(error);
  }
}

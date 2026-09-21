/**
 * Returns error without stack trace for better UI display
 *
 * @param err - error
 * @returns Error with clean stack trace.
 */
export default function cleanErrorStack(err: Error): Error {
  // `??` (not `||`) so an intentional blank `name` / `message` is preserved.
  const name = String(err.name ?? 'Error');
  const msg = String(err.message ?? '');

  if (name === '') {
    err.stack = err.message;
  } else if (msg === '') {
    err.stack = err.name;
  } else if (!err.stack) {
    err.stack = `${err.name}: ${err.message}`;
  }

  return err;
}

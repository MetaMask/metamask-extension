/**
 * Returns error without stack trace for better UI display.
 *
 * @param err - The error to clean.
 * @returns The same error instance with a cleaned stack trace.
 */
export default function cleanErrorStack(err: Error): Error {
  const { name: errName, message: errMessage } = err;

  const name = errName === undefined ? 'Error' : String(errName);
  const msg = errMessage === undefined ? '' : String(errMessage);

  if (name === '') {
    err.stack = err.message;
  } else if (msg === '') {
    err.stack = err.name;
  } else if (!err.stack) {
    err.stack = `${err.name}: ${err.message}`;
  }

  return err;
}


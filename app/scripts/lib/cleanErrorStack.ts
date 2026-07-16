/**
 * Returns error without stack trace for better UI display
 *
 * @param err - error
 * @returns Error with clean stack trace.
 */
export default function cleanErrorStack(err: Error): Error {
  const { name: errName, message: errMessage } = err;

  let name: string | undefined = errName;
  name = name === undefined ? 'Error' : String(name);

  let msg: string | undefined = errMessage;
  msg = msg === undefined ? '' : String(msg);

  if (name === '') {
    err.stack = err.message;
  } else if (msg === '') {
    err.stack = err.name;
  } else if (!err.stack) {
    err.stack = `${err.name}: ${err.message}`;
  }

  return err;
}

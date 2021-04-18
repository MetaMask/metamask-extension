/**
 * Returns error without stack trace for better UI display
 * @param {Error} err - error
 * @returns {Error} Error with clean stack trace.
 */
export default function cleanErrorStack(err) {
  let { name } = err;
  name = name === undefined ? 'Error' : String(name);

  let msg = err.message;
  msg = msg === undefined ? '' : String(msg);

  if (name === '') {
    err.stack = err.message;
  } else if (msg === '') {
    err.stack = err.name;
  } else {
    err.stack = `${err.name}: ${err.message}`;
  }

  return err;
}

/**
 * Returns error without stack trace for better UI display
 * @param {Error} err - error
 * @returns {Error} Error with clean stack trace.
 */
function cleanErrorStack (err) {
  var name = err.name
  name = (name === undefined) ? 'Error' : String(name)

  var msg = err.message
  msg = (msg === undefined) ? '' : String(msg)

  if (name === '') {
    err.stack = err.message
  } else if (msg === '') {
    err.stack = err.name
  } else {
    err.stack = err.name + ': ' + err.message
  }

  return err
}

module.exports = cleanErrorStack

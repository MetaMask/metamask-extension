/**
 * Parse a string as a port number. Non-integers or invalid ports will
 * result in an error being thrown.
 *
 * @param {String} portString - The string to parse as a port number
 * @returns {number} The parsed port number
 */
function parsePort(portString) {
  const port = Number(portString);
  if (!Number.isInteger(port)) {
    throw new Error(`Port '${portString}' is invalid; must be an integer`);
  } else if (port < 0 || port > 65535) {
    throw new Error(
      `Port '${portString}' is out of range; must be between 0 and 65535 inclusive`,
    );
  }
  return port;
}

module.exports = { parsePort };

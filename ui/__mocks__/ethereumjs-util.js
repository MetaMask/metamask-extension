// Vendored from @ethereumjs/util@8.1.0 / ethereumjs-util@7.1.5

/**
 * Converts a `Buffer` into a `0x`-prefixed hex `String`.
 *
 * @param buf - `Buffer` object to convert
 */
const bufferToHex = function (buf) {
  // buf = toBuffer(buf);
  return `0x${buf.toString('hex')}`;
};

/**
 * Returns a buffer filled with 0s.
 *
 * @param bytes - the number of bytes the buffer should be
 */
const zeros = function (bytes) {
  return Buffer.allocUnsafe(bytes).fill(0);
};

/**
 * Returns the zero address.
 */
const zeroAddress = function () {
  const addressLength = 20;
  const addr = zeros(addressLength);
  return bufferToHex(addr);
};

module.exports = {
  zeroAddress,
};

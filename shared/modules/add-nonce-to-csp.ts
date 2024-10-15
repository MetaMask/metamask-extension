/**
 * Adds a nonce value to the script-src directive of the Content-Security-Policy Header.
 *
 * @param header - the Content-Security-Policy Header
 * @param nonce - the nonce value to add
 * @returns the Content-Security-Policy Header with the nonce value added
 */
export const addNonceToCsp = (header: string, nonce: string) => {
  return header.replace(
    /(^|;[\t\n\f\r ]*)script-src([^;]*)/iu,
    (match) => `${match} 'nonce-${nonce}'`,
  );
};

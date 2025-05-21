const seedArr = crypto.getRandomValues(new Uint32Array(1));
// eslint-disable-next-line no-bitwise
let idCounter = seedArr[0] >>> 0;

/**
 * Generates a unique ID.
 *
 * @returns A unique random number
 */
export default function createRandomId(): number {
  // eslint-disable-next-line no-bitwise
  return (idCounter = (idCounter + 1) >>> 0);
}

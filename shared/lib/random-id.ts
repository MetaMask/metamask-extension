const MAX = Number.MAX_SAFE_INTEGER;

const seed = new Uint32Array(1);
crypto.getRandomValues(seed);
let idCounter = seed[0];

export default function createRandomId(): number {
  idCounter %= MAX;
  // eslint-disable-next-line no-plusplus
  return idCounter++;
}

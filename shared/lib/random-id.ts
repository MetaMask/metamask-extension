const MAX = Number.MAX_SAFE_INTEGER;

const seed = new BigUint64Array(1);
crypto.getRandomValues(seed);
let idCounter = Number(seed[0] % (BigInt(MAX) + 1n));

export default function createRandomId(): number {
  idCounter %= MAX;
  const id = idCounter;
  idCounter += 1;
  return id;
}

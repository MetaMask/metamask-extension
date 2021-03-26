const MAX = Number.MAX_SAFE_INTEGER;

let idCounter = Math.round(Math.random() * MAX);
export default function createRandomId() {
  idCounter %= MAX;
  // eslint-disable-next-line no-plusplus
  return idCounter++;
}

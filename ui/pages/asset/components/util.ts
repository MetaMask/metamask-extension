export const getPrecision = (price: number) => {
  let precision = 2;
  for (let p = Math.abs(price); p < 1; precision++) {
    p *= 10;
  }
  return precision;
};

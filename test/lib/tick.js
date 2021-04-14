export function tick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

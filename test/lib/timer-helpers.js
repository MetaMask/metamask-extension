export function tick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
export function flushPromises() {
  return new Promise(jest.requireActual('timers').setImmediate);
}

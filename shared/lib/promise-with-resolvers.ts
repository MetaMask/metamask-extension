// this polyfill can be removed once we drop support for Firefox v121 (after
// June 24 2025) Chrome v119 (after November 14, 2025). If you are removing
// this, you should also remove the types polyfill for it in types/global.d.ts
// and app/scripts/app-init.js
if (typeof Promise.withResolvers === 'undefined') {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new this<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};

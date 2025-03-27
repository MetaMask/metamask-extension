// this polyfill can be removed once we drop support for Firefox v121, Edge v119,
// and Chrome v119. If you are removing this, you should also remove the
// types polyfill for it in types/global.d.ts.

if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new this<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

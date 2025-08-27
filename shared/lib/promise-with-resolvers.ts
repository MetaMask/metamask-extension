// This ponyfill can be removed once we drop support for Firefox v121 (after
// June 24 2025) Chrome v119 (after November 14, 2025)
const withResolversPonyfill = <ReturnType>() => {
  let resolve!: (value: ReturnType | PromiseLike<ReturnType>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<ReturnType>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/**
 * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 *
 * @returns An object with the properties `promise`, `resolve`, and `reject`.
 *
 * ```ts
 * const { promise, resolve, reject } = Promise.withResolvers<T>();
 * ```
 */
export const withResolvers =
  typeof Promise.withResolvers === 'undefined'
    ? withResolversPonyfill
    : Promise.withResolvers.bind(Promise);

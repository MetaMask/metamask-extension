export type RetryOptions = {
    retries: number;
    delay?: number;
    rejectionMessage?: string;
    stopAfterOneFailure?: boolean;
};
/**
 * Re-runs the given function until it returns a resolved promise or the number
 * of retries is exceeded, whichever comes first (with an optional delay in
 * between retries).
 *
 * @param options - Retry options.
 * @param options.retries
 * @param options.delay
 * @param options.rejectionMessage
 * @param options.stopAfterOneFailure
 * @param functionToRetry - The function that is run and tested for failure.
 * @returns Resolves with the return value of `functionToRetry`, resolves with `null`
 * when `stopAfterOneFailure` is true and the function succeeds, or rejects when
 * retries are exhausted.
 */
export declare function retry<TResult>(options: RetryOptions & {
    stopAfterOneFailure?: false | undefined;
}, functionToRetry: () => Promise<TResult> | TResult): Promise<TResult>;
export declare function retry<TResult>(options: RetryOptions & {
    stopAfterOneFailure: true;
}, functionToRetry: () => Promise<TResult> | TResult): Promise<TResult | null>;

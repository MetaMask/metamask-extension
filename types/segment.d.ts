declare module '@segment/loosely-validate-event' {
  /**
   * Loosely validates a Segment event message.
   *
   * @param message - The event message to validate.
   * @param type - The type of the event (e.g. 'track', 'identify', 'page').
   * @throws {Error} If the message is invalid.
   */
  function looselyValidate(
    message: Record<string, unknown>,
    type: string,
  ): void;
  export = looselyValidate;
}

declare module 'remove-trailing-slash' {
  /**
   * Removes a trailing slash from a URL string.
   *
   * @param url - The URL string to process.
   * @returns The URL string without a trailing slash.
   */
  function removeTrailingSlash(url: string): string;
  export = removeTrailingSlash;
}

declare module 'is-retry-allowed' {
  /**
   * Determines if a request should be retried based on the error.
   *
   * @param error - The error to evaluate.
   * @returns `true` if the request should be retried, `false` otherwise.
   */
  function isRetryAllowed(error: Error): boolean;
  export = isRetryAllowed;
}

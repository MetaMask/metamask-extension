/**
 * Extracts the host from the given URL. This is useful for hiding API keys that
 * are contained directly in the URL.
 *
 * @param url - A URL.
 * @returns The host portion of the URL.
 */
export const onlyKeepHost = (url: string) => {
  return new URL(url).host;
};

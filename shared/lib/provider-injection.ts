/**
 * Determines if the provider should be injected
 *
 * @returns Whether the provider should be injected
 */
export default function shouldInjectProvider(): boolean {
  return (
    checkURLForProviderInjection(new URL(window.location.href)) &&
    checkDocumentForProviderInjection()
  );
}

/**
 * Checks if a given URL is eligible for provider injection.
 *
 * This function determines if a URL passes the suffix check and is not part of the blocked domains.
 *
 * @param url - The URL to be checked for injection.
 * @returns Returns `true` if the URL passes the suffix check and is not blocked, otherwise `false`.
 */
export function checkURLForProviderInjection(url: URL): boolean {
  return suffixCheck(url) && !blockedDomainCheck(url);
}

/**
 * Returns whether or not the extension (suffix) of the given URL's pathname is prohibited
 *
 * This checks the provided URL's pathname against a set of file extensions
 * that we should not inject the provider into.
 *
 * @param url - The URL to check
 * @param url.pathname
 * @returns whether or not the extension of the given URL's pathname is prohibited
 */
function suffixCheck({ pathname }: URL): boolean {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  for (const prohibitedType of prohibitedTypes) {
    if (prohibitedType.test(pathname)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the given domain is blocked
 *
 * @param url - The URL to check
 * @returns if the given domain is blocked
 */
function blockedDomainCheck(url: URL): boolean {
  // If making any changes, please also update the same list found in the MetaMask-Mobile & SDK repositories
  const blockedDomains = [
    'execution.consensys.io',
    'execution.metamask.io',
    'uscourts.gov',
    'dropbox.com',
    'webbyawards.com',
    'adyen.com',
    'gravityforms.com',
    'harbourair.com',
    'ani.gamer.com.tw',
    'blueskybooking.com',
    'sharefile.com',
    'battle.net',
    'accounts.google.com',
    'accounts.youtube.com',
    'appleid.apple.com',
  ];

  // Matching will happen based on the hostname, and path
  const blockedUrlPaths = [
    'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
  ];

  const { hostname: currentHostname, pathname: currentPathname } = url;

  const trimTrailingSlash = (str: string) =>
    str.endsWith('/') ? str.slice(0, -1) : str;

  return (
    blockedDomains.some(
      (blockedDomain) =>
        blockedDomain === currentHostname ||
        currentHostname.endsWith(`.${blockedDomain}`),
    ) ||
    blockedUrlPaths.some(
      (blockedUrlPath) =>
        trimTrailingSlash(blockedUrlPath) ===
        trimTrailingSlash(currentHostname + currentPathname),
    )
  );
}

/**
 * Checks if the document is suitable for provider injection by verifying the doctype and document element.
 *
 * @returns `true` if the document passes both the doctype and document element checks, otherwise `false`.
 */
export function checkDocumentForProviderInjection(): boolean {
  return doctypeCheck() && documentElementCheck();
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns if the doctype is html or if none exists
 */
function doctypeCheck(): boolean {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns if the documentElement is an html node or if none exists
 */
function documentElementCheck(): boolean {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

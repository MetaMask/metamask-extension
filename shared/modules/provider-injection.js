/**
 * Determines if the provider should be injected
 *
 * @returns {boolean} {@code true} Whether the provider should be injected
 */
export default function shouldInjectProvider() {
  return (
    doctypeCheck() &&
    suffixCheck() &&
    documentElementCheck() &&
    !blockedDomainCheck()
  );
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

/**
 * Checks if the current domain is blocked
 *
 * @returns {boolean} {@code true} if the current domain is blocked
 */
function blockedDomainCheck() {
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
  ];

  // Matching will happen based on the hostname, and path
  const blockedUrlPaths = [
    'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
  ];

  const { hostname: currentHostname, pathname: currentPathname } =
    window.location;

  const trimTrailingSlash = (str) =>
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

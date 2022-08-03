/* eslint-disable import/first */
import log from 'loglevel';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';

(() => {
  // need to make sure we aren't affected by overlapping namespaces
  // and that we dont affect the app with our namespace
  // mostly a fix for web3's BigNumber if AMD's "define" is defined...
  let __define;

  /**
   * Caches reference to global define object and deletes it to
   * avoid conflicts with other global define objects, such as
   * AMD's define function
   */
  const cleanContextForImports = () => {
    __define = global.define;
    try {
      global.define = undefined;
    } catch (_) {
      console.warn('MetaMask - global.define could not be deleted.');
    }
  };

  /**
   * Restores global define object from cached reference
   */
  const restoreContextAfterImports = () => {
    try {
      global.define = __define;
    } catch (_) {
      console.warn('MetaMask - global.define could not be overwritten.');
    }
  };

  cleanContextForImports();

  restoreContextAfterImports();

  log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

  //
  // setup plugin communication
  //

  if (shouldInjectProvider()) {
    // setup background connection
    const metamaskStream = new WindowPostMessageStream({
      name: 'metamask-inpage',
      target: 'metamask-contentscript',
    });

    initializeProvider({
      connectionStream: metamaskStream,
      logger: log,
      shouldShimWeb3: true,
    });
  }

  /**
   * Determines if the provider should be injected
   *
   * @returns {boolean} {@code true} Whether the provider should be injected
   */
  function shouldInjectProvider() {
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
    const blockedDomains = [
      'uscourts.gov',
      'dropbox.com',
      'webbyawards.com',
      'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
      'adyen.com',
      'gravityforms.com',
      'harbourair.com',
      'ani.gamer.com.tw',
      'blueskybooking.com',
      'sharefile.com',
    ];
    const currentUrl = window.location.href;
    let currentRegex;
    for (let i = 0; i < blockedDomains.length; i++) {
      const blockedDomain = blockedDomains[i].replace('.', '\\.');
      currentRegex = new RegExp(
        `(?:https?:\\/\\/)(?:(?!${blockedDomain}).)*$`,
        'u',
      );
      if (!currentRegex.test(currentUrl)) {
        return true;
      }
    }
    return false;
  }
})();

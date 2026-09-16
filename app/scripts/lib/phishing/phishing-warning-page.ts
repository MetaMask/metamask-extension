const ONE_SECOND_IN_MILLISECONDS = 1_000;

/**
 * Normalized phishing warning page URL (adds a trailing slash when missing).
 */
export const phishingPageUrl = new URL(
  process.env.PHISHING_WARNING_PAGE_URL as string,
);

export const phishingPageHref = phishingPageUrl.toString();

/** Timeout for initializing the phishing warning page iframe. */
export const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

/**
 * An error thrown if the phishing warning page takes too long to load.
 */
export class PhishingWarningPageTimeoutError extends Error {
  constructor() {
    super('Timeout failed');
  }
}

/**
 * Returns whether the given URL matches the hosted phishing warning page.
 *
 * @param url - URL to compare against the configured warning page.
 */
export function isPhishingWarningPageUrl(url: URL): boolean {
  return (
    url.origin === phishingPageUrl.origin &&
    url.pathname === phishingPageUrl.pathname
  );
}

/**
 * Load the phishing warning page temporarily to ensure the service worker has
 * registered, so that the warning page works offline.
 *
 * @param documentRoot - Document used to mount the temporary iframe.
 */
export async function loadPhishingWarningPage(
  documentRoot: Document = window.document,
): Promise<void> {
  let iframe: HTMLIFrameElement | undefined;
  try {
    const extensionStartupPhishingPageUrl = new URL(phishingPageHref);
    // The `extensionStartup` hash signals to the phishing warning page that it should not bother
    // setting up streams for user interaction. Otherwise this page load would cause a console
    // error.
    extensionStartupPhishingPageUrl.hash = '#extensionStartup';

    iframe = documentRoot.createElement('iframe');
    iframe.setAttribute('src', extensionStartupPhishingPageUrl.href);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    // Create "deferred Promise" to allow passing resolve/reject to event handlers
    let deferredResolve: () => void;
    let deferredReject: (error: Error) => void;
    const loadComplete = new Promise<void>((resolve, reject) => {
      deferredResolve = resolve;
      deferredReject = reject;
    });

    // The load event is emitted once loading has completed, even if the loading failed.
    // If loading failed we can't do anything about it, so we don't need to check.
    iframe.addEventListener('load', () => deferredResolve());

    // This step initiates the page loading.
    documentRoot.body.appendChild(iframe);

    // This timeout ensures that this iframe gets cleaned up in a reasonable
    // timeframe, and ensures that the "initialization complete" message
    // doesn't get delayed too long.
    setTimeout(
      () => deferredReject(new PhishingWarningPageTimeoutError()),
      PHISHING_WARNING_PAGE_TIMEOUT,
    );
    await loadComplete;
  } catch (error) {
    if (error instanceof PhishingWarningPageTimeoutError) {
      console.warn(
        'Phishing warning page timeout; page not guaranteed to work offline.',
      );
    } else {
      console.error('Failed to initialize phishing warning page', error);
    }
  } finally {
    iframe?.remove();
  }
}

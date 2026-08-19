/**
 * Browser-side MutationObserver used by homepage E2E to catch blocking error
 * toasts that auto-dismiss before a later assertion.
 *
 * Serialized into the page via WebDriver `executeScript`, so this function
 * must stay self-contained (no closed-over imports).
 */

type BlockingErrorToastWindow = Window & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mmE2eBlockingErrorToasts?: string[];
};

/**
 * Toasts recorded by {@link installBlockingErrorToastMonitor} on the current
 * document. Used by unit tests; E2E reads the same array via executeScript.
 *
 * @returns Recorded toast text, or an empty array if monitoring is not installed.
 */
export function getRecordedBlockingErrorToasts(): string[] {
  return (
    (window as BlockingErrorToastWindow).__mmE2eBlockingErrorToasts ?? []
  );
}

/**
 * Installs a MutationObserver that records blocking error toasts as they
 * appear. Idempotent on the current document.
 */
export function installBlockingErrorToastMonitor(): void {
  const win = window as BlockingErrorToastWindow;
  if (win.__mmE2eBlockingErrorToasts) {
    return;
  }
  win.__mmE2eBlockingErrorToasts = [];
  const matchText = /cryptocurrencies|unsupported/iu;
  const toastRootSelector =
    '.toast-container, .toasts-container, .toasts-container__banner-base, [data-testid="storage-error-toast"], [data-testid="survey-toast"]';

  function isMatch(el: Element): boolean {
    const testId = el.getAttribute('data-testid') || '';
    if (testId === 'storage-error-toast' || testId === 'survey-toast') {
      return true;
    }
    const isToastRoot =
      el.classList.contains('toast-container') ||
      el.classList.contains('toasts-container') ||
      el.classList.contains('toasts-container__banner-base');
    if (!isToastRoot) {
      return false;
    }
    return matchText.test(el.textContent || '');
  }

  function closestToastRoot(el: Element | null): Element | null {
    if (!el || typeof el.closest !== 'function') {
      return null;
    }
    return el.closest(toastRootSelector);
  }

  function collectCandidates(node: Node | null, candidates: Set<Element>) {
    if (!node) {
      return;
    }
    if (node instanceof Element) {
      if (node.querySelectorAll) {
        node.querySelectorAll(toastRootSelector).forEach((toastRoot) => {
          candidates.add(toastRoot);
        });
      }
      // react-hot-toast mounts an empty `.toast-container` after unlock, then
      // inserts the message as a child. Walk up so those additions are recorded.
      const toastRoot = closestToastRoot(node);
      if (toastRoot) {
        candidates.add(toastRoot);
      }
      return;
    }
    const toastRoot = closestToastRoot(node.parentElement);
    if (toastRoot) {
      candidates.add(toastRoot);
    }
  }

  function commit(candidates: Set<Element>) {
    candidates.forEach((el) => {
      if (isMatch(el) && win.__mmE2eBlockingErrorToasts) {
        win.__mmE2eBlockingErrorToasts.push((el.textContent || '').trim());
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    const candidates = new Set<Element>();
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((child) => {
        collectCandidates(child, candidates);
      });
    });
    commit(candidates);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  const initialCandidates = new Set<Element>();
  collectCandidates(document.documentElement, initialCandidates);
  commit(initialCandidates);
}

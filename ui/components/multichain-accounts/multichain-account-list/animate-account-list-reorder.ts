import { flushSync } from 'react-dom';

const ACCOUNT_LIST_FLIP_DURATION_MS = 280;
const ACCOUNT_LIST_FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * FLIP-animates account rows after a synchronous list reorder.
 *
 * Rows opt in with a `data-account-list-flip-id` attribute holding a stable id.
 * Uses the CSS `translate` property so it composes with VirtualizedList's
 * `transform: translateY(...)` positioning instead of overwriting it.
 *
 * @param update - Synchronous state update that reorders the list.
 */
export function animateAccountListReorder(update: () => void): void {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (process.env.IN_TEST || prefersReducedMotion) {
    update();
    return;
  }

  const firstTops = new Map<string, number>();
  document
    .querySelectorAll<HTMLElement>('[data-account-list-flip-id]')
    .forEach((node) => {
      const id = node.dataset.accountListFlipId;
      if (id) {
        firstTops.set(id, node.getBoundingClientRect().top);
      }
    });

  flushSync(update);

  document
    .querySelectorAll<HTMLElement>('[data-account-list-flip-id]')
    .forEach((node) => {
      const id = node.dataset.accountListFlipId;
      const firstTop = id === undefined ? undefined : firstTops.get(id);
      if (firstTop === undefined) {
        return;
      }

      const deltaY = firstTop - node.getBoundingClientRect().top;
      if (Math.abs(deltaY) < 1) {
        return;
      }

      node.style.transition = 'none';
      node.style.translate = `0 ${deltaY}px`;
      // Reading layout forces the inverted position to be committed before the
      // transition is switched back on, so the browser plays it.
      node.getBoundingClientRect();
      node.style.transition = `translate ${ACCOUNT_LIST_FLIP_DURATION_MS}ms ${ACCOUNT_LIST_FLIP_EASING}`;
      node.style.translate = '0 0';

      const cleanup = (event: TransitionEvent) => {
        if (event.propertyName !== 'translate') {
          return;
        }
        node.style.transition = '';
        node.style.translate = '';
        node.removeEventListener('transitionend', cleanup);
      };
      node.addEventListener('transitionend', cleanup);
    });
}

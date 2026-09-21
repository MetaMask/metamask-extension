// Firefox: [interestfor] hover → linked [popover] show/hide.

let installed = false;

export function installInterestForPolyfill() {
  if (typeof document === 'undefined' || installed) {
    return;
  }

  if ('interestForElement' in HTMLButtonElement.prototype) {
    return;
  }

  installed = true;

  document.addEventListener('mouseover', (event) => {
    const trigger = (event.target as Element | null)?.closest('[interestfor]');
    if (!trigger) {
      return;
    }

    const popoverId = trigger.getAttribute('interestfor');
    const popover = popoverId ? document.getElementById(popoverId) : null;
    if (popover instanceof HTMLElement) {
      popover.showPopover();
    }
  });

  document.addEventListener('mouseout', (event) => {
    const mouseEvent = event as MouseEvent;
    const { relatedTarget } = mouseEvent;

    const trigger = (mouseEvent.target as Element | null)?.closest(
      '[interestfor]',
    );
    if (trigger) {
      const popoverId = trigger.getAttribute('interestfor');
      const popover = popoverId ? document.getElementById(popoverId) : null;
      if (!(popover instanceof HTMLElement)) {
        return;
      }

      if (
        relatedTarget instanceof Node &&
        (trigger.contains(relatedTarget) || popover.contains(relatedTarget))
      ) {
        return;
      }

      popover.hidePopover();
      return;
    }

    const popover = (mouseEvent.target as Element | null)?.closest('[popover]');
    if (!(popover instanceof HTMLElement) || !popover.id) {
      return;
    }

    const linkedButton = document.querySelector(
      `[interestfor="${popover.id}"]`,
    );
    if (!linkedButton) {
      return;
    }

    if (
      relatedTarget instanceof Node &&
      (linkedButton.contains(relatedTarget) || popover.contains(relatedTarget))
    ) {
      return;
    }

    popover.hidePopover();
  });
}

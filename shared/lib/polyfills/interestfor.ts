// Firefox: button[interestfor] hover → linked [popover] show/hide.

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
    const button = (event.target as Element | null)?.closest(
      'button[interestfor]',
    );
    if (!button) {
      return;
    }

    const popoverId = button.getAttribute('interestfor');
    const popover = popoverId ? document.getElementById(popoverId) : null;
    if (popover instanceof HTMLElement) {
      popover.showPopover();
    }
  });

  document.addEventListener('mouseout', (event) => {
    const mouseEvent = event as MouseEvent;
    const { relatedTarget } = mouseEvent;

    const button = (mouseEvent.target as Element | null)?.closest(
      'button[interestfor]',
    );
    if (button) {
      const popoverId = button.getAttribute('interestfor');
      const popover = popoverId ? document.getElementById(popoverId) : null;
      if (!(popover instanceof HTMLElement)) {
        return;
      }

      if (
        relatedTarget instanceof Node &&
        (button.contains(relatedTarget) || popover.contains(relatedTarget))
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
      `button[interestfor="${popover.id}"]`,
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

/* global HTMLElement */

const {
  installInterestForPolyfill,
} = require('../../shared/lib/polyfills/interestfor');

function installPopoverApiPolyfillForTests() {
  if (
    typeof HTMLElement === 'undefined' ||
    typeof HTMLElement.prototype.showPopover === 'function'
  ) {
    return;
  }

  const openPopovers = new Set();

  HTMLElement.prototype.showPopover = function showPopover() {
    openPopovers.add(this);
    this.setAttribute('data-popover-open', 'true');
  };

  HTMLElement.prototype.hidePopover = function hidePopover() {
    openPopovers.delete(this);
    this.removeAttribute('data-popover-open');
  };

  HTMLElement.prototype.togglePopover = function togglePopover(force) {
    const shouldOpen =
      force === true || (force !== false && !openPopovers.has(this));
    if (shouldOpen) {
      this.showPopover();
      return;
    }
    this.hidePopover();
  };

  document.body.addEventListener(
    'click',
    (event) => {
      const invoker = event.target?.closest?.(
        '[commandfor][command="toggle-popover"]',
      );
      if (!invoker) {
        return;
      }

      const targetId = invoker.getAttribute('commandfor');
      const target = targetId ? document.getElementById(targetId) : null;
      target?.togglePopover?.();
    },
    { capture: true },
  );
}

installPopoverApiPolyfillForTests();
installInterestForPolyfill();

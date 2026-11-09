import { fireEvent } from '@testing-library/react';

/**
 * Simulates the browser closing a native `popover` element (light dismiss or
 * Escape). jsdom implements neither, so tests dispatch the `toggle` event that
 * the design system `Popover` listens to for `onClose`.
 *
 * @param popover - The element rendered by the design system `Popover`.
 */
export function closeNativePopover(popover: Element): void {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', { value: 'closed' });
  fireEvent(popover, event);
}

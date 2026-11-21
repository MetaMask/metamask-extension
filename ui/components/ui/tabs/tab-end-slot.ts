import { createContext, useContext } from 'react';

/**
 * DOM node at the inline end of the tab row, when a Tabs instance opts in.
 * Null until that node has mounted, and null when the tabs have no end slot.
 */
export const TabEndSlotContext = createContext<HTMLElement | null>(null);

export const useTabEndSlot = (): HTMLElement | null =>
  useContext(TabEndSlotContext);

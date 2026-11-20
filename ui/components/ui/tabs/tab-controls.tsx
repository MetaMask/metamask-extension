import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppLayout } from '../../../contexts/app-layout';
import { useTabEndSlot } from './tab-end-slot';

/**
 * Hosts the asset controls for one account-overview tab.
 *
 * @param props - The component props.
 * @param props.children - The control bar for the active tab.
 */
export const TabControls = ({ children }: React.PropsWithChildren) => {
  const { isWideLayout } = useAppLayout();
  const tabEndSlot = useTabEndSlot();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [slot] = useState(() => {
    const element = document.createElement('div');
    element.className = 'tab-controls';
    return element;
  });

  const placeInTabRow = isWideLayout && tabEndSlot !== null;

  useLayoutEffect(() => {
    const parent = placeInTabRow ? tabEndSlot : anchorRef.current;
    if (!parent) {
      return undefined;
    }

    parent.appendChild(slot);
    return () => {
      slot.remove();
    };
  }, [placeInTabRow, tabEndSlot, slot]);

  return (
    <>
      <div ref={anchorRef} />
      {createPortal(children, slot)}
    </>
  );
};

import { Placement } from '@popperjs/core';
import { ReactNode, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { useClickAway } from 'react-use';
import styled from 'styled-components';
import { BodyPortal } from 'lib/ui/BodyPortal';
import { useElementSize } from 'lib/ui/hooks/useElementSize';
import { ScreenCover } from 'lib/ui/ScreenCover';
import { useValueRef } from 'lib/shared/hooks/useValueRef';

export type PopoverPlacement = Placement;

interface PopoverProps {
  anchor: HTMLElement;
  children: ReactNode;
  placement?: PopoverPlacement;
  distance?: number;
  enableScreenCover?: boolean;
  onClickOutside?: () => void;
}

export const Popover = styled(
  ({
    anchor,
    children,
    onClickOutside,
    placement = 'auto',
    distance = 4,
    enableScreenCover = false,
  }: PopoverProps) => {
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(
      null,
    );

    const { styles, attributes, update } = usePopper(anchor, popperElement, {
      placement,
      strategy: 'fixed',

      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, distance],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            padding: 8,
          },
        },
      ],
    });

    const poperRef = useValueRef(popperElement);
    useClickAway(poperRef, (event) => {
      if (anchor.contains(event.target as Node)) {
        return;
      }
      onClickOutside?.();
    });

    const size = useElementSize(popperElement);
    useEffect(() => {
      if (!update) {
        return;
      }

      update();
    }, [size, update]);

    const popoverNode = (
      <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        {children}
      </div>
    );

    return (
      <BodyPortal>
        {enableScreenCover && <ScreenCover />}
        {popoverNode}
      </BodyPortal>
    );
  },
)``;

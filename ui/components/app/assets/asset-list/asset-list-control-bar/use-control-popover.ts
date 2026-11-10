import { useCallback, useId, useState } from 'react';
import { PopoverPosition } from '../../../../component-library';
import {
  controlPopoverStyle,
  useAssetControl,
  useIsControlBarFullScreen,
} from './asset-controls';

/**
 * Shared open state, anchor, and props for an asset-control popover.
 * The open-state key is unique per control, so only one menu stays open.
 *
 * @param minWidth - Popover width in the expanded layout. Ignored in the popup.
 */
export const useControlPopover = (minWidth: string) => {
  const id = useId();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl(id);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);

  return {
    buttonRef,
    isOpen,
    toggle,
    close,
    popoverProps: {
      onClickOutside: close,
      isOpen,
      position: PopoverPosition.BottomEnd,
      referenceElement,
      matchWidth: false,
      style: controlPopoverStyle(isFullScreen, minWidth),
    },
  };
};

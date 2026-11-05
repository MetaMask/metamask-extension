import { RefObject, useContext, useEffect } from 'react';
import { ModalLayerContext } from './modal-layer';

/** Only the active modal may handle dismissal, including across synchronous closes. */
export function useModalEvents({
  dialogRef,
  onClose,
  isClosedOnEscapeKey,
  isClosedOnOutsideClick,
}: {
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  isClosedOnEscapeKey?: boolean;
  isClosedOnOutsideClick?: boolean;
}) {
  const layer = useContext(ModalLayerContext);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isClosedOnEscapeKey &&
        event.key === 'Escape' &&
        (!layer || layer.ownsEvent(event))
      ) {
        onClose();
      }
    };
    const handleMouseDown = (event: MouseEvent) => {
      const { target } = event;
      if (
        isClosedOnOutsideClick &&
        target instanceof Element &&
        // Floating UI portals can belong to the dialog without being DOM descendants.
        !target.closest('.mm-popover, [data-mm-modal-ignore-outside-click]') &&
        dialogRef.current &&
        !dialogRef.current.contains(target) &&
        (!layer || layer.ownsEvent(event))
      ) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [dialogRef, onClose, isClosedOnEscapeKey, isClosedOnOutsideClick, layer]);
}

import { useCallback } from 'react';
import { useQueryState } from './useQueryState';

type Modal = 'network' | 'rename-account';

export function useModalState(modalName: Modal) {
  const [show, setShow] = useQueryState('show');

  const isOpen = show === modalName;

  const open = useCallback(() => {
    setShow(modalName);
  }, [modalName, setShow]);

  const close = useCallback(() => {
    setShow(null);
  }, [setShow]);

  return { isOpen, open, close };
}

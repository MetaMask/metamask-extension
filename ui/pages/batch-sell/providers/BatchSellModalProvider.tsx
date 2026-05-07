import React, { createContext, useCallback, useMemo, useState } from 'react';
import {
  BatchSellModal,
  BatchSellModalProps,
} from '../components/BatchSellModal';

type ModalProps = BatchSellModalProps['modalProps'];

type BatchSellModalContextValue = {
  openModal: (props: ModalProps) => void;
  closeModal: () => void;
};

export const BatchSellModalContext = createContext<BatchSellModalContextValue>({
  openModal: () => undefined,
  closeModal: () => undefined,
});

export const BatchSellModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<ModalProps>(undefined);

  const openModal = useCallback((props: ModalProps) => {
    setModalProps(props);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalProps(undefined);
  }, []);

  const contextValue = useMemo(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  return (
    <BatchSellModalContext.Provider value={contextValue}>
      {children}
      <BatchSellModal
        open={isOpen}
        modalProps={modalProps}
        onClose={closeModal}
      />
    </BatchSellModalContext.Provider>
  );
};

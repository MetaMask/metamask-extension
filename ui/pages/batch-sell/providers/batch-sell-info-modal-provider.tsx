import React, { createContext, useCallback, useMemo, useState } from 'react';
import {
  BatchSellInfoModal,
  BatchSellInfoModalProps,
} from '../components/batch-sell-info-modal';

type InfoModalProps = BatchSellInfoModalProps['modalProps'];

type BatchSellInfoModalContextValue = {
  openModal: (props: InfoModalProps) => void;
  closeModal: () => void;
  isInfoModalOpen: boolean;
};

export const BatchSellInfoModalContext =
  createContext<BatchSellInfoModalContextValue>({
    openModal: () => undefined,
    closeModal: () => undefined,
    isInfoModalOpen: false,
  });

export const BatchSellInfoModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<InfoModalProps>(undefined);

  const openModal = useCallback((props: InfoModalProps) => {
    setModalProps(props);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalProps(undefined);
  }, []);

  const contextValue = useMemo(
    () => ({ openModal, closeModal, isInfoModalOpen: isOpen }),
    [openModal, closeModal, isOpen],
  );

  return (
    <BatchSellInfoModalContext.Provider value={contextValue}>
      {children}
      <BatchSellInfoModal
        open={isOpen}
        modalProps={modalProps}
        onClose={closeModal}
      />
    </BatchSellInfoModalContext.Provider>
  );
};

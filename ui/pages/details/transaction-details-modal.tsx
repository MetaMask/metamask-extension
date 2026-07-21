import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TransactionDetails } from './transaction-details';

export function TransactionDetailsModal({
  isOpen,
  chainId,
  txIdentifier,
  onClose,
}: {
  isOpen: boolean;
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Next tick so the initial opacity:0 / translateY state is painted first
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    return undefined;
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col w-full max-w-[var(--width-max)] group-[.app--sidepanel]:max-w-[var(--width-max-sidepanel)] mx-auto"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.97)',
        transition:
          'opacity 180ms cubic-bezier(0.4,0,0.2,1), transform 180ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <TransactionDetails
        chainId={chainId}
        txIdentifier={txIdentifier}
        onBack={onClose}
      />
    </div>,
    document.body,
  );
}

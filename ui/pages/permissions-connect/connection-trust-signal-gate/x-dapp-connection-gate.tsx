import React from 'react';

import { useBoolean } from '../../../hooks/useBoolean';
import { XDappWarningModal } from './x-dapp-warning-modal';

type XDappConnectionGateProps = {
  origin: string;
  children: React.ReactNode;
  onCancel: () => void;
};

function isXDotCom(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'x.com' || hostname.endsWith('.x.com');
  } catch {
    return false;
  }
}

export function XDappConnectionGate({
  origin,
  children,
  onCancel,
}: Readonly<XDappConnectionGateProps>) {
  const { value: dismissed, setTrue: dismiss } = useBoolean(false);

  const showModal = !dismissed && isXDotCom(origin);

  return (
    <>
      {showModal && (
        <XDappWarningModal onContinue={dismiss} onCancel={onCancel} />
      )}
      {children}
    </>
  );
}

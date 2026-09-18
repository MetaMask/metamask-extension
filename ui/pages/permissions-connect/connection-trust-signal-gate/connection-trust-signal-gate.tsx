import React from 'react';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalModal } from '../../../components/app/trust-signal-modal/trust-signal-modal';
import { useBoolean } from '../../../hooks/useBoolean';

type ConnectionTrustSignalGateProps = {
  origin: string;
  children: React.ReactNode;
  onCancel: () => void;
};

export function ConnectionTrustSignalGate({
  origin,
  children,
  onCancel,
}: Readonly<ConnectionTrustSignalGateProps>) {
  const { state } = useOriginTrustSignals(origin);
  const { value: dismissed, setTrue: dismiss } = useBoolean(false);

  const showModal = !dismissed && state === TrustSignalDisplayState.Malicious;

  return (
    <>
      {showModal && (
        <TrustSignalModal onContinue={dismiss} onCancel={onCancel} />
      )}
      {children}
    </>
  );
}

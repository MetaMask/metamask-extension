import React, { useState } from 'react';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalModal } from './trust-signal-modal';

type ConnectionTrustSignalGateProps = {
  origin: string;
  children: React.ReactNode;
};

export function ConnectionTrustSignalGate({
  origin,
  children,
}: ConnectionTrustSignalGateProps) {
  const { state } = useOriginTrustSignals(origin);
  const [dismissed, setDismissed] = useState(false);

  if (!dismissed && state === TrustSignalDisplayState.Malicious) {
    return (
      <TrustSignalModal origin={origin} onContinue={() => setDismissed(true)} />
    );
  }

  return <>{children}</>;
}

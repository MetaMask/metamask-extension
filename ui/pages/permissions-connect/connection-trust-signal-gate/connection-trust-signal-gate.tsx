import React, { useState } from 'react';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalModal } from '../../../components/app/trust-signal-modal/trust-signal-modal';

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
  const [dismissed, setDismissed] = useState(false);

  if (!dismissed && state === TrustSignalDisplayState.Malicious) {
    return (
      <TrustSignalModal
        onContinue={() => setDismissed(true)}
        onCancel={onCancel}
      />
    );
  }

  return <>{children}</>;
}

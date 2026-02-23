import React, { useState } from 'react';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalWarningModal } from './trust-signal-warning-modal';
import { TrustSignalBlockModal } from './trust-signal-block-modal';

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

  if (
    dismissed ||
    state === TrustSignalDisplayState.Unknown ||
    state === TrustSignalDisplayState.Verified
  ) {
    return <>{children}</>;
  }

  if (state === TrustSignalDisplayState.Warning) {
    return (
      <TrustSignalWarningModal
        origin={origin}
        onContinue={() => setDismissed(true)}
      />
    );
  }

  if (state === TrustSignalDisplayState.Malicious) {
    return (
      <TrustSignalBlockModal
        origin={origin}
        onContinue={() => setDismissed(true)}
      />
    );
  }

  return <>{children}</>;
}

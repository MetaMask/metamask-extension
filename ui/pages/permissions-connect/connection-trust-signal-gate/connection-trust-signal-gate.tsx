import React, { useState } from 'react';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalContext } from './trust-signal-context';
import { TrustSignalWarningModal } from './trust-signal-warning-modal';
import { TrustSignalBlockModal } from './trust-signal-block-modal';

type ConnectionTrustSignalGateProps = {
  origin: string;
  onReject: () => void;
  children: React.ReactNode;
};

export function ConnectionTrustSignalGate({
  origin,
  onReject,
  children,
}: ConnectionTrustSignalGateProps) {
  const { state } = useOriginTrustSignals(origin);
  const [dismissed, setDismissed] = useState(false);

  console.log('state', state);

  const renderChildren = (
    <TrustSignalContext.Provider value={{ state }}>
      {children}
    </TrustSignalContext.Provider>
  );

  if (
    dismissed ||
    state === TrustSignalDisplayState.Verified ||
    state === TrustSignalDisplayState.Unknown
  ) {
    return renderChildren;
  }

  if (state === TrustSignalDisplayState.Warning) {
    return (
      <TrustSignalWarningModal
        origin={origin}
        onContinue={() => setDismissed(true)}
        onGoBack={onReject}
      />
    );
  }

  if (state === TrustSignalDisplayState.Malicious) {
    return (
      <TrustSignalBlockModal
        origin={origin}
        onContinue={() => setDismissed(true)}
        onGoBack={onReject}
      />
    );
  }

  // Loading or any other state — pass through
  return renderChildren;
}

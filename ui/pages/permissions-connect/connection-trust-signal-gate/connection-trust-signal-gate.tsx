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

function isXDotCom(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'x.com' || hostname.endsWith('.x.com');
  } catch {
    return false;
  }
}

export function ConnectionTrustSignalGate({
  origin,
  children,
  onCancel,
}: Readonly<ConnectionTrustSignalGateProps>) {
  const { state } = useOriginTrustSignals(origin);
  const { value: dismissed, setTrue: dismiss } = useBoolean(false);

  const isMalicious = state === TrustSignalDisplayState.Malicious;
  const isX = isXDotCom(origin);
  const showModal = !dismissed && (isMalicious || isX);

  return (
    <>
      {showModal && (
        <TrustSignalModal
          onContinue={dismiss}
          onCancel={onCancel}
          title={isMalicious ? 'continueAtYourOwnRisk' : undefined}
          description={
            isMalicious
              ? 'trustSignalPhishingWarning'
              : 'xDappConnectionWarning'
          }
          continueLabel={isMalicious ? 'connectAnyway' : 'continueAnyway'}
          cancelLabel={isMalicious ? 'cancel' : 'backToSafety'}
          isError={isMalicious}
        />
      )}
      {children}
    </>
  );
}

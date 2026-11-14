import React from 'react';
import { useSelector } from 'react-redux';
import { isXDotCom } from '#shared/lib/url-utils';
import { getIsXDappConnectionWarningEnabled } from '#ui/selectors/dapp';
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
  const isXWarningEnabled = useSelector(getIsXDappConnectionWarningEnabled);

  const isMalicious = state === TrustSignalDisplayState.Malicious;
  const showModal =
    !dismissed && (isMalicious || (isXWarningEnabled && isXDotCom(origin)));

  return (
    <>
      {showModal && (
        <TrustSignalModal onContinue={dismiss} onCancel={onCancel} />
      )}
      {children}
    </>
  );
}

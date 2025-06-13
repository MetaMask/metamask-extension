import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { useModalTextConfig } from '../components/app/name/name-details/trust-signal-config';
import {
  determineIconType,
  determineDisplayName,
} from '../helpers/utils/trust-signal-display';
import { TRUST_STATE_TO_ICON } from '../helpers/constants/trust-signal-icons';
import { IconName } from '../components/component-library';
import { useTrustSignals, TrustSignalState } from './useTrustSignals';
import { useDisplayName } from './useDisplayName';

export type TrustSignalDisplayState = {
  // Core state
  trustState: TrustSignalState | null;
  trustLabel?: string;

  // Display decisions
  displayName: string | null;
  hasPetname: boolean;
  hasRecognizedName: boolean;

  // What to show
  iconType: 'identicon' | 'trust-signal' | 'question';
  iconName?: IconName;

  // Image for identicon
  image?: string;

  // Modal configuration
  modalTextConfig: ReturnType<typeof useModalTextConfig>;
};

type UseTrustSignalDisplayParams = {
  value: string;
  type: NameType;
  variation: string;
  preferContractSymbol?: boolean;
  showTrustSignals: boolean;
};

export function useTrustSignalDisplay({
  value,
  type,
  variation,
  preferContractSymbol,
  showTrustSignals,
}: UseTrustSignalDisplayParams): TrustSignalDisplayState {
  const {
    name: savedName,
    hasPetname,
    image,
  } = useDisplayName({
    value,
    type,
    variation,
    preferContractSymbol,
  });

  const trustSignals = useTrustSignals(value);

  const hasRecognizedName = !hasPetname && Boolean(savedName);

  const modalTextConfig = useModalTextConfig(
    trustSignals.state,
    hasPetname,
    hasRecognizedName,
    showTrustSignals,
  );

  return useMemo(() => {
    const iconType = determineIconType({
      trustState: trustSignals.state,
      hasPetname,
      hasRecognizedName,
      showTrustSignals,
    });

    const displayName = determineDisplayName({
      petname: hasPetname ? savedName : null,
      recognizedName: hasRecognizedName ? savedName : null,
      trustLabel: trustSignals.label,
      trustState: trustSignals.state,
      showTrustSignals,
    });

    const iconName =
      iconType === 'trust-signal' && trustSignals.state
        ? TRUST_STATE_TO_ICON[trustSignals.state]
        : undefined;

    return {
      trustState: trustSignals.state,
      trustLabel: trustSignals.label,
      displayName,
      hasPetname,
      hasRecognizedName,
      iconType,
      iconName,
      image,
      modalTextConfig,
    };
  }, [
    trustSignals.state,
    trustSignals.label,
    hasPetname,
    hasRecognizedName,
    savedName,
    showTrustSignals,
    image,
    modalTextConfig,
  ]);
}

import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { IconName } from '../components/component-library';
import { TrustSignalState, useTrustSignals } from './useTrustSignals';
import { useDisplayName } from './useDisplayName';
import {
  useModalTextConfig,
  ModalTextConfig,
} from '../components/app/name/name-details/trust-signal-config';

// Define all possible display states
export enum NameDisplayStateType {
  Petname = 'petname',
  VerifiedTrust = 'verified-trust',
  WarningTrust = 'warning-trust',
  MaliciousTrust = 'malicious-trust',
  UnknownTrust = 'unknown-trust',
  Recognized = 'recognized',
  Unknown = 'unknown',
}

// Base state interface
interface BaseNameDisplayState {
  type: NameDisplayStateType;
  displayName: string | null;
  iconType: 'identicon' | 'trust-signal' | 'question';
  iconName?: IconName;
  iconColor?: string;
  cssClasses: string[];
  modalConfig: ModalTextConfig;

  // Original data for reference
  rawData: {
    savedPetname: string | null;
    recognizedName: string | null;
    trustLabel?: string;
    trustState: TrustSignalState | null;
    image?: string;
  };
}

// Specific state types
export interface PetnameState extends BaseNameDisplayState {
  type: NameDisplayStateType.Petname;
  iconType: 'identicon';
}

export interface VerifiedTrustState extends BaseNameDisplayState {
  type: NameDisplayStateType.VerifiedTrust;
  iconType: 'trust-signal';
  iconName: IconName.VerifiedFilled;
}

export interface WarningTrustState extends BaseNameDisplayState {
  type: NameDisplayStateType.WarningTrust;
  iconType: 'identicon';
}

export interface MaliciousTrustState extends BaseNameDisplayState {
  type: NameDisplayStateType.MaliciousTrust;
  iconType: 'trust-signal';
  iconName: IconName.Danger;
}

export interface UnknownTrustState extends BaseNameDisplayState {
  type: NameDisplayStateType.UnknownTrust;
  iconType: 'question';
}

export interface RecognizedState extends BaseNameDisplayState {
  type: NameDisplayStateType.Recognized;
  iconType: 'identicon';
}

export interface UnknownState extends BaseNameDisplayState {
  type: NameDisplayStateType.Unknown;
  iconType: 'question';
}

export type NameDisplayState =
  | PetnameState
  | VerifiedTrustState
  | WarningTrustState
  | MaliciousTrustState
  | UnknownTrustState
  | RecognizedState
  | UnknownState;

// State machine context
interface StateContext {
  savedPetname: string | null;
  recognizedName: string | null;
  trustState: TrustSignalState | null;
  trustLabel?: string;
  showTrustSignals: boolean;
  image?: string;
  modalConfig: ModalTextConfig;
}

// State factory function
function createState(context: StateContext): NameDisplayState {
  const {
    savedPetname,
    recognizedName,
    trustState,
    trustLabel,
    showTrustSignals,
    image,
    modalConfig,
  } = context;

  const rawData = {
    savedPetname,
    recognizedName,
    trustLabel,
    trustState,
    image,
  };

  // State 1: Malicious takes precedence - even over petnames
  // This ensures malicious addresses always show danger indication
  if (showTrustSignals && trustState === TrustSignalState.Malicious) {
    return {
      type: NameDisplayStateType.MaliciousTrust,
      displayName: savedPetname || trustLabel || null, // Show petname if available, otherwise trust label
      iconType: 'trust-signal',
      iconName: IconName.Danger,
      iconColor: 'error-default',
      cssClasses: savedPetname
        ? ['name__malicious', 'name__saved']
        : ['name__malicious', 'name__missing'],
      modalConfig,
      rawData,
    };
  }

  // State 2: Petname (non-malicious)
  if (savedPetname) {
    return {
      type: NameDisplayStateType.Petname,
      displayName: savedPetname,
      iconType: 'identicon',
      cssClasses: ['name__saved'],
      modalConfig,
      rawData,
    };
  }

  // State 3-5: Other trust signal states (when enabled and present)
  if (showTrustSignals && trustState) {
    switch (trustState) {
      case TrustSignalState.Verified:
        return {
          type: NameDisplayStateType.VerifiedTrust,
          displayName: trustLabel || null,
          iconType: 'trust-signal',
          iconName: IconName.VerifiedFilled,
          iconColor: 'info-default',
          cssClasses: ['name__verified', 'name__missing'],
          modalConfig,
          rawData,
        };

      case TrustSignalState.Warning:
        // Special case: warning shows identicon and recognized name if available
        return {
          type: NameDisplayStateType.WarningTrust,
          displayName: recognizedName,
          iconType: 'identicon',
          cssClasses: recognizedName
            ? ['name__warning', 'name__recognized_unsaved']
            : ['name__warning', 'name__missing'],
          modalConfig,
          rawData,
        };

      case TrustSignalState.Unknown:
        return {
          type: NameDisplayStateType.UnknownTrust,
          displayName: null,
          iconType: 'question',
          cssClasses: ['name__unknown', 'name__missing'],
          modalConfig,
          rawData,
        };
    }
  }

  // State 6: Recognized name (no petname, no applicable trust signals)
  if (recognizedName) {
    return {
      type: NameDisplayStateType.Recognized,
      displayName: recognizedName,
      iconType: 'identicon',
      cssClasses: ['name__recognized_unsaved'],
      modalConfig,
      rawData,
    };
  }

  // State 7: Unknown (default)
  return {
    type: NameDisplayStateType.Unknown,
    displayName: null,
    iconType: 'question',
    cssClasses: ['name__missing'],
    modalConfig,
    rawData,
  };
}

// Main hook
export function useNameDisplayState({
  value,
  type,
  variation,
  preferContractSymbol,
  showTrustSignals,
}: {
  value: string;
  type: NameType;
  variation: string;
  preferContractSymbol?: boolean;
  showTrustSignals: boolean;
}) {
  // Fetch data
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

  const { state: trustState, label: trustLabel } = useTrustSignals(value);

  const savedPetname = hasPetname ? savedName : null;
  const recognizedName = !hasPetname && savedName ? savedName : null;

  const modalConfig = useModalTextConfig(
    trustState,
    hasPetname,
    Boolean(recognizedName),
    showTrustSignals,
  );

  // Create state
  const displayState = useMemo(() => {
    const context: StateContext = {
      savedPetname,
      recognizedName,
      trustState,
      trustLabel,
      showTrustSignals,
      image,
      modalConfig,
    };

    return createState(context);
  }, [
    savedPetname,
    recognizedName,
    trustState,
    trustLabel,
    showTrustSignals,
    image,
    modalConfig,
  ]);

  return {
    displayState,
    // Expose commonly needed values directly
    hasPetname: Boolean(savedPetname),
    hasRecognizedName: Boolean(recognizedName),
    image,
  };
}

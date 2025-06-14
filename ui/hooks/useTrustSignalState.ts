import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { IconName } from '../components/component-library';
import { TrustSignalState, useTrustSignals } from './useTrustSignals';
import { useDisplayName } from './useDisplayName';
import { useName } from './useName';
import {
  useModalTextConfig,
  ModalTextConfig,
} from '../components/app/name/name-details/trust-signal-config';

// Entity types that can have trust signals
export type TrustSignalEntity =
  | {
      type: 'address';
      value: string;
      nameType: NameType;
      variation: string;
      preferContractSymbol?: boolean;
    }
  | {
      type: 'url';
      value: string;
    }
  | {
      type: 'domain';
      value: string;
    };

// Define all possible display states
export enum TrustSignalDisplayStateType {
  Petname = 'petname',
  VerifiedTrust = 'verified-trust',
  WarningTrust = 'warning-trust',
  MaliciousTrust = 'malicious-trust',
  UnknownTrust = 'unknown-trust',
  Recognized = 'recognized',
  Unknown = 'unknown',
}

// Base state interface
interface BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType;
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
    entity: TrustSignalEntity;
  };
}

// Specific state types
export interface PetnameState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.Petname;
  iconType: 'identicon';
}

export interface VerifiedTrustState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.VerifiedTrust;
  iconType: 'trust-signal';
  iconName: IconName.VerifiedFilled;
}

export interface WarningTrustState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.WarningTrust;
  iconType: 'identicon';
}

export interface MaliciousTrustState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.MaliciousTrust;
  iconType: 'trust-signal';
  iconName: IconName.Danger;
}

export interface UnknownTrustState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.UnknownTrust;
  iconType: 'question';
}

export interface RecognizedState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.Recognized;
  iconType: 'identicon';
}

export interface UnknownState extends BaseTrustSignalDisplayState {
  type: TrustSignalDisplayStateType.Unknown;
  iconType: 'question';
}

export type TrustSignalDisplayState =
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
  entity: TrustSignalEntity;
}

// State factory function
function createState(context: StateContext): TrustSignalDisplayState {
  const {
    savedPetname,
    recognizedName,
    trustState,
    trustLabel,
    showTrustSignals,
    image,
    modalConfig,
    entity,
  } = context;

  const rawData = {
    savedPetname,
    recognizedName,
    trustLabel,
    trustState,
    image,
    entity,
  };

  // State 1: Malicious takes precedence - even over petnames
  // This ensures malicious entities always show danger indication
  if (showTrustSignals && trustState === TrustSignalState.Malicious) {
    return {
      type: TrustSignalDisplayStateType.MaliciousTrust,
      displayName: savedPetname || trustLabel || null,
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
      type: TrustSignalDisplayStateType.Petname,
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
          type: TrustSignalDisplayStateType.VerifiedTrust,
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
          type: TrustSignalDisplayStateType.WarningTrust,
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
          type: TrustSignalDisplayStateType.UnknownTrust,
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
      type: TrustSignalDisplayStateType.Recognized,
      displayName: recognizedName,
      iconType: 'identicon',
      cssClasses: ['name__recognized_unsaved'],
      modalConfig,
      rawData,
    };
  }

  // State 7: Unknown (default)
  return {
    type: TrustSignalDisplayStateType.Unknown,
    displayName: null,
    iconType: 'question',
    cssClasses: ['name__missing'],
    modalConfig,
    rawData,
  };
}

// Entity-specific data fetching
function useEntityData(
  entity: TrustSignalEntity,
  showTrustSignals: boolean,
): {
  savedPetname: string | null;
  recognizedName: string | null;
  trustState: TrustSignalState | null;
  trustLabel?: string;
  image?: string;
  modalConfig: ModalTextConfig;
} {
  // Address-specific logic (current implementation)
  const addressData =
    entity.type === 'address'
      ? useDisplayName({
          value: entity.value,
          type: entity.nameType,
          variation: entity.variation,
          preferContractSymbol: entity.preferContractSymbol,
        })
      : null;

  const {
    name: addressSavedName,
    hasPetname,
    image,
  } = addressData || {
    name: null,
    hasPetname: false,
    image: undefined,
  };

  // Trust signals (currently only for addresses, but will expand)
  const { state: trustState, label: trustLabel } = useTrustSignals(
    entity.type === 'address' ? entity.value : '',
  );

  // Determine names based on entity type
  let savedPetname: string | null = null;
  let recognizedName: string | null = null;

  switch (entity.type) {
    case 'address':
      savedPetname = hasPetname ? addressSavedName : null;
      recognizedName =
        !hasPetname && addressSavedName ? addressSavedName : null;
      break;

    case 'url':
      // TODO: Implement URL name resolution
      // For now, URLs don't have saved names
      break;

    case 'domain':
      // TODO: Implement domain name resolution
      // For now, domains might have ENS names
      break;
  }

  // Get modal configuration
  const modalConfig = useModalTextConfig(
    trustState,
    Boolean(savedPetname),
    Boolean(recognizedName),
    showTrustSignals,
    entity.type,
  );

  return {
    savedPetname,
    recognizedName,
    trustState,
    trustLabel,
    image,
    modalConfig,
  };
}

// Main hook
export function useTrustSignalState(
  entity: TrustSignalEntity,
  options: {
    showTrustSignals: boolean;
  },
): {
  displayState: TrustSignalDisplayState;
  hasPetname: boolean;
  hasRecognizedName: boolean;
  image?: string;
} {
  const { showTrustSignals } = options;

  // Fetch entity-specific data
  const {
    savedPetname,
    recognizedName,
    trustState,
    trustLabel,
    image,
    modalConfig,
  } = useEntityData(entity, showTrustSignals);

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
      entity,
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
    entity,
  ]);

  return {
    displayState,
    hasPetname: Boolean(savedPetname),
    hasRecognizedName: Boolean(recognizedName),
    image,
  };
}

// Convenience hook for addresses (backwards compatibility)
export function useAddressTrustSignalState({
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
  return useTrustSignalState(
    {
      type: 'address',
      value,
      nameType: type,
      variation,
      preferContractSymbol,
    },
    { showTrustSignals },
  );
}

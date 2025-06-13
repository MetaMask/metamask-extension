import { TrustSignalState } from '../../../../hooks/useTrustSignals';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type TrustSignalConfig = {
  titleKey: string;
  instructionsKey?: string;
  labelKey?: string;
  placeholderKey?: string;
  footerTextKey?: string;
};

export const TRUST_SIGNAL_CONFIG: Record<TrustSignalState, TrustSignalConfig> =
  {
    [TrustSignalState.Malicious]: {
      titleKey: 'nameModalTitleMalicious',
      instructionsKey: 'nameInstructionsMalicious',
      placeholderKey: 'nameSetPlaceholderMalicious',
      footerTextKey: 'nameFooterTrustWarning',
    },
    [TrustSignalState.Warning]: {
      titleKey: 'nameModalTitleWarning',
      instructionsKey: 'nameInstructionsWarning',
      footerTextKey: 'nameFooterTrustWarning',
    },
    [TrustSignalState.Verified]: {
      titleKey: 'nameModalTitleVerified',
    },
    [TrustSignalState.Unknown]: {
      titleKey: 'nameModalTitleNew',
      instructionsKey: 'nameInstructionsUnknown',
    },
  };

export const DEFAULT_CONFIG = {
  saved: {
    titleKey: 'nameModalTitleSaved',
    instructionsKey: 'nameInstructionsSaved',
  },
  recognized: {
    titleKey: 'nameModalTitleRecognized',
    instructionsKey: 'nameInstructionsRecognized',
  },
  unknown: {
    titleKey: 'nameModalTitleNew',
    instructionsKey: 'nameInstructionsNew',
  },
};

export type ModalTextConfig = {
  title: string;
  instructions: string;
  label: string;
  placeholder: string;
  footerText?: string;
};

/**
 * Hook to get modal text configuration based on trust signals and saved state
 */
export function useModalTextConfig(
  trustSignalState: TrustSignalState | null,
  hasSavedPetname: boolean,
  isRecognizedUnsaved: boolean,
  showTrustSignals: boolean,
): ModalTextConfig {
  const t = useI18nContext();

  // Trust signals take precedence when enabled
  if (showTrustSignals && trustSignalState !== null) {
    const config = TRUST_SIGNAL_CONFIG[trustSignalState];
    return {
      title: t(config.titleKey),
      instructions: t(config.instructionsKey),
      label: t(config.labelKey || 'nameLabel'),
      placeholder: t(config.placeholderKey || 'nameSetPlaceholder'),
      footerText: config.footerTextKey ? t(config.footerTextKey) : undefined,
    };
  }

  // Fallback to existing logic
  if (hasSavedPetname) {
    return {
      title: t(DEFAULT_CONFIG.saved.titleKey),
      instructions: t(DEFAULT_CONFIG.saved.instructionsKey),
      label: t('nameLabel'),
      placeholder: t('nameSetPlaceholder'),
    };
  }

  if (isRecognizedUnsaved) {
    return {
      title: t(DEFAULT_CONFIG.recognized.titleKey),
      instructions: t(DEFAULT_CONFIG.recognized.instructionsKey),
      label: t('nameLabel'),
      placeholder: t('nameSetPlaceholder'),
    };
  }

  return {
    title: t(DEFAULT_CONFIG.unknown.titleKey),
    instructions: t(DEFAULT_CONFIG.unknown.instructionsKey),
    label: t('nameLabel'),
    placeholder: t('nameSetPlaceholder'),
  };
}

/**
 * Determines the initial name value based on saved petname and trust signals
 */
export function getInitialNameValue(
  savedPetname: string | null,
  trustSignalState: TrustSignalState | null,
  trustSignalLabel: string | undefined,
  showTrustSignals: boolean,
): string {
  // Saved petname takes priority
  if (savedPetname) {
    return savedPetname;
  }

  // Always return empty string if no saved petname
  return '';
}

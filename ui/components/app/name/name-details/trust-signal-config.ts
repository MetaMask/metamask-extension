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
 *
 * @param trustSignalState - The current trust signal state
 * @param hasSavedPetname - Whether the user has saved a petname
 * @param isRecognizedUnsaved - Whether the name is recognized but not saved
 * @param showTrustSignals - Whether to show trust signals
 * @param entityType - The type of entity (address, url, domain) for future expansion
 * @returns Modal text configuration
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
 *
 * @param savedPetname - The saved petname if any
 * @param _trustSignalState - The trust signal state (unused)
 * @param _trustSignalLabel - The trust signal label (unused)
 * @param _showTrustSignals - Whether to show trust signals (unused)
 * @returns The initial name value
 */
export function getInitialNameValue(
  savedPetname: string | null,
  _trustSignalState: TrustSignalState | null,
  _trustSignalLabel: string | undefined,
  _showTrustSignals: boolean,
): string {
  // Saved petname takes priority
  if (savedPetname) {
    return savedPetname;
  }

  // Always return empty string if no saved petname
  return '';
}

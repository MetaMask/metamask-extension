import { TrustSignalState } from '../../hooks/useTrustSignals';

interface DetermineIconTypeParams {
  trustState: TrustSignalState | null;
  hasPetname: boolean;
  hasRecognizedName: boolean;
  showTrustSignals: boolean;
}

/**
 * Determines what type of icon to show based on trust signal state and name status
 */
export function determineIconType({
  trustState,
  hasPetname,
  hasRecognizedName,
  showTrustSignals,
}: DetermineIconTypeParams): 'identicon' | 'trust-signal' | 'question' {
  // Trust signals take precedence when enabled
  if (showTrustSignals && trustState) {
    // Special cases where we show identicon despite trust signals
    if (trustState === TrustSignalState.Warning) {
      return 'identicon';
    }
    if (trustState === TrustSignalState.Unknown && hasPetname) {
      return 'identicon';
    }

    // Otherwise show the trust signal icon
    return 'trust-signal';
  }

  // No trust signals - standard logic
  if (hasPetname || hasRecognizedName) {
    return 'identicon';
  }

  return 'question';
}

interface DetermineDisplayNameParams {
  petname: string | null;
  recognizedName: string | null;
  trustLabel: string | undefined;
  trustState: TrustSignalState | null;
  showTrustSignals: boolean;
}

/**
 * Determines what name to display based on trust signals and saved names
 */
export function determineDisplayName({
  petname,
  recognizedName,
  trustLabel,
  trustState,
  showTrustSignals,
}: DetermineDisplayNameParams): string | null {
  // Petname always wins
  if (petname) {
    return petname;
  }

  // Trust label when showing trust signals (and no petname)
  if (showTrustSignals && trustState && trustLabel) {
    return trustLabel;
  }

  // Fall back to recognized name
  return recognizedName;
}

/**
 * Enum of supported Defi referral partners
 */
export enum DefiReferralPartner {
  Hyperliquid = 'hyperliquid',
  // AsterDex = 'asterdex',
}

/**
 * Configuration for a Defi referral partner
 */
export type DefiReferralPartnerConfig = {
  /** Unique identifier for partner */
  id: DefiReferralPartner;
  /** Display name for UI */
  name: string;
  /** Origin domain */
  origin: string;
  /** Full referral URL including the referral code */
  referralUrl: string;
  /** URL for "Learn more" link in the consent UI */
  learnMoreUrl: string;
  /** Approval type string for ApprovalController */
  approvalType: string;
  /** Remote feature flag key to check if referral is enabled */
  featureFlagKey: string;
};

/**
 * Configuration for all supported Defi referral partners
 */
export const DEFI_REFERRAL_PARTNERS: Record<DefiReferralPartner, DefiReferralPartnerConfig> =
  {
    [DefiReferralPartner.Hyperliquid]: {
      id: DefiReferralPartner.Hyperliquid,
      name: 'Hyperliquid',
      origin: 'https://app.hyperliquid.xyz',
      referralUrl: 'https://app.hyperliquid.xyz/join/MMREFCSI',
      learnMoreUrl: 'https://hyperliquid.gitbook.io/hyperliquid-docs/referrals',
      approvalType: 'hyperliquid_referral_consent',
      featureFlagKey: 'extensionUxDefiReferral',
    },
    // [DefiReferralPartner.AsterDex]: {
    //   id: DefiReferralPartner.AsterDex,
    //   name: 'AsterDex',
    //   origin: 'https://www.asterdex.com',
    //   referralUrl: 'https://www.asterdex.com/en/referral/wsuZBc',
    //   learnMoreUrl: 'https://docs.asterdex.com/product/aster-perpetuals/referral-program',
    //   approvalType: 'asterdex_referral_consent',
    //   featureFlagKey: 'tbd',
    // },
  };

/**
 * Helper to look up a Defi referral partner configuration by origin URL.
 *
 * @param origin - The origin URL to match
 * @returns The partner configuration if found, undefined otherwise
 */
export function getPartnerByOrigin(
  origin: string,
): DefiReferralPartnerConfig | undefined {
  return Object.values(DEFI_REFERRAL_PARTNERS).find((partner) =>
    origin === partner.origin,
  );
}

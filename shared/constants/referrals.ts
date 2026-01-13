/**
 * Enum of supported referral partners
 */
export enum ReferralPartner {
  Hyperliquid = 'hyperliquid',
  // AsterDex = 'asterdex',
}

/**
 * Configuration for a referral partner
 */
export type ReferralPartnerConfig = {
  /** Unique identifier for partner */
  id: ReferralPartner;
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
 * Configuration for all supported referral partners
 */
export const REFERRAL_PARTNERS: Record<ReferralPartner, ReferralPartnerConfig> =
  {
    [ReferralPartner.Hyperliquid]: {
      id: ReferralPartner.Hyperliquid,
      name: 'Hyperliquid',
      origin: 'https://app.hyperliquid.xyz',
      referralUrl: 'https://app.hyperliquid.xyz/join/MMREFCSI',
      learnMoreUrl: 'https://hyperliquid.gitbook.io/hyperliquid-docs/referrals',
      approvalType: 'hyperliquid_referral_consent',
      featureFlagKey: 'extensionUxDefiReferral',
    },
    // [ReferralPartner.AsterDex]: {
    //   id: ReferralPartner.AsterDex,
    //   name: 'AsterDex',
    //   origin: 'https://www.asterdex.com',
    //   referralUrl: 'https://www.asterdex.com/en/referral/wsuZBc',
    //   learnMoreUrl: 'https://docs.asterdex.com/product/aster-perpetuals/referral-program',
    //   approvalType: 'asterdex_referral_consent',
    //   featureFlagKey: 'tbd',
    // },
  };

/**
 * Helper to look up a partner configuration by origin URL.
 * Matches if the provided origin starts with the partner's configured origin.
 *
 * @param origin - The origin URL to match
 * @returns The partner configuration if found, undefined otherwise
 */
export function getPartnerByOrigin(
  origin: string,
): ReferralPartnerConfig | undefined {
  return Object.values(REFERRAL_PARTNERS).find((partner) =>
    origin.startsWith(partner.origin),
  );
}

/**
 * All referral partner origins for use in middleware matching
 */
export const REFERRAL_PARTNER_ORIGINS = Object.values(REFERRAL_PARTNERS).map(
  (p) => p.origin,
);

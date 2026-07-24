import { IconColor, IconName, TextColor } from '@metamask/design-system-react';
import type {
  TokenSecurityFeature,
  TokenSecurityFinancialStats,
} from '../types/security-trust';
import {
  formatCompactSupply,
  formatFeePercent,
  getFeatureTags,
  getResultTypeConfig,
  getTop10HoldingPct,
  hasNoHiddenFees,
} from './security-utils';

const t = (key: string, substitutions?: string[]) => {
  if (substitutions?.length) {
    return `${key}:${substitutions.join(',')}`;
  }
  return key;
};

describe('security-utils', () => {
  describe('getResultTypeConfig', () => {
    it('returns config for Verified result type', () => {
      const config = getResultTypeConfig('Verified', t);

      expect(config.label).toBe('securityTrustVerified');
      expect(config.textColor).toBe(TextColor.SuccessDefault);
      expect(config.icon).toBe(IconName.SecurityTick);
      expect(config.badge?.icon).toBe(IconName.VerifiedFilled);
    });

    it('returns config for Malicious result type', () => {
      const config = getResultTypeConfig('Malicious', t);

      expect(config.label).toBe('securityTrustMaliciousLabel');
      expect(config.textColor).toBe(TextColor.ErrorDefault);
      expect(config.iconColor).toBe(IconColor.ErrorDefault);
    });

    it('returns default config for unknown result type', () => {
      const config = getResultTypeConfig(undefined, t);

      expect(config.label).toBe('securityTrustDataUnavailable');
      expect(config.textColor).toBe(TextColor.TextAlternative);
    });
  });

  describe('getFeatureTags', () => {
    const makeFeature = (featureId: string): TokenSecurityFeature =>
      ({ featureId }) as TokenSecurityFeature;

    it('returns positive tags for Verified result type', () => {
      const features = [
        makeFeature('VERIFIED_CONTRACT'),
        makeFeature('HIGH_REPUTATION_TOKEN'),
      ];

      const { tags, remainingCount } = getFeatureTags(features, 'Verified', t);

      expect(tags).toHaveLength(2);
      expect(remainingCount).toBe(0);
    });

    it('returns warning tags for Warning result type', () => {
      const features = [makeFeature('HONEYPOT')];

      const { tags } = getFeatureTags(features, 'Warning', t);

      expect(tags).toEqual([{ label: 'securityTrustFeatureHoneypot' }]);
    });
  });

  describe('formatFeePercent', () => {
    it('formats a number as a percentage', () => {
      expect(formatFeePercent(5)).toBe('5.0%');
    });

    it('returns N/A for null', () => {
      expect(formatFeePercent(null)).toBe('N/A');
    });
  });

  describe('hasNoHiddenFees', () => {
    it('returns true when fees are zero or absent', () => {
      expect(
        hasNoHiddenFees({
          transfer: 0,
          transferFeeMaxAmount: null,
          buy: 0,
          sell: null,
        }),
      ).toBe(true);
    });

    it('returns false when any fee is greater than zero', () => {
      expect(
        hasNoHiddenFees({
          transfer: 0,
          transferFeeMaxAmount: null,
          buy: 0,
          sell: 2.5,
        }),
      ).toBe(false);
    });

    it('returns false when fees are missing', () => {
      expect(hasNoHiddenFees(null)).toBe(false);
    });
  });

  describe('getTop10HoldingPct', () => {
    it('sums holder percentages', () => {
      const stats = {
        topHolders: [{ holdingPercentage: 10 }, { holdingPercentage: 15 }],
      } as TokenSecurityFinancialStats;

      expect(getTop10HoldingPct(stats)).toBe(25);
    });
  });

  describe('formatCompactSupply', () => {
    it('formats millions', () => {
      expect(formatCompactSupply(5_000_000)).toBe('5.00M');
    });
  });
});

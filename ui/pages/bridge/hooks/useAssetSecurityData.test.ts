import { renderHook } from '@testing-library/react-hooks';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BridgeAssetSecurityDataType } from '../utils/tokens';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { useAssetSecurityData } from './useAssetSecurityData';

jest.mock('../../../hooks/useI18nContext');

const mockT = jest.fn((key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key,
);

/**
 * Minimal valid token — all optional security fields absent by default
 * @param overrides
 */
const makeToken = (overrides: Record<string, unknown> = {}): BridgeToken =>
  ({
    assetId: 'eip155:1/erc20:0xabc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 'eip155:1',
    balance: '0',
    ...overrides,
  }) as BridgeToken;

const makeFeature = (
  featureId: string,
  type: BridgeAssetSecurityDataType,
  description = 'some description',
) => ({ featureId, type, description });

describe('useAssetSecurityData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useI18nContext).mockReturnValue(mockT as never);
  });

  // ─── assetHasSecurityData ──────────────────────────────────────────────────

  describe('assetHasSecurityData', () => {
    it('is false when securityData is absent', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetHasSecurityData).toBe(false);
    });

    it('is true when securityData is present', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.BENIGN },
          }),
        ),
      );
      expect(result.current.assetHasSecurityData).toBe(true);
    });
  });

  // ─── assetIsVerified ───────────────────────────────────────────────────────

  describe('assetIsVerified', () => {
    it('is falsy when there is no securityData and isVerified is absent', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetIsVerified).toBeFalsy();
    });

    it('is true when securityData.type is VERIFIED', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
          }),
        ),
      );
      expect(result.current.assetIsVerified).toBe(true);
    });

    it('is true when asset.isVerified flag is true (no securityData)', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(makeToken({ isVerified: true })),
      );
      expect(result.current.assetIsVerified).toBe(true);
    });

    it('is true when both securityData.type is VERIFIED and isVerified is true', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            isVerified: true,
            securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
          }),
        ),
      );
      expect(result.current.assetIsVerified).toBe(true);
    });

    // @ts-expect-error: each is a valid jest method but is missing from the TestFunction type
    it.each([
      BridgeAssetSecurityDataType.MALICIOUS,
      BridgeAssetSecurityDataType.WARNING,
      BridgeAssetSecurityDataType.SPAM,
      BridgeAssetSecurityDataType.INFO,
      BridgeAssetSecurityDataType.BENIGN,
    ])(
      'is falsy when securityData.type is %s',
      (type: BridgeAssetSecurityDataType) => {
        const { result } = renderHook(() =>
          useAssetSecurityData(makeToken({ securityData: { type } })),
        );
        expect(result.current.assetIsVerified).toBeFalsy();
      },
    );
  });

  // ─── assetIsSuspicious ─────────────────────────────────────────────────────

  describe('assetIsSuspicious', () => {
    it('is false when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetIsSuspicious).toBe(false);
    });

    it('is true when securityData.type is WARNING', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }),
        ),
      );
      expect(result.current.assetIsSuspicious).toBe(true);
    });

    it('is true when securityData.type is SPAM', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.SPAM },
          }),
        ),
      );
      expect(result.current.assetIsSuspicious).toBe(true);
    });

    // @ts-expect-error: each is a valid jest method but is missing from the TestFunction type
    it.each([
      BridgeAssetSecurityDataType.MALICIOUS,
      BridgeAssetSecurityDataType.VERIFIED,
      BridgeAssetSecurityDataType.INFO,
      BridgeAssetSecurityDataType.BENIGN,
    ])(
      'is false when securityData.type is %s',
      (type: BridgeAssetSecurityDataType) => {
        const { result } = renderHook(() =>
          useAssetSecurityData(makeToken({ securityData: { type } })),
        );
        expect(result.current.assetIsSuspicious).toBe(false);
      },
    );
  });

  // ─── assetIsMalicious ──────────────────────────────────────────────────────

  describe('assetIsMalicious', () => {
    it('is false when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetIsMalicious).toBe(false);
    });

    it('is true when securityData.type is MALICIOUS', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
          }),
        ),
      );
      expect(result.current.assetIsMalicious).toBe(true);
    });

    // @ts-expect-error: each is a valid jest method but is missing from the TestFunction type
    it.each([
      BridgeAssetSecurityDataType.WARNING,
      BridgeAssetSecurityDataType.SPAM,
      BridgeAssetSecurityDataType.VERIFIED,
      BridgeAssetSecurityDataType.INFO,
      BridgeAssetSecurityDataType.BENIGN,
    ])(
      'is false when securityData.type is %s',
      (type: BridgeAssetSecurityDataType) => {
        const { result } = renderHook(() =>
          useAssetSecurityData(makeToken({ securityData: { type } })),
        );
        expect(result.current.assetIsMalicious).toBe(false);
      },
    );
  });

  // ─── assetSuspiciousLocalizedFeatures ─────────────────────────────────────

  describe('assetSuspiciousLocalizedFeatures', () => {
    it('returns an empty array when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetSuspiciousLocalizedFeatures).toStrictEqual([]);
    });

    it('returns an empty array when metadata is absent', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }),
        ),
      );
      expect(result.current.assetSuspiciousLocalizedFeatures).toStrictEqual([]);
    });

    it('returns an empty array when the features list is empty', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: { features: [] },
            },
          }),
        ),
      );
      expect(result.current.assetSuspiciousLocalizedFeatures).toStrictEqual([]);
    });

    it('includes WARNING features and excludes MALICIOUS features', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  makeFeature('HONEYPOT', BridgeAssetSecurityDataType.WARNING),
                  makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
                ],
              },
            },
          }),
        ),
      );
      const titles = result.current.assetSuspiciousLocalizedFeatures.map(
        (f) => f.title,
      );
      expect(titles).toContain('bridgeSecurityDataKnownHoneypot:USDC');
      expect(titles).not.toContain('bridgeSecurityDataKnownRugpull:USDC');
    });

    it('includes SPAM features and excludes non-suspicious features', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.SPAM,
              metadata: {
                features: [
                  makeFeature(
                    'IMPERSONATOR_HIGH_CONFIDENCE',
                    BridgeAssetSecurityDataType.SPAM,
                  ),
                  makeFeature(
                    'KNOWN_MALICIOUS',
                    BridgeAssetSecurityDataType.MALICIOUS,
                  ),
                ],
              },
            },
          }),
        ),
      );
      const titles = result.current.assetSuspiciousLocalizedFeatures.map(
        (f) => f.title,
      );
      expect(titles).toContain('bridgeSecurityDataKnownImpersonatorHigh:USDC');
      expect(titles).not.toContain('bridgeSecurityDataKnownMalicious:USDC');
    });

    it('silently drops features with an unrecognised featureId', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  makeFeature('HONEYPOT', BridgeAssetSecurityDataType.WARNING),
                  makeFeature(
                    'UNKNOWN_FEATURE_ID',
                    BridgeAssetSecurityDataType.WARNING,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetSuspiciousLocalizedFeatures).toHaveLength(1);
      expect(result.current.assetSuspiciousLocalizedFeatures[0].title).toBe(
        'bridgeSecurityDataKnownHoneypot:USDC',
      );
    });

    it('passes the token symbol into each localised title', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            symbol: 'DAI',
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  makeFeature(
                    'AIRDROP_PATTERN',
                    BridgeAssetSecurityDataType.WARNING,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetSuspiciousLocalizedFeatures[0].title).toBe(
        'bridgeSecurityDataKnownAirdrop:DAI',
      );
    });
  });

  // ─── assetMaliciousLocalizedFeatures ──────────────────────────────────────

  describe('assetMaliciousLocalizedFeatures', () => {
    it('returns an empty array when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetMaliciousLocalizedFeatures).toStrictEqual([]);
    });

    it('returns an empty array when metadata is absent', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
          }),
        ),
      );
      expect(result.current.assetMaliciousLocalizedFeatures).toStrictEqual([]);
    });

    it('includes MALICIOUS features and excludes WARNING and SPAM features', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
                  makeFeature('HONEYPOT', BridgeAssetSecurityDataType.WARNING),
                  makeFeature(
                    'IMPERSONATOR_HIGH_CONFIDENCE',
                    BridgeAssetSecurityDataType.SPAM,
                  ),
                ],
              },
            },
          }),
        ),
      );
      const titles = result.current.assetMaliciousLocalizedFeatures.map(
        (f) => f.title,
      );
      expect(titles).toContain('bridgeSecurityDataKnownRugpull:USDC');
      expect(titles).not.toContain('bridgeSecurityDataKnownHoneypot:USDC');
      expect(titles).not.toContain(
        'bridgeSecurityDataKnownImpersonatorHigh:USDC',
      );
    });

    it('silently drops features with an unrecognised featureId', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
                  makeFeature(
                    'UNKNOWN_FEATURE_ID',
                    BridgeAssetSecurityDataType.MALICIOUS,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetMaliciousLocalizedFeatures).toHaveLength(1);
      expect(result.current.assetMaliciousLocalizedFeatures[0].title).toBe(
        'bridgeSecurityDataKnownRugpull:USDC',
      );
    });

    it('passes the token symbol into each localised title', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            symbol: 'WBTC',
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  makeFeature(
                    'TOKEN_BACKDOOR',
                    BridgeAssetSecurityDataType.MALICIOUS,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetMaliciousLocalizedFeatures[0].title).toBe(
        'bridgeSecurityDataKnownTokenBackdoor:WBTC',
      );
    });

    it('returns multiple entries when there are several malicious features', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
                  makeFeature(
                    'KNOWN_MALICIOUS',
                    BridgeAssetSecurityDataType.MALICIOUS,
                  ),
                  makeFeature(
                    'TOKEN_BACKDOOR',
                    BridgeAssetSecurityDataType.MALICIOUS,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetMaliciousLocalizedFeatures).toHaveLength(3);
    });
  });

  // ─── assetSuspiciousFeatures ──────────────────────────────────────────────

  describe('assetSuspiciousFeatures', () => {
    it('returns an empty array when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetSuspiciousFeatures).toStrictEqual([]);
    });

    it('returns an empty array when metadata is absent', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }),
        ),
      );
      expect(result.current.assetSuspiciousFeatures).toStrictEqual([]);
    });

    it('returns WARNING and SPAM features, excluding MALICIOUS ones', () => {
      const warningFeature = makeFeature(
        'HONEYPOT',
        BridgeAssetSecurityDataType.WARNING,
      );
      const spamFeature = makeFeature(
        'IMPERSONATOR_HIGH_CONFIDENCE',
        BridgeAssetSecurityDataType.SPAM,
      );
      const maliciousFeature = makeFeature(
        'RUGPULL',
        BridgeAssetSecurityDataType.MALICIOUS,
      );

      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [warningFeature, spamFeature, maliciousFeature],
              },
            },
          }),
        ),
      );

      expect(result.current.assetSuspiciousFeatures).toHaveLength(2);
      expect(result.current.assetSuspiciousFeatures).toContainEqual(
        warningFeature,
      );
      expect(result.current.assetSuspiciousFeatures).toContainEqual(
        spamFeature,
      );
      expect(result.current.assetSuspiciousFeatures).not.toContainEqual(
        maliciousFeature,
      );
    });

    it('returns an empty array when all features are MALICIOUS', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetSuspiciousFeatures).toStrictEqual([]);
    });
  });

  // ─── assetMaliciousFeatures ───────────────────────────────────────────────

  describe('assetMaliciousFeatures', () => {
    it('returns an empty array when there is no securityData', () => {
      const { result } = renderHook(() => useAssetSecurityData(makeToken()));
      expect(result.current.assetMaliciousFeatures).toStrictEqual([]);
    });

    it('returns an empty array when metadata is absent', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
          }),
        ),
      );
      expect(result.current.assetMaliciousFeatures).toStrictEqual([]);
    });

    it('returns only MALICIOUS features, excluding WARNING and SPAM ones', () => {
      const maliciousFeature = makeFeature(
        'RUGPULL',
        BridgeAssetSecurityDataType.MALICIOUS,
      );
      const warningFeature = makeFeature(
        'HONEYPOT',
        BridgeAssetSecurityDataType.WARNING,
      );
      const spamFeature = makeFeature(
        'IMPERSONATOR_HIGH_CONFIDENCE',
        BridgeAssetSecurityDataType.SPAM,
      );

      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [maliciousFeature, warningFeature, spamFeature],
              },
            },
          }),
        ),
      );

      expect(result.current.assetMaliciousFeatures).toHaveLength(1);
      expect(result.current.assetMaliciousFeatures).toContainEqual(
        maliciousFeature,
      );
      expect(result.current.assetMaliciousFeatures).not.toContainEqual(
        warningFeature,
      );
      expect(result.current.assetMaliciousFeatures).not.toContainEqual(
        spamFeature,
      );
    });

    it('returns multiple MALICIOUS features', () => {
      const rugpull = makeFeature(
        'RUGPULL',
        BridgeAssetSecurityDataType.MALICIOUS,
      );
      const knownMalicious = makeFeature(
        'KNOWN_MALICIOUS',
        BridgeAssetSecurityDataType.MALICIOUS,
      );

      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: { features: [rugpull, knownMalicious] },
            },
          }),
        ),
      );

      expect(result.current.assetMaliciousFeatures).toHaveLength(2);
      expect(result.current.assetMaliciousFeatures).toContainEqual(rugpull);
      expect(result.current.assetMaliciousFeatures).toContainEqual(
        knownMalicious,
      );
    });

    it('returns an empty array when all features are WARNING or SPAM', () => {
      const { result } = renderHook(() =>
        useAssetSecurityData(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  makeFeature('HONEYPOT', BridgeAssetSecurityDataType.WARNING),
                  makeFeature(
                    'IMPERSONATOR_HIGH_CONFIDENCE',
                    BridgeAssetSecurityDataType.SPAM,
                  ),
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.assetMaliciousFeatures).toStrictEqual([]);
    });
  });

  // ─── memoization ──────────────────────────────────────────────────────────

  describe('memoization', () => {
    it('returns stable array references when the asset object does not change', () => {
      const token = makeToken({
        securityData: {
          type: BridgeAssetSecurityDataType.MALICIOUS,
          metadata: {
            features: [
              makeFeature('RUGPULL', BridgeAssetSecurityDataType.MALICIOUS),
            ],
          },
        },
      });

      const { result, rerender } = renderHook(() =>
        useAssetSecurityData(token),
      );

      const firstMalicious = result.current.assetMaliciousLocalizedFeatures;
      const firstSuspicious = result.current.assetSuspiciousLocalizedFeatures;

      rerender();

      expect(result.current.assetMaliciousLocalizedFeatures).toBe(
        firstMalicious,
      );
      expect(result.current.assetSuspiciousLocalizedFeatures).toBe(
        firstSuspicious,
      );
    });
  });
});

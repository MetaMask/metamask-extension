import { mapAssetSecurityDataFeatureToLocalizedFormat } from './asset-features';
import { BridgeAssetSecurityDataType } from './tokens';

const mockT = (key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key;

const makeFeature = (
  featureId: string,
  type: BridgeAssetSecurityDataType = BridgeAssetSecurityDataType.MALICIOUS,
  description = 'some description',
) => ({ featureId, type, description });

describe('mapAssetSecurityDataFeatureToLocalizedFormat', () => {
  const SYMBOL = 'ETH';
  const mapper = mapAssetSecurityDataFeatureToLocalizedFormat(SYMBOL, mockT);

  it('returns null for an unknown featureId', () => {
    const result = mapper(makeFeature('UNKNOWN_FEATURE_ID'));
    expect(result).toBeNull();
  });

  it('returns null for an empty featureId', () => {
    const result = mapper(makeFeature(''));
    expect(result).toBeNull();
  });

  it('passes the symbol to the title translation', () => {
    const result = mapper(makeFeature('KNOWN_MALICIOUS'));
    expect(result).not.toBeNull();
    expect(result?.title).toBe(`bridgeSecurityDataKnownMalicious:${SYMBOL}`);
  });

  it('returns null description when the entry has no description key', () => {
    const result = mapper(makeFeature('KNOWN_MALICIOUS'));
    expect(result?.description).toBeNull();
  });

  it('uses the provided symbol in the localized title', () => {
    const customMapper = mapAssetSecurityDataFeatureToLocalizedFormat(
      'DAI',
      mockT,
    );
    const result = customMapper(makeFeature('RUGPULL'));
    expect(result?.title).toBe('bridgeSecurityDataKnownRugpull:DAI');
  });

  it('returns correct title for every known featureId', () => {
    const knownEntries: { featureId: string; expectedTitleKey: string }[] = [
      {
        featureId: 'KNOWN_MALICIOUS',
        expectedTitleKey: 'bridgeSecurityDataKnownMalicious',
      },
      {
        featureId: 'METADATA',
        expectedTitleKey: 'bridgeSecurityDataKnownMetadata',
      },
      {
        featureId: 'IMPERSONATOR_SENSITIVE_ASSET',
        expectedTitleKey: 'bridgeSecurityDataKnownImpersonatorAsset',
      },
      {
        featureId: 'STATIC_CODE_SIGNATURE',
        expectedTitleKey: 'bridgeSecurityDataKnownStaticCodeSign',
      },
      {
        featureId: 'RUGPULL',
        expectedTitleKey: 'bridgeSecurityDataKnownRugpull',
      },
      {
        featureId: 'HIGH_TRANSFER_FEE',
        expectedTitleKey: 'bridgeSecurityDataKnownHighTransferFee',
      },
      {
        featureId: 'HIGH_BUY_FEE',
        expectedTitleKey: 'bridgeSecurityDataKnownHighBuyFee',
      },
      {
        featureId: 'HIGH_SELL_FEE',
        expectedTitleKey: 'bridgeSecurityDataKnownHighSellFee',
      },
      {
        featureId: 'UNSELLABLE_TOKEN',
        expectedTitleKey: 'bridgeSecurityDataKnownUnsellable',
      },
      {
        featureId: 'SANCTIONED_CREATOR',
        expectedTitleKey: 'bridgeSecurityDataKnownSanctionedCreator',
      },
      {
        featureId: 'SIMILAR_MALICIOUS_CONTRACT',
        expectedTitleKey: 'bridgeSecurityDataKnownSimilarMaliciousContract',
      },
      {
        featureId: 'TOKEN_BACKDOOR',
        expectedTitleKey: 'bridgeSecurityDataKnownTokenBackdoor',
      },
      {
        featureId: 'POST_DUMP',
        expectedTitleKey: 'bridgeSecurityDataKnownPostDump',
      },
      {
        featureId: 'IMPERSONATOR_HIGH_CONFIDENCE',
        expectedTitleKey: 'bridgeSecurityDataKnownImpersonatorHigh',
      },
      {
        featureId: 'IMPERSONATOR_MEDIUM_CONFIDENCE',
        expectedTitleKey: 'bridgeSecurityDataKnownImpersonatorMedium',
      },
      {
        featureId: 'AIRDROP_PATTERN',
        expectedTitleKey: 'bridgeSecurityDataKnownAirdrop',
      },
      {
        featureId: 'IMPERSONATOR',
        expectedTitleKey: 'bridgeSecurityDataKnownImpersonator',
      },
      {
        featureId: 'INORGANIC_VOLUME',
        expectedTitleKey: 'bridgeSecurityDataKnownInorganicVoume',
      },
      {
        featureId: 'DYNAMIC_ANALYSIS',
        expectedTitleKey: 'bridgeSecurityDataKnownDynamicAnalysis',
      },
      {
        featureId: 'UNSTABLE_TOKEN_PRICE',
        expectedTitleKey: 'bridgeSecurityDataKnownUnstablePrice',
      },
      {
        featureId: 'INAPPROPRIATE_CONTENT',
        expectedTitleKey: 'bridgeSecurityDataKnownInappropriateContent',
      },
      {
        featureId: 'HONEYPOT',
        expectedTitleKey: 'bridgeSecurityDataKnownHoneypot',
      },
      {
        featureId: 'SPAM_TEXT',
        expectedTitleKey: 'bridgeSecurityDataKnownSpamText',
      },
      {
        featureId: 'INSUFFICIENT_LOCKED_LIQUIDITY',
        expectedTitleKey: 'bridgeSecurityDataKnownInsufficientLiquidity',
      },
      {
        featureId: 'CONCENTRATED_SUPPLY_DISTRIBUTION',
        expectedTitleKey: 'bridgeSecurityDataKnownConcentratedSupply',
      },
      {
        featureId: 'WASH_TRADING',
        expectedTitleKey: 'bridgeSecurityDataKnownWashTrading',
      },
      {
        featureId: 'FAKE_VOLUME',
        expectedTitleKey: 'bridgeSecurityDataKnownFakeVolume',
      },
      {
        featureId: 'HIDDEN_SUPPLY_BY_KEY_HOLDER',
        expectedTitleKey: 'bridgeSecurityDataKnownHiddenSupplyByKeyHolder',
      },
      {
        featureId: 'HEAVILY_SNIPED',
        expectedTitleKey: 'bridgeSecurityDataKnownHeavilySniped',
      },
      {
        featureId: 'FAKE_TRADE_MAKER_COUNT',
        expectedTitleKey: 'bridgeSecurityDataKnownFakeTradeMakerCount',
      },
      {
        featureId: 'LOW_REPUTATION_CREATOR',
        expectedTitleKey: 'bridgeSecurityDataKnownLowReputation',
      },
      {
        featureId: 'SNIPE_AT_MINT',
        expectedTitleKey: 'bridgeSecurityDataKnownSnipeMint',
      },
    ];

    for (const { featureId, expectedTitleKey } of knownEntries) {
      const result = mapper(makeFeature(featureId));
      expect(result).not.toBeNull();
      expect(result?.title).toBe(`${expectedTitleKey}:${SYMBOL}`);
      expect(result?.description).toBeNull();
    }
  });

  it('ignores the feature description field from the input (entries have no description translation key)', () => {
    const result = mapper(
      makeFeature(
        'HONEYPOT',
        BridgeAssetSecurityDataType.WARNING,
        'custom desc',
      ),
    );
    expect(result?.description).toBeNull();
  });

  it('uses a fresh translation function per call', () => {
    const calls: string[] = [];
    const trackingT = (key: string, args?: string[]) => {
      calls.push(key);
      return args ? `${key}:${args.join(',')}` : key;
    };
    const trackingMapper = mapAssetSecurityDataFeatureToLocalizedFormat(
      SYMBOL,
      trackingT,
    );
    trackingMapper(makeFeature('RUGPULL'));
    expect(calls).toContain('bridgeSecurityDataKnownRugpull');
  });
});

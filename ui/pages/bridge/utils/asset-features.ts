import { BridgeAssetSecurityDataType } from './tokens';

const featureIdsMap: Record<
  string,
  { title: string; description: string | null }
> = {
  // ===
  // MALICIOUS TYPE
  // ===
  KNOWN_MALICIOUS: {
    title: 'bridgeSecurityDataKnownMalicious',
    description: null,
  },
  METADATA: {
    title: 'bridgeSecurityDataKnownMetadata',
    description: null,
  },
  IMPERSONATOR_SENSITIVE_ASSET: {
    title: 'bridgeSecurityDataKnownImpersonatorAsset',
    description: null,
  },
  STATIC_CODE_SIGNATURE: {
    title: 'bridgeSecurityDataKnownStaticCodeSign',
    description: null,
  },
  RUGPULL: {
    title: 'bridgeSecurityDataKnownRugpull',
    description: null,
  },
  HIGH_TRANSFER_FEE: {
    title: 'bridgeSecurityDataKnownHighTransferFee',
    description: null,
  },
  HIGH_BUY_FEE: {
    title: 'bridgeSecurityDataKnownHighBuyFee',
    description: null,
  },
  HIGH_SELL_FEE: {
    title: 'bridgeSecurityDataKnownHighSellFee',
    description: null,
  },
  UNSELLABLE_TOKEN: {
    title: 'bridgeSecurityDataKnownUnsellable',
    description: null,
  },
  SANCTIONED_CREATOR: {
    title: 'bridgeSecurityDataKnownSanctionedCreator',
    description: null,
  },
  SIMILAR_MALICIOUS_CONTRACT: {
    title: 'bridgeSecurityDataKnownSimilarMaliciousContract',
    description: null,
  },
  TOKEN_BACKDOOR: {
    title: 'bridgeSecurityDataKnownTokenBackdoor',
    description: null,
  },
  POST_DUMP: {
    title: 'bridgeSecurityDataKnownPostDump',
    description: null,
  },

  // ===
  // SPAM TYPE
  // ===
  IMPERSONATOR_HIGH_CONFIDENCE: {
    title: 'bridgeSecurityDataKnownImpersonatorHigh',
    description: null,
  },
  IMPERSONATOR_MEDIUM_CONFIDENCE: {
    title: 'bridgeSecurityDataKnownImpersonatorMedium',
    description: null,
  },

  // ===
  // WARNING TYPE
  // ===
  AIRDROP_PATTERN: {
    title: 'bridgeSecurityDataKnownAirdrop',
    description: null,
  },
  IMPERSONATOR: {
    title: 'bridgeSecurityDataKnownImpersonator',
    description: null,
  },
  INORGANIC_VOLUME: {
    title: 'bridgeSecurityDataKnownInorganicVoume',
    description: null,
  },
  DYNAMIC_ANALYSIS: {
    title: 'bridgeSecurityDataKnownDynamicAnalysis',
    description: null,
  },
  UNSTABLE_TOKEN_PRICE: {
    title: 'bridgeSecurityDataKnownUnstablePrice',
    description: null,
  },
  INAPPROPRIATE_CONTENT: {
    title: 'bridgeSecurityDataKnownInappropriateContent',
    description: null,
  },
  HONEYPOT: {
    title: 'bridgeSecurityDataKnownHoneypot',
    description: null,
  },
  SPAM_TEXT: {
    title: 'bridgeSecurityDataKnownSpamText',
    description: null,
  },
  INSUFFICIENT_LOCKED_LIQUIDITY: {
    title: 'bridgeSecurityDataKnownInsufficientLiquidity',
    description: null,
  },
  CONCENTRATED_SUPPLY_DISTRIBUTION: {
    title: 'bridgeSecurityDataKnownConcentratedSupply',
    description: null,
  },
  WASH_TRADING: {
    title: 'bridgeSecurityDataKnownWashTrading',
    description: null,
  },
  FAKE_VOLUME: {
    title: 'bridgeSecurityDataKnownFakeVolume',
    description: null,
  },
  HIDDEN_SUPPLY_BY_KEY_HOLDER: {
    title: 'bridgeSecurityDataKnownHiddenSupplyByKeyHolder',
    description: null,
  },
  HEAVILY_SNIPED: {
    title: 'bridgeSecurityDataKnownHeavilySniped',
    description: null,
  },
  FAKE_TRADE_MAKER_COUNT: {
    title: 'bridgeSecurityDataKnownFakeTradeMakerCount',
    description: null,
  },
  LOW_REPUTATION_CREATOR: {
    title: 'bridgeSecurityDataKnownLowReputation',
    description: null,
  },
  SNIPE_AT_MINT: {
    title: 'bridgeSecurityDataKnownSnipeMint',
    description: null,
  },
};

export const mapAssetSecurityDataFeatureToLocalizedFormat =
  (symbol: string, t: Function) =>
  (feature: {
    featureId: string;
    type: BridgeAssetSecurityDataType;
    description: string;
  }) => {
    const entry = featureIdsMap[feature.featureId];

    if (!entry) {
      return null;
    }

    return {
      title: t(entry.title, [symbol]),
      description: entry.description ? t(entry.description, [symbol]) : null,
    };
  };

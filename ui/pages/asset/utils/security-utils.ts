import { IconColor, IconName, TextColor } from '@metamask/design-system-react';
import type {
  FeatureTag,
  TokenSecurityData,
  TokenSecurityFeature,
  TokenSecurityFees,
  TokenSecurityFinancialStats,
} from '../types/security-trust';

export type SecurityTrustTranslate = (
  key: string,
  substitutions?: string[],
) => string;

export type SecurityAlertSeverity = 'success' | 'warning' | 'danger';

export type ResultTypeConfig = {
  label: string;
  textColor: TextColor;
  subtitle?: string;
  icon?: IconName;
  iconColor?: IconColor;
  alertSeverity?: SecurityAlertSeverity;
  badge?: {
    icon: IconName;
    iconColor: IconColor;
    alertSeverity?: SecurityAlertSeverity;
    label: string | null;
    backgroundColor?: 'warning-muted' | 'error-muted';
    textColor?: TextColor;
  } | null;
  sheetTitle?: string;
  getSheetDescription?: (tokenSymbol: string | undefined) => string;
};

export const getResultTypeConfig = (
  resultType: string | undefined,
  t: SecurityTrustTranslate,
): ResultTypeConfig => {
  switch (resultType) {
    case 'Verified':
      return {
        label: t('securityTrustVerified'),
        textColor: TextColor.SuccessDefault,
        subtitle: t('securityTrustSubtitleKnown'),
        icon: IconName.SecurityTick,
        iconColor: IconColor.SuccessDefault,
        alertSeverity: 'success',
        badge: {
          icon: IconName.VerifiedFilled,
          iconColor: IconColor.InfoDefault,
          label: null,
          backgroundColor: undefined,
          textColor: undefined,
        },
        sheetTitle: t('securityTrustVerifiedTokenTitle'),
        getSheetDescription: (symbol) =>
          t('securityTrustVerifiedTokenDescription', [symbol ?? '']),
      };
    case 'Benign':
      return {
        label: t('securityTrustNoIssues'),
        textColor: TextColor.SuccessDefault,
        subtitle: t('securityTrustSubtitleNoIssues'),
        icon: IconName.SecurityTick,
        iconColor: IconColor.SuccessDefault,
        alertSeverity: 'success',
        badge: null,
      };
    case 'Warning':
    case 'Spam':
      return {
        label: t('securityTrustSuspicious'),
        textColor: TextColor.WarningDefault,
        subtitle: t('securityTrustSubtitleSuspicious'),
        icon: IconName.Warning,
        iconColor: IconColor.WarningDefault,
        alertSeverity: 'warning',
        badge: {
          icon: IconName.Warning,
          iconColor: IconColor.WarningDefault,
          alertSeverity: 'warning',
          label: t('securityTrustRisky'),
          backgroundColor: 'warning-muted',
          textColor: TextColor.WarningDefault,
        },
        sheetTitle: t('securityTrustRiskyTokenTitle'),
        getSheetDescription: (symbol) =>
          symbol
            ? t('securityTrustRiskyTokenDescription', [symbol])
            : t('securityTrustRiskyTokenDescriptionNoSymbol'),
      };
    case 'Malicious':
      return {
        label: t('securityTrustMaliciousLabel'),
        textColor: TextColor.ErrorDefault,
        subtitle: t('securityTrustSubtitleMalicious'),
        icon: IconName.Error,
        iconColor: IconColor.ErrorDefault,
        alertSeverity: 'danger',
        badge: {
          icon: IconName.Danger,
          iconColor: IconColor.ErrorDefault,
          alertSeverity: 'danger',
          label: t('securityTrustMalicious'),
          backgroundColor: 'error-muted',
          textColor: TextColor.ErrorDefault,
        },
        sheetTitle: t('securityTrustMaliciousTokenTitle'),
        getSheetDescription: (symbol) =>
          symbol
            ? t('securityTrustMaliciousTokenSheetDescription', [symbol])
            : t('securityTrustMaliciousTokenSheetDescriptionNoSymbol'),
      };
    default:
      return {
        label: t('securityTrustDataUnavailable'),
        textColor: TextColor.TextAlternative,
        subtitle: t('securityTrustSubtitleUnavailable'),
      };
  }
};

export type BlockaidFeatureType =
  | 'Benign'
  | 'Info'
  | 'Warning'
  | 'Spam'
  | 'Malicious';

type FeatureDefinition = {
  label: string;
  type: BlockaidFeatureType;
};

const getPositiveFeatureLabels = (
  t: SecurityTrustTranslate,
): Record<string, FeatureDefinition> => ({
  HIGH_REPUTATION_TOKEN: {
    label: t('securityTrustFeatureHighReputationToken'),
    type: 'Benign',
  },
  LISTED_ON_CENTRALIZED_EXCHANGE: {
    label: t('securityTrustFeatureListedOnCentralizedExchange'),
    type: 'Benign',
  },
  VERIFIED_CONTRACT: {
    label: t('securityTrustFeatureVerifiedContract'),
    type: 'Info',
  },
  HIGH_TRADE_VOLUME: {
    label: t('securityTrustFeatureHighTradeVolume'),
    type: 'Info',
  },
});

export const getNegativeFeatureLabels = (
  t: SecurityTrustTranslate,
): Record<string, FeatureDefinition> => ({
  KNOWN_MALICIOUS: {
    label: t('securityTrustFeatureKnownMalicious'),
    type: 'Malicious',
  },
  METADATA: {
    label: t('securityTrustFeatureMetadata'),
    type: 'Malicious',
  },
  IMPERSONATOR_SENSITIVE_ASSET: {
    label: t('securityTrustFeatureImpersonatorSensitiveAsset'),
    type: 'Malicious',
  },
  STATIC_CODE_SIGNATURE: {
    label: t('securityTrustFeatureStaticCodeSignature'),
    type: 'Malicious',
  },
  RUGPULL: {
    label: t('securityTrustFeatureRugpull'),
    type: 'Malicious',
  },
  HIGH_TRANSFER_FEE: {
    label: t('securityTrustFeatureHighTransferFee'),
    type: 'Malicious',
  },
  HIGH_BUY_FEE: {
    label: t('securityTrustFeatureHighBuyFee'),
    type: 'Malicious',
  },
  HIGH_SELL_FEE: {
    label: t('securityTrustFeatureHighSellFee'),
    type: 'Malicious',
  },
  UNSELLABLE_TOKEN: {
    label: t('securityTrustFeatureUnsellableToken'),
    type: 'Malicious',
  },
  SANCTIONED_CREATOR: {
    label: t('securityTrustFeatureSanctionedCreator'),
    type: 'Malicious',
  },
  SIMILAR_MALICIOUS_CONTRACT: {
    label: t('securityTrustFeatureSimilarMaliciousContract'),
    type: 'Malicious',
  },
  TOKEN_BACKDOOR: {
    label: t('securityTrustFeatureTokenBackdoor'),
    type: 'Malicious',
  },
  POST_DUMP: {
    label: t('securityTrustFeaturePostDump'),
    type: 'Malicious',
  },
  IMPERSONATOR_HIGH_CONFIDENCE: {
    label: t('securityTrustFeatureImpersonatorHighConfidence'),
    type: 'Spam',
  },
  IMPERSONATOR_MEDIUM_CONFIDENCE: {
    label: t('securityTrustFeatureImpersonatorMediumConfidence'),
    type: 'Spam',
  },
  AIRDROP_PATTERN: {
    label: t('securityTrustFeatureAirdropPattern'),
    type: 'Warning',
  },
  IMPERSONATOR: {
    label: t('securityTrustFeatureImpersonator'),
    type: 'Warning',
  },
  INORGANIC_VOLUME: {
    label: t('securityTrustFeatureInorganicVolume'),
    type: 'Warning',
  },
  DYNAMIC_ANALYSIS: {
    label: t('securityTrustFeatureDynamicAnalysis'),
    type: 'Warning',
  },
  UNSTABLE_TOKEN_PRICE: {
    label: t('securityTrustFeatureUnstableTokenPrice'),
    type: 'Warning',
  },
  INAPPROPRIATE_CONTENT: {
    label: t('securityTrustFeatureInappropriateContent'),
    type: 'Warning',
  },
  HONEYPOT: {
    label: t('securityTrustFeatureHoneypot'),
    type: 'Warning',
  },
  SPAM_TEXT: {
    label: t('securityTrustFeatureSpamText'),
    type: 'Warning',
  },
  INSUFFICIENT_LOCKED_LIQUIDITY: {
    label: t('securityTrustFeatureInsufficientLockedLiquidity'),
    type: 'Warning',
  },
  CONCENTRATED_SUPPLY_DISTRIBUTION: {
    label: t('securityTrustFeatureConcentratedSupplyDistribution'),
    type: 'Warning',
  },
  WASH_TRADING: {
    label: t('securityTrustFeatureWashTrading'),
    type: 'Warning',
  },
  FAKE_VOLUME: {
    label: t('securityTrustFeatureFakeVolume'),
    type: 'Warning',
  },
  HIDDEN_SUPPLY_BY_KEY_HOLDER: {
    label: t('securityTrustFeatureHiddenSupplyByKeyHolder'),
    type: 'Warning',
  },
  HEAVILY_SNIPED: {
    label: t('securityTrustFeatureHeavilySniped'),
    type: 'Warning',
  },
  FAKE_TRADE_MAKER_COUNT: {
    label: t('securityTrustFeatureFakeTradeMakerCount'),
    type: 'Warning',
  },
  LOW_REPUTATION_CREATOR: {
    label: t('securityTrustFeatureLowReputationCreator'),
    type: 'Warning',
  },
  SNIPE_AT_MINT: {
    label: t('securityTrustFeatureSnipeAtMint'),
    type: 'Warning',
  },
  IMPERSONATOR_LOW_CONFIDENCE: {
    label: t('securityTrustFeatureImpersonatorLowConfidence'),
    type: 'Warning',
  },
  IS_MINTABLE: {
    label: t('securityTrustFeatureIsMintable'),
    type: 'Info',
  },
  CAN_BLACKLIST: {
    label: t('securityTrustFeatureCanBlacklist'),
    type: 'Info',
  },
  CAN_WHITELIST: {
    label: t('securityTrustFeatureCanWhitelist'),
    type: 'Info',
  },
  HAS_TRADING_COOLDOWN: {
    label: t('securityTrustFeatureHasTradingCooldown'),
    type: 'Info',
  },
  EXTERNAL_FUNCTIONS: {
    label: t('securityTrustFeatureExternalFunctions'),
    type: 'Info',
  },
  HIDDEN_OWNER: {
    label: t('securityTrustFeatureHiddenOwner'),
    type: 'Info',
  },
  TRANSFER_PAUSEABLE: {
    label: t('securityTrustFeatureTransferPauseable'),
    type: 'Info',
  },
  PROXY_CONTRACT: {
    label: t('securityTrustFeatureProxyContract'),
    type: 'Info',
  },
  MODIFIABLE_TAXES: {
    label: t('securityTrustFeatureModifiableTaxes'),
    type: 'Info',
  },
  OWNER_CAN_CHANGE_BALANCE: {
    label: t('securityTrustFeatureOwnerCanChangeBalance'),
    type: 'Info',
  },
  TRANSFER_FROM_REVERTS: {
    label: t('securityTrustFeatureTransferFromReverts'),
    type: 'Info',
  },
  TRANSFER_HOOK_ENABLED: {
    label: t('securityTrustFeatureTransferHookEnabled'),
    type: 'Info',
  },
  CONFIDENTIAL_TRANSFERS_ENABLED: {
    label: t('securityTrustFeatureConfidentialTransfersEnabled'),
    type: 'Info',
  },
  NON_TRANSERABLE: {
    label: t('securityTrustFeatureNonTranserable'),
    type: 'Info',
  },
});

export type FeatureTagsResult = {
  tags: FeatureTag[];
  remainingCount: number;
};

const FEATURE_TAG_DISPLAY_MAX = 3;
const POSITIVE_FEATURE_TAG_DISPLAY_MAX = 4;

const collectNegativeFeatureTags = (
  features: TokenSecurityFeature[],
  negativeLabels: Record<string, FeatureDefinition>,
  matchingTypes: BlockaidFeatureType[],
  showAll: boolean,
  maxTags: number,
): { tags: FeatureTag[]; totalMatching: number } => {
  const tags: FeatureTag[] = [];
  let totalMatching = 0;

  for (const feature of features) {
    const def = negativeLabels[feature.featureId];
    if (def && matchingTypes.includes(def.type)) {
      totalMatching += 1;
      if (showAll || tags.length < maxTags) {
        tags.push({ label: def.label });
      }
    }
  }

  return { tags, totalMatching };
};

const collectPositiveFeatureTags = (
  features: TokenSecurityFeature[],
  t: SecurityTrustTranslate,
  showAll: boolean,
): FeatureTag[] => {
  const positiveLabels = getPositiveFeatureLabels(t);
  const tags: FeatureTag[] = [];

  for (const feature of features) {
    const def = positiveLabels[feature.featureId];
    if (def && (showAll || tags.length < POSITIVE_FEATURE_TAG_DISPLAY_MAX)) {
      tags.push({ label: def.label });
    }
  }

  return tags;
};

const buildNegativeFeatureTagsResult = (
  features: TokenSecurityFeature[],
  matchingTypes: BlockaidFeatureType[],
  t: SecurityTrustTranslate,
  showAll: boolean,
): FeatureTagsResult => {
  const { tags, totalMatching } = collectNegativeFeatureTags(
    features,
    getNegativeFeatureLabels(t),
    matchingTypes,
    showAll,
    FEATURE_TAG_DISPLAY_MAX,
  );

  return {
    tags,
    remainingCount: showAll
      ? 0
      : Math.max(0, totalMatching - FEATURE_TAG_DISPLAY_MAX),
  };
};

export const getFeatureTags = (
  features: TokenSecurityFeature[],
  resultType: TokenSecurityData['resultType'] | undefined,
  t: SecurityTrustTranslate,
  showAll = false,
): FeatureTagsResult => {
  if (resultType === 'Malicious') {
    return buildNegativeFeatureTagsResult(features, ['Malicious'], t, showAll);
  }

  if (resultType === 'Warning' || resultType === 'Spam') {
    return buildNegativeFeatureTagsResult(
      features,
      ['Warning', 'Spam'],
      t,
      showAll,
    );
  }

  return {
    tags: collectPositiveFeatureTags(features, t, showAll),
    remainingCount: 0,
  };
};

export const formatFeePercent = (fee: number | null | undefined): string => {
  if (fee === null || fee === undefined) {
    return 'N/A';
  }
  return `${fee.toFixed(1)}%`;
};

const hasHiddenFee = (fee: number | null | undefined): boolean =>
  fee !== null && fee !== undefined && fee > 0;

export const hasNoHiddenFees = (
  fees: TokenSecurityFees | null | undefined,
): boolean => {
  if (!fees) {
    return false;
  }

  return (
    !hasHiddenFee(fees.buy) &&
    !hasHiddenFee(fees.sell) &&
    !hasHiddenFee(fees.transfer)
  );
};

export const getTop10HoldingPct = (
  financialStats: TokenSecurityFinancialStats | null | undefined,
): number | null => {
  if (!financialStats?.topHolders?.length) {
    return null;
  }
  const sum = financialStats.topHolders.reduce(
    (acc, h) => acc + (h.holdingPercentage ?? 0),
    0,
  );
  return Math.min(sum, 100);
};

export const formatCompactSupply = (
  supply: number | null | undefined,
  decimals?: number,
): string => {
  if (supply === null || supply === undefined) {
    return 'N/A';
  }
  const adjusted =
    decimals !== null && decimals !== undefined && decimals > 0
      ? supply / 10 ** decimals
      : supply;
  const units: [number, string][] = [
    [1e15, 'Q'],
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [threshold, suffix] of units) {
    if (adjusted >= threshold) {
      return `${(adjusted / threshold).toFixed(2)}${suffix}`;
    }
  }
  return adjusted.toFixed(0);
};

export const getSecurityAlertIconProps = (
  severity: SecurityAlertSeverity | undefined,
): { name: IconName; color: IconColor } | null => {
  switch (severity) {
    case 'success':
      return {
        name: IconName.SecurityTick,
        color: IconColor.SuccessDefault,
      };
    case 'warning':
      return {
        name: IconName.Warning,
        color: IconColor.WarningDefault,
      };
    case 'danger':
      return {
        name: IconName.Danger,
        color: IconColor.ErrorDefault,
      };
    default:
      return null;
  }
};

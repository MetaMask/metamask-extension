export type {
  TokenSecurityData,
  TokenSecurityFeature,
  TokenSecurityFees,
  TokenSecurityFinancialStats,
  TokenSecurityHolder,
  TokenSecurityMarket,
  TokenSecurityMetadata,
} from '@metamask/assets-controllers';

export type FeatureTag = {
  label: string;
};

export type SecurityTrustLocationState = {
  securityData?:
    | import('@metamask/assets-controllers').TokenSecurityData
    | null;
  symbol?: string;
  name?: string;
  decimals?: number;
  isNative?: boolean;
  image?: string;
  chainId?: string;
  address?: string;
};

import type { SecurityTrustSheetSource } from './security-trust-sheet-types';

/** Segment schema property names for Security & Trust analytics events. */
export const SecurityTrustAnalyticsProperty = {
  Action: 'action',
  ChainId: 'chain_id',
  CtaType: 'cta_type',
  Source: 'source',
  TimeSpentMs: 'time_spent_ms',
  TokenAddress: 'token_address',
  TokenSymbol: 'token_symbol',
} as const;

export const getSheetAnalyticsSource = (
  source: SecurityTrustSheetSource,
): 'Buy' | 'Swap' | 'badge' => {
  if (source === 'buy') {
    return 'Buy';
  }

  if (source === 'swap') {
    return 'Swap';
  }

  return 'badge';
};

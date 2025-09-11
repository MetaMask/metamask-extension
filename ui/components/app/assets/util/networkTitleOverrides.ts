import {
  CURRENCY_SYMBOLS,
  NON_EVM_CURRENCY_SYMBOLS,
} from '../../../../../shared/constants/network';
import { TokenFiatDisplayInfo } from '../types';

export type TranslateFunction = (arg: string) => string;

// overrides certain token titles to display network name over token title
// usually in the case of native tokens for L1 networks
export const networkTitleOverrides = (
  t: TranslateFunction, // translate function from useI18nContext() hook
  token: Partial<TokenFiatDisplayInfo>,
) => {
  switch (token.title) {
    case CURRENCY_SYMBOLS.ETH:
      return t('networkNameEthereum');
    case NON_EVM_CURRENCY_SYMBOLS.BTC:
      return t('networkNameBitcoin');
    case NON_EVM_CURRENCY_SYMBOLS.SOL:
      return t('networkNameSolana');
    default:
      return token.title;
  }
};

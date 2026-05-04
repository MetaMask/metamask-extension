import { useRef } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';

import {
  getBridgeQuotes,
  getFromToken,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { getHardwareWalletType } from '../../../selectors/selectors';

export function useHwSwapQuoteData() {
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const hardwareWalletType = useSelector(getHardwareWalletType);

  const lockedQuoteRef = useRef(activeQuote);
  if (activeQuote && !lockedQuoteRef.current) {
    lockedQuoteRef.current = activeQuote;
  }
  const lockedQuote = lockedQuoteRef.current;

  return {
    activeQuote,
    lockedQuote,
    fromToken,
    toToken,
    hardwareWalletType,
  };
}

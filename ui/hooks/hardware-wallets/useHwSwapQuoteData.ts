import { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';

import {
  getBridgeQuotes,
  getFromToken,
  getToToken,
} from '../../ducks/bridge/selectors';
import { getHardwareWalletType } from '../../../shared/lib/selectors/keyring';

/**
 * Provides quote and token data for hardware wallet swap/bridge flows.
 *
 * Reads the active bridge quote, source token, destination token, and
 * hardware wallet type from Redux. Latches the first non-null `activeQuote`
 * into a `lockedQuote` ref so that the quote remains available even after
 * the active quote is cleared (e.g. during submission).
 *
 * @returns An object containing:
 * - `activeQuote` — the current active bridge quote from Redux.
 * - `lockedQuote` — the first active quote that was seen, latched for the lifetime of the flow.
 * - `fromToken` — the source token for the swap.
 * - `toToken` — the destination token for the swap.
 * - `hardwareWalletType` — the type of hardware wallet currently connected.
 */
export function useHwSwapQuoteData() {
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const hardwareWalletType = useSelector(getHardwareWalletType);

  const [lockedQuote, setLockedQuote] = useState(activeQuote);

  useEffect(() => {
    if (activeQuote && !lockedQuote) {
      queueMicrotask(() => {
        setLockedQuote(activeQuote);
      });
    }
  }, [activeQuote, lockedQuote]);

  return {
    activeQuote,
    lockedQuote: lockedQuote ?? activeQuote,
    fromToken,
    toToken,
    hardwareWalletType,
  };
}

import { useRef } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';

import {
  getBridgeQuotes,
  getFromToken,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { getHardwareWalletType } from '../../../selectors/selectors';

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

  const lockedQuoteRef = useRef(activeQuote);
  if (activeQuote && !lockedQuoteRef.current) {
    lockedQuoteRef.current = activeQuote;
    console.log(
      '[HW-Batch] useHwSwapQuoteData: latched activeQuote → lockedQuote',
      JSON.stringify({
        requestId: activeQuote?.quote?.requestId ?? null,
        hasApproval: Boolean(activeQuote?.approval),
      }),
    );
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

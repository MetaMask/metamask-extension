import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { ensureMusdTokenImportedForChain } from '../../components/app/musd/utils';
import { MUSD_TOKEN_ADDRESS_BY_CHAIN } from '../../components/app/musd/constants';
import { selectIsMusdConversionFlowEnabled } from '../../selectors/musd/feature-flags';
import type { MetaMaskReduxDispatch } from '../../store/store';

const SUPPORTED_MUSD_CHAIN_IDS = Object.keys(
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
) as Hex[];

/**
 * Registers mUSD in `TokensController.allTokens` for every supported chain
 * once the wallet is unlocked. This is the precondition for
 * `TokenRatesController` to fetch mUSD market data, which
 * `TransactionPayController.parseRequiredTokens` requires to keep mUSD in
 * `requiredTokens`. Mirrors `useEnsureMusdTokenRegistered` in mobile.
 */
export function useEnsureMusdTokenRegistered(): void {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const isFlowEnabled = useSelector(selectIsMusdConversionFlowEnabled);

  useEffect(() => {
    if (!isFlowEnabled) {
      return;
    }

    (async () => {
      for (const chainId of SUPPORTED_MUSD_CHAIN_IDS) {
        try {
          await ensureMusdTokenImportedForChain(chainId, dispatch);
        } catch (error) {
          console.warn(
            `[mUSD] Failed to register mUSD token for chain ${chainId}:`,
            error,
          );
        }
      }
    })().catch((error) => {
      console.warn('[mUSD] Unexpected error registering mUSD tokens:', error);
    });
  }, [dispatch, isFlowEnabled]);
}

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { Transaction } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import log from 'loglevel';
import {
  KnownCaipNamespace,
  isCaipChainId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../../store/background-connection';
import { getIsAssetsUnifyStateEnabled } from '../../../selectors/assets-unify-state';

const MULTICHAIN_TRANSACTION_CONFIRMED_EVENT =
  'MultichainTransactionsController:transactionConfirmed';

/**
 * Forces an uncached refresh of the unified AssetsController data for the
 * given Tron account.
 *
 * Tron assets that change over time without on-chain balance updates (energy,
 * bandwidth, staking state) are served from caches that can be minutes behind.
 * When the TRX token details page is opened, users expect the values shown to
 * be up to date, so this hook calls `AssetsController:getAssets` with
 * `forceUpdate` and `bypassServerCache`, bypassing both the local data source
 * caches and the Accounts API server-side cache.
 *
 * The controller publishes the refreshed state, and the UI picks it up through
 * the regular state sync — no local state is managed here.
 *
 * While the page stays open, a confirmed Tron transaction (send, stake,
 * unstake, etc.) triggers the same uncached fetch so already-visible values
 * are also refreshed.
 *
 * No-ops when the unified AssetsController feature flag is disabled (the
 * legacy MultichainAssetsController path keeps its polling behavior) or when
 * the chain is not Tron.
 *
 * @param account - The internal account to fetch fresh assets for.
 * @param chainId - The CAIP chain ID of the asset page.
 */
export const useFreshTronAssets = (
  account: InternalAccount | undefined,
  chainId: string,
): void => {
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);

  useEffect(() => {
    const isTronChain =
      isCaipChainId(chainId) &&
      parseCaipChainId(chainId).namespace === KnownCaipNamespace.Tron;

    if (!account || !isTronChain || !isAssetsUnifyStateEnabled) {
      return undefined;
    }

    const fetchFreshAssets = () => {
      submitRequestToBackground('messengerCall', [
        'AssetsController:getAssets',
        [
          [account],
          { chainIds: [chainId], forceUpdate: true, bypassServerCache: true },
        ],
      ]).catch(() => undefined);
    };

    // Fresh data when the page is opened.
    fetchFreshAssets();

    // Fresh data when a Tron transaction confirms while the page is open.
    let hasUnsubscribed = false;
    let unsubscribe: (() => Promise<void>) | undefined;

    const subscribe = async () => {
      const off = await subscribeToMessengerEvent<[Transaction]>(
        MULTICHAIN_TRANSACTION_CONFIRMED_EVENT,
        (payload) => {
          const transaction = Array.isArray(payload) ? payload[0] : payload;

          if (!transaction) {
            return;
          }

          const isRelevantTransaction =
            transaction.chain === chainId &&
            (transaction.account === account.id ||
              transaction.from?.some(
                (from) => from.address === account.address,
              ));

          if (isRelevantTransaction) {
            fetchFreshAssets();
          }
        },
      ).catch(() => undefined);

      if (!off) {
        return;
      }

      if (hasUnsubscribed) {
        await off().catch(() => undefined);
        return;
      }

      unsubscribe = off;
    };

    subscribe().catch((error: unknown) => {
      log.error('[useFreshTronAssets] subscription error', error);
    });

    return () => {
      hasUnsubscribed = true;
      unsubscribe?.().catch(() => undefined);
    };
  }, [account, chainId, isAssetsUnifyStateEnabled]);
};

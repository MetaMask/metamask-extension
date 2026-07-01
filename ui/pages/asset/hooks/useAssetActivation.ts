import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { errorCodes } from '@metamask/rpc-errors';
import { getAsset } from '../../../selectors/assets';
import type { CaipAssetType } from '@metamask/utils';
import { isAssetRequireActivate, isTrustlineAsset } from '../../../../shared/lib/multichain/trustline';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { requestStellarChangeTrustOptDelete } from '../utils/stellar-snap-client-requests';
import { getChainIdFromAssetId } from '../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import type { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * Keeps the activate / deactivate logic for a trustline-backed asset (e.g. a Stellar
 * classic asset) in one place, alongside the loading and error state for the operation.
 * @param options0
 * @param options0.assetId
 * @param options0.hasNonZeroBalance
 * @param options0.balanceDisplay
 * @param options0.symbol
 */
export const useAssetActivation = ({
  assetId,
  hasNonZeroBalance,
  balanceDisplay,
  symbol,
}: {
  assetId: CaipAssetType;
  hasNonZeroBalance: boolean;
  balanceDisplay?: string;
  symbol?: string;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = getChainIdFromAssetId(assetId);

  const account = useSelector((state) =>
    chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)
      : undefined,
  ) as InternalAccount | undefined;

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [trustlineRemoveErrorMessage, setTrustlineRemoveErrorMessage] =
    useState<string | null>(null);

  const dismissTrustlineRemoveErrorToast = useCallback(() => {
    setTrustlineRemoveErrorMessage(null);
  }, []);

  const assetFromState = useSelector((state) =>
    chainId ? getAsset(state, assetId, chainId) : undefined,
  );

  const canDeactivate =
    isTrustlineAsset(assetId) &&
    !isAssetRequireActivate({
      assetId,
      accountAssetInfo: assetFromState?.accountAssetInfo,
    });
  const deactivateAsset = useCallback(async () => {
    if (!canDeactivate || !account || !chainId) {
      return;
    }
    setTrustlineRemoveErrorMessage(null);
    setIsDeactivating(true);
    try {
      await requestStellarChangeTrustOptDelete({
        accountId: account.id,
        assetId,
        scope: chainId,
      });
      await forceUpdateMetamaskState(dispatch);
    } catch (error: unknown) {
      const errorCode = (error as { code?: number })?.code;
      const isUserRejection =
        errorCode === errorCodes.provider.userRejectedRequest;
      if (!isUserRejection) {
        setTrustlineRemoveErrorMessage(
          hasNonZeroBalance
            ? (t('stellarClassicTrustlineRemoveNonZeroBalanceError', [
                balanceDisplay ?? '0',
                symbol,
              ]) as string)
            : (t('stellarClassicTrustlineRemoveError') as string),
        );
      }
    } finally {
      setIsDeactivating(false);
    }
  }, [
    account,
    assetId,
    balanceDisplay,
    canDeactivate,
    chainId,
    dispatch,
    hasNonZeroBalance,
    symbol,
    t,
  ]);

  return {
    deactivateAsset,
    canDeactivate,
    isDeactivating,
    trustlineRemoveErrorMessage,
    dismissTrustlineRemoveErrorToast,
  };
};

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { errorCodes } from '@metamask/rpc-errors';
import type { InternalAccount } from '@metamask/keyring-internal-api';

import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { getAsset } from '../../../selectors/assets';
import {
  isAssetRequireActivate,
  isTrustlineAsset,
} from '../../../../shared/lib/multichain/trustline';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { forceUpdateMetamaskState } from '../../../store/actions';
import {
  requestStellarChangeTrustOptAdd,
  requestStellarChangeTrustOptDelete,
} from '../utils/stellar-snap-client-requests';
import { getChainIdFromAssetId } from '../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { AssetType } from '../../../../shared/constants/transaction';
import { Asset } from '../types/asset';
import { useDispatch } from '../../../store/hooks';

/**
 * Manages trustline activation and deactivation for supported assets (currently Stellar classic tokens).
 *
 * @param params - Hook parameters.
 * @param params.asset - Asset to activate or deactivate.
 * @returns Trustline actions, loading flags, error state, and whether deactivation is allowed.
 * For assets that do not require a trustline, actions are inert and deactivation is disabled.
 */
export const useAssetActivation = ({ asset }: { asset: Asset }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  // For non trusline asset, assetId and chainId are undefined.
  let assetId: CaipAssetType | undefined;
  let chainId: CaipChainId | undefined;
  let isAssetIsTrustlineAsset: boolean = false;
  if (asset.type === AssetType.token) {
    assetId = asset.address as CaipAssetType;
    isAssetIsTrustlineAsset = isTrustlineAsset(assetId);
    if (isAssetIsTrustlineAsset) {
      chainId = getChainIdFromAssetId(assetId);
    }
  }

  const account = useSelector((state) =>
    chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)
      : undefined,
  ) as InternalAccount | undefined;

  const assetFromState = useSelector((state) =>
    chainId && assetId ? getAsset(state, assetId, chainId) : undefined,
  );

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dismissErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const canDeactivate =
    assetId &&
    isAssetIsTrustlineAsset &&
    !isAssetRequireActivate({
      assetId,
      assetMetadata: assetFromState?.accountAssetInfo,
    });

  const deactivateAsset = useCallback(async () => {
    if (
      !canDeactivate ||
      !account ||
      !chainId ||
      !assetId ||
      !asset ||
      !asset.balance?.display
    ) {
      return;
    }

    const hasNonZeroBalance = Boolean(
      asset.balance?.value && asset.balance.value !== '0',
    );
    const balance = asset.balance?.display;
    const { symbol } = asset;

    setErrorMessage(null);
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
        setErrorMessage(
          hasNonZeroBalance
            ? (t('stellarClassicTrustlineRemoveNonZeroBalanceError', [
                balance,
                symbol,
              ]) as string)
            : (t('stellarClassicTrustlineRemoveError') as string),
        );
      }
    } finally {
      setIsDeactivating(false);
    }
  }, [account, assetId, asset, canDeactivate, chainId, dispatch, t]);

  const activateAsset = useCallback(async () => {
    if (!account || !chainId || !assetId) {
      return;
    }
    setErrorMessage(null);
    setIsActivating(true);
    try {
      const result = await requestStellarChangeTrustOptAdd({
        accountId: account.id,
        assetId,
        scope: chainId,
      });
      if (result.status === false) {
        // Snap showed the account funding prompt; no trustline tx was submitted.
        return;
      }
      await forceUpdateMetamaskState(dispatch);
    } catch (error: unknown) {
      const errorCode = (error as { code?: number })?.code;
      const isUserRejection =
        errorCode === errorCodes.provider.userRejectedRequest;
      if (!isUserRejection) {
        setErrorMessage(t('stellarClassicTrustlineAddError') as string);
      }
    } finally {
      setIsActivating(false);
    }
  }, [account, assetId, chainId, dispatch, t]);

  return {
    deactivateAsset,
    activateAsset,
    canDeactivate,
    isDeactivating,
    isActivating,
    errorMessage,
    dismissErrorMessage,
  };
};

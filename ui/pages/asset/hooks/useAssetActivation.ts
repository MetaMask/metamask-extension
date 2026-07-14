import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { errorCodes } from '@metamask/rpc-errors';

import type { CaipAssetType } from '@metamask/utils';
import { parseCaipAssetType, isCaipAssetType } from '@metamask/utils';
import {
  isAssetRequireActivate,
  isTrustlineAsset,
} from '../../../../shared/lib/multichain/trustline';
import { getStellarTrustlineAssetInfoForAccount } from '../../../selectors/stellar-assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { forceUpdateMetamaskState } from '../../../store/actions';
import {
  requestStellarChangeTrustOptAdd,
  requestStellarChangeTrustOptDelete,
} from '../utils/stellar-snap-client-requests';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';

/**
 * Manages trustline activation and deactivation for supported assets (currently Stellar classic tokens).
 *
 * @param params - Hook parameters.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - CAIP asset id for the trustline asset.
 * @param params.assetSymbol - Symbol of the asset.
 * @returns Trustline actions, loading flags, error state, activation requirement, and whether deactivation is allowed. For assets that do not require a trustline, actions are inert and deactivation is disabled.
 */
export const useAssetActivation = ({
  accountId,
  assetId,
  assetSymbol,
}: {
  accountId?: string;
  assetId?: CaipAssetType;
  assetSymbol?: string;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const isAssetIsTrustlineAsset = assetId ? isTrustlineAsset(assetId) : false;
  const chainId =
    assetId && isCaipAssetType(assetId)
      ? parseCaipAssetType(assetId).chainId
      : undefined;

  const selectedAccountId = useSelector((state) => {
    if (accountId || !chainId) {
      return undefined;
    }

    return getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)?.id;
  });
  const resolvedAccountId = accountId ?? selectedAccountId;

  const multichainBalances = useSelector(getMultichainBalances);

  const balanceAmount =
    resolvedAccountId && assetId
      ? multichainBalances[resolvedAccountId]?.[assetId]?.amount
      : undefined;

  const requiresActivate = useSelector((state) => {
    if (!assetId || !isAssetIsTrustlineAsset || !resolvedAccountId) {
      return false;
    }

    const assetMetadata = getStellarTrustlineAssetInfoForAccount(
      state,
      resolvedAccountId,
      assetId,
    );

    return isAssetRequireActivate({
      assetId,
      assetMetadata,
    });
  });

  const canDeactivate = Boolean(
    assetId &&
    isAssetIsTrustlineAsset &&
    !requiresActivate &&
    resolvedAccountId &&
    chainId,
  );

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dismissErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const deactivateAsset = useCallback(async () => {
    if (!canDeactivate || !resolvedAccountId || !chainId || !assetId) {
      return;
    }

    const hasNonZeroBalance = Boolean(balanceAmount && balanceAmount !== '0');
    const balanceDisplay = balanceAmount ?? '0';

    setErrorMessage(null);
    setIsDeactivating(true);
    try {
      await requestStellarChangeTrustOptDelete({
        accountId: resolvedAccountId,
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
            ? (t('assetDeactivationNonZeroBalanceError', [
                balanceDisplay,
                assetSymbol,
              ]) as string)
            : (t('assetDeactivationError') as string),
        );
      }
    } finally {
      setIsDeactivating(false);
    }
  }, [
    assetId,
    assetSymbol,
    balanceAmount,
    canDeactivate,
    chainId,
    dispatch,
    resolvedAccountId,
    t,
  ]);

  const activateAsset = useCallback(async () => {
    if (
      !resolvedAccountId ||
      !chainId ||
      !assetId ||
      !isAssetIsTrustlineAsset
    ) {
      return;
    }
    setErrorMessage(null);
    setIsActivating(true);
    try {
      const result = await requestStellarChangeTrustOptAdd({
        accountId: resolvedAccountId,
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
        setErrorMessage(t('assetActivationError') as string);
      }
    } finally {
      setIsActivating(false);
    }
  }, [
    assetId,
    chainId,
    dispatch,
    isAssetIsTrustlineAsset,
    resolvedAccountId,
    t,
  ]);

  return {
    deactivateAsset,
    activateAsset,
    canDeactivate,
    requiresActivate,
    isDeactivating,
    isActivating,
    errorMessage,
    dismissErrorMessage,
  };
};

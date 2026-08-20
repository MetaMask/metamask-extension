import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { errorCodes } from '@metamask/rpc-errors';
import { parseCaipAssetType, isCaipAssetType } from '@metamask/utils';

import {
  getIsAssetRequireActivate,
  isAssetSupportActivation,
} from '../../../selectors/stellar-assets';
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
 * @param params.assetId - Asset id for the trustline asset.
 * @param params.assetSymbol - Symbol of the asset.
 * @returns Trustline actions, loading flags, error state, activation requirement, and whether deactivation is allowed. For assets that do not require a trustline, actions are inert and deactivation is disabled.
 */
export const useAssetActivation = ({
  assetId,
  assetSymbol,
}: {
  assetId: string;
  assetSymbol?: string;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const chainId = isCaipAssetType(assetId)
    ? parseCaipAssetType(assetId).chainId
    : undefined;

  const resolvedAccountId = useSelector((state) => {
    if (!chainId) {
      return undefined;
    }

    return getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)?.id;
  });

  const multichainBalances = useSelector(getMultichainBalances);

  const balanceAmount =
    resolvedAccountId && assetId
      ? multichainBalances[resolvedAccountId]?.[assetId]?.amount
      : undefined;

  const requiresActivate = useSelector((state) =>
    getIsAssetRequireActivate(state, {
      assetId,
      accountId: resolvedAccountId,
    }),
  );

  // Classic asset with an active trustline (not requiring activation).
  const canDeactivate = Boolean(
    isAssetSupportActivation(assetId) &&
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
    if (
      !canDeactivate ||
      !resolvedAccountId ||
      !chainId ||
      !isCaipAssetType(assetId)
    ) {
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
    // Non-classic / already-active assets have requiresActivate === false.
    if (
      !resolvedAccountId ||
      !chainId ||
      !isCaipAssetType(assetId) ||
      !requiresActivate
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
  }, [assetId, chainId, dispatch, requiresActivate, resolvedAccountId, t]);

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

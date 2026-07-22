import { useDispatch, useSelector } from 'react-redux';
import { Hex, createProjectLogger } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';

import { useAsyncResult } from '../../../../hooks/useAsync';
import {
  addCustomAsset,
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getAllTokens } from '../../../../selectors/selectors';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state/feature-flags';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { toAssetId } from '../../../../../shared/lib/asset-utils';

const log = createProjectLogger('add-token');

export function useAddToken({
  chainId,
  decimals,
  name,
  symbol,
  tokenAddress,
}: {
  chainId: Hex;
  decimals: number;
  name?: string;
  symbol: string;
  tokenAddress: Hex;
}) {
  const dispatch = useDispatch();
  const allTokens = useSelector(getAllTokens);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);
  const caipChainId = toEvmCaipChainId(chainId);
  const evmGroupAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  );
  const accountId = evmGroupAccount?.id;

  const hasToken =
    allTokens?.[chainId]?.[selectedAccount?.address]?.some(
      (token: { address: string }) =>
        token.address.toLowerCase() === tokenAddress.toLowerCase(),
    ) ?? false;

  const { error } = useAsyncResult(async () => {
    if (hasToken) {
      log('Token already exists', { tokenAddress, chainId });
      return;
    }

    const networkClientId = await findNetworkClientIdByChainId(chainId);

    await dispatch(
      addToken(
        {
          address: tokenAddress,
          symbol,
          decimals,
          networkClientId,
        },
        true,
      ),
    );

    if (isAssetsUnifyStateEnabled && accountId) {
      const caipAssetType = toAssetId(tokenAddress, chainId);

      if (caipAssetType) {
        await dispatch(
          addCustomAsset(accountId, caipAssetType, {
            address: tokenAddress,
            chainId,
            decimals,
            name: name ?? symbol,
            symbol,
          }),
        );
      }
    }

    log('Added token', { tokenAddress, chainId });
  }, [
    hasToken,
    chainId,
    tokenAddress,
    symbol,
    decimals,
    name,
    isAssetsUnifyStateEnabled,
    accountId,
    dispatch,
  ]);

  if (error) {
    log('Failed', { tokenAddress, chainId, error });
  }
}

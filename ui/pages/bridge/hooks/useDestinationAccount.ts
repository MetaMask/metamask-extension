import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { EthScope, SolScope } from '@metamask/keyring-api';
import {
  getAccountGroupNameByInternalAccount,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import type { DestinationAccount } from '../prepare/types';

export const useDestinationAccount = () => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);

  const toChain = useSelector(getToChain);

  // For bridges, use the appropriate account type for the destination chain
  const defaultInternalDestinationAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(
      state,
      toChain && isSolanaChainId(toChain?.chainId)
        ? SolScope.Mainnet
        : EthScope.Eoa,
      // TODO: use this when selector is ready
      // formatChainIdToCaip(toChain.chainId),
    ),
  );

  const displayName = useSelector((state) =>
    getAccountGroupNameByInternalAccount(
      state,
      defaultInternalDestinationAccount,
    ),
  );

  useEffect(() => {
    setSelectedDestinationAccount(
      defaultInternalDestinationAccount
        ? {
            ...defaultInternalDestinationAccount,
            isExternal: false,
            displayName: displayName ?? '',
          }
        : null,
    );
  }, [defaultInternalDestinationAccount, displayName]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};

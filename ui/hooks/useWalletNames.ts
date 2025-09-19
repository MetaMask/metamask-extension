import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../selectors';
import { NameOrigin, NameType } from '@metamask/name-controller';

import { useNames } from './useName';
import { MultichainAccountsState } from '../selectors/multichain-accounts/account-tree.types';
import { getWalletIdAndNameByAccountAddress } from '../selectors/multichain-accounts/account-tree';
import { UseDisplayNameRequest } from './useDisplayName';

export function useWalletNames(
  requests: UseDisplayNameRequest[],
  nameEntries: ReturnType<typeof useNames>,
): (string | null)[] {
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const ethereumAddresses = useMemo(() => {
    return requests
      .map(({ type, value }, index) => ({
        address: type === NameType.ETHEREUM_ADDRESS ? value : null,
        originalIndex: index,
      }))
      .filter((item) => item.address !== null);
  }, [requests]);

  const walletNamesByAddress = useSelector((state: MultichainAccountsState) => {
    const walletNames: Record<string, string | null> = {};
    ethereumAddresses.forEach(({ address }) => {
      if (address) {
        const walletInfo = getWalletIdAndNameByAccountAddress(state, address);
        walletNames[address] = walletInfo?.name || null;
      }
    });
    return walletNames;
  });

  return useMemo(() => {
    return requests.map(({ type, value }, index) => {
      const nameEntry = nameEntries[index];
      const walletName = walletNamesByAddress?.[value] || null;

      if (
        type !== NameType.ETHEREUM_ADDRESS ||
        !isMultichainAccountsState2Enabled ||
        nameEntry?.origin === NameOrigin.API
      ) {
        return null;
      }

      return walletName;
    });
  }, [
    requests,
    walletNamesByAddress,
    isMultichainAccountsState2Enabled,
    nameEntries,
  ]);
}

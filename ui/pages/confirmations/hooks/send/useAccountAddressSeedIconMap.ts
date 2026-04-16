import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';

export const useAccountAddressSeedIconMap = () => {
  const accountGroupsWithAddresses = useSelector(
    getAccountGroupWithInternalAccounts,
  );

  const accountAddressSeedIconMap = useMemo(() => {
    const map = new Map<string, string>();

    accountGroupsWithAddresses.forEach((accountGroup) => {
      const { accounts } = accountGroup;

      if (accounts.length === 0) {
        return;
      }

      const seedAddress = accounts[0].address;

      accounts.forEach((account) => {
        map.set(account.address.toLowerCase(), seedAddress);
      });
    });

    return map;
  }, [accountGroupsWithAddresses]);

  return { accountAddressSeedIconMap };
};

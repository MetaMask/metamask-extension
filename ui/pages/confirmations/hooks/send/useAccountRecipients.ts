import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import {
  isEVMAccountForSend,
  isSolanaAccountForSend,
} from '../../utils/account';
import { useSendContext } from '../../context/send';
import { type Recipient } from './useRecipients';
import { useSendType } from './useSendType';
import { useAccountAddressSeedIconMap } from './useAccountAddressSeedIconMap';

export const useAccountRecipients = (): Recipient[] => {
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const { from } = useSendContext();
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();

  const walletsWithAccounts = useSelector(getWalletsWithAccounts);

  return useMemo(() => {
    const recipients: Recipient[] = [];

    Object.values(walletsWithAccounts).forEach((wallet) => {
      const walletName = wallet.metadata?.name;

      Object.values(wallet.groups).forEach((group) => {
        const accountGroupName = group.metadata?.name;

        group.accounts.forEach((account) => {
          if (account.address === from) {
            return;
          }

          const shouldInclude =
            (isEvmSendType && isEVMAccountForSend(account)) ||
            (isSolanaSendType && isSolanaAccountForSend(account));

          if (shouldInclude) {
            recipients.push({
              seedIcon: accountAddressSeedIconMap.get(
                account.address.toLowerCase(),
              ),
              accountGroupName,
              address: account.address,
              walletName,
            });
          }
        });
      });
    });

    return recipients;
  }, [
    from,
    isEvmSendType,
    isSolanaSendType,
    accountAddressSeedIconMap,
    walletsWithAccounts,
  ]);
};

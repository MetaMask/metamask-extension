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

export const useAccountRecipients = (): Recipient[] => {
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const { from } = useSendContext();

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
              accountGroupName,
              address: account.address,
              walletName,
            });
          }
        });
      });
    });

    return recipients;
  }, [walletsWithAccounts, isEvmSendType, isSolanaSendType, from]);
};

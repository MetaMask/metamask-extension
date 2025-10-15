import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import {
  isEVMAccountForSend,
  isSolanaAccountForSend,
  isBitcoinAccountForSend,
} from '../../utils/account';
import { useSendContext } from '../../context/send';
import { type Recipient } from './useRecipients';
import { useSendType } from './useSendType';
import { useRecipientSeedIconMap } from './useRecipientSeedIconMap';

export const useAccountRecipients = (): Recipient[] => {
  const { isEvmSendType, isSolanaSendType, isBitcoinSendType } = useSendType();
  const { from } = useSendContext();
  const { seedAddressMap } = useRecipientSeedIconMap();

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
            (isSolanaSendType && isSolanaAccountForSend(account)) ||
            (isBitcoinSendType && isBitcoinAccountForSend(account));

          if (shouldInclude) {
            recipients.push({
              seedIcon: seedAddressMap.get(account.address.toLowerCase()),
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
    isBitcoinSendType,
    seedAddressMap,
    walletsWithAccounts,
  ]);
};

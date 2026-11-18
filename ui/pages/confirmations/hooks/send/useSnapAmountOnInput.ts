import { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { useSendContext } from '../../context/send';
import { validateAmountMultichain } from '../../utils/multichain-snaps';
import { useSendType } from './useSendType';

export const useSnapAmountOnInput = () => {
  const { asset, fromAccount, toResolved } = useSendContext();
  const { isTronSendType } = useSendType();

  const validateAmountWithSnap = useCallback(
    async (amount: string) => {
      const result = await validateAmountMultichain(
        fromAccount as InternalAccount,
        {
          value: amount,
          accountId: (fromAccount as InternalAccount).id,
          assetId: asset?.assetId as CaipAssetType,
          // The Tron Snap quotes fees against the recipient; without it the
          // account activation reserve is assumed for every send.
          ...(isTronSendType && toResolved ? { toAddress: toResolved } : {}),
        },
      );
      return result;
    },
    [asset, fromAccount, isTronSendType, toResolved],
  );

  return { validateAmountWithSnap };
};

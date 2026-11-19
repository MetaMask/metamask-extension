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
          // `toResolved` is the resolved destination address for when there is
          // a name service like ENS.
          ...(isTronSendType && toResolved ? { toAddress: toResolved } : {}),
        },
      );
      return result;
    },
    [asset, fromAccount, isTronSendType, toResolved],
  );

  return { validateAmountWithSnap };
};

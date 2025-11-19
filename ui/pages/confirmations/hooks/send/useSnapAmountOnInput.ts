import { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { useSendContext } from '../../context/send';
import { validateAmountMultichain } from '../../utils/multichain-snaps';

export const useSnapAmountOnInput = () => {
  const { asset, fromAccount, value } = useSendContext();

  const validateAmountWithSnap = useCallback(
    async (amount: string) => {
      const result = await validateAmountMultichain(
        fromAccount as InternalAccount,
        {
          value: amount,
          accountId: (fromAccount as InternalAccount).id,
          assetId: asset?.assetId as CaipAssetType,
        },
      );
      return result;
    },
    [fromAccount, value, asset],
  );

  return { validateAmountWithSnap };
};

import { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { useSendContext } from '../../context/send';
import { validateAmountMultichain } from '../../utils/multichain-snaps';

export const useSnapAmountOnInput = () => {
  const { asset, fromAccount } = useSendContext();

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
    // Intentionally omit send-context `value`: validation uses the `amount`
    // argument only. Including `value` would recreate this callback on every
    // keystroke and retrigger async snap validation, letting stale responses
    // overwrite newer error state.
    [fromAccount, asset],
  );

  return { validateAmountWithSnap };
};

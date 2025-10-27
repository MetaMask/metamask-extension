import { useCallback } from 'react';
import { useSendContext } from '../../context/send';
import { validateAmountMultichain } from '../../utils/multichain-snaps';

export const useSnapAmountOnInput = () => {
  const { asset, fromAccount, value } = useSendContext();

  const validateAmountWithSnap = useCallback(
    async (amount: string) => {
      console.log('OGP - validateAmountWithSnap executed with amount : ', {
        amount,
      });
      const result = await validateAmountMultichain(fromAccount as any, {
        value: amount,
        accountId: (fromAccount as unknown as any).id,
        assetId: asset?.assetId as `${string}:${string}/${string}:${string}`,
      });
      console.log('OGP - validateAmountWithSnap returned result : ', {
        result,
      });
      return result;
    },
    [fromAccount, value, asset],
  );

  return { validateAmountWithSnap };
};

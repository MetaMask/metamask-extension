import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useState } from 'react';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';

export const useIsNFT = (
  transactionMeta: TransactionMeta,
): { isNFT: boolean } => {
  const [decimals, setDecimals] = useState('');
  useEffect(() => {
    const fetchTokenDetails = async () => {
      const result = await getTokenStandardAndDetails(
        transactionMeta?.txParams?.to as string,
      );

      setDecimals(result?.decimals as string);
    };

    fetchTokenDetails();
  }, [transactionMeta]);
  const isNFT = decimals === '0';

  return { isNFT };
};

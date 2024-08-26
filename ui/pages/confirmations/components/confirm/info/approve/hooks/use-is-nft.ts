import { TransactionMeta } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';

export const useIsNFT = (
  transactionMeta: TransactionMeta,
): { isNFT: boolean; pending: boolean } => {
  const { value, pending } = useAsyncResult(async () => {
    return await getTokenStandardAndDetails(
      transactionMeta?.txParams?.to as string,
    );
  }, [transactionMeta]);

  const isNFT = value?.standard !== TokenStandard.ERC20;

  return { pending, isNFT };
};

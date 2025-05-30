import { TransactionMeta } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../../../../store/actions';

export const useIsNFT = (
  transactionMeta: TransactionMeta,
): { isNFT: boolean; pending: boolean } => {
  const { value, pending } = useAsyncResult(async () => {
    return await getTokenStandardAndDetailsByChain(
      transactionMeta?.txParams?.to as string,
      transactionMeta?.txParams?.from as string,
      undefined,
      transactionMeta?.chainId as string,
    );
  }, [transactionMeta?.txParams?.to]);

  const isNFT = value?.standard !== TokenStandard.ERC20;

  return { pending, isNFT };
};

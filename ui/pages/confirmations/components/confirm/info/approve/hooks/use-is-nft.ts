import { TransactionMeta } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import { resolveApprovalTokenContractAddress } from '../../../../../../../../shared/lib/transaction.utils';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../../../../store/actions';

export const useIsNFT = (
  transactionMeta: TransactionMeta,
): { isNFT: boolean; pending: boolean } => {
  const tokenAddress = transactionMeta?.txParams
    ? resolveApprovalTokenContractAddress(transactionMeta)
    : undefined;

  const { value, pending } = useAsyncResult(async () => {
    return await getTokenStandardAndDetailsByChain(
      tokenAddress as string,
      transactionMeta?.txParams?.from as string,
      undefined,
      transactionMeta?.chainId as string,
    );
  }, [tokenAddress]);

  const isNFT = value?.standard !== TokenStandard.ERC20;

  return { pending, isNFT };
};

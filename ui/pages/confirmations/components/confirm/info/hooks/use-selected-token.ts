import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../../../../shared/modules/hexstring-utils';
import {
  getAllTokens,
  getCurrentChainId,
  getSelectedAccount,
} from '../../../../../../selectors';

export const useSelectedToken = (transactionMeta: TransactionMeta) => {
  const selectedAccount = useSelector(getSelectedAccount);

  const detectedTokens = useSelector(getAllTokens);
  const chainId = useSelector(getCurrentChainId);

  const selectedToken = detectedTokens?.[chainId]?.[
    selectedAccount.address
  ].find(
    (token: { address: string; decimals: number; symbol: string }) =>
      toChecksumHexAddress(token.address) ===
      toChecksumHexAddress(transactionMeta.txParams.to as string),
  );

  return { selectedToken };
};

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  forceUpdateMetamaskState,
  addTransaction,
  updateTransaction,
} from '../../../store/actions';
import {
  getHexMaxGasLimit,
  getTxGasEstimates,
} from '../../../ducks/bridge/utils';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { ChainId } from '../types';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';

export default function useHandleTx() {
  const dispatch = useDispatch();
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);

  const handleTx = async ({
    txType,
    txParams,
    fieldsToAddToTxMeta,
  }: {
    txType: TransactionType.bridgeApproval | TransactionType.bridge;
    txParams: {
      chainId: ChainId;
      to: string;
      from: string;
      value: string;
      data: string;
      gasLimit: number | null;
    };
    fieldsToAddToTxMeta: Omit<Partial<TransactionMeta>, 'status'>; // We don't add status, so omit it to fix the type error
  }) => {
    const hexChainId = decimalToPrefixedHex(txParams.chainId);

    const { maxFeePerGas, maxPriorityFeePerGas } = await getTxGasEstimates({
      networkAndAccountSupports1559,
      networkGasFeeEstimates,
      txParams,
      hexChainId,
    });
    const maxGasLimit = getHexMaxGasLimit(txParams.gasLimit ?? 0);

    const finalTxParams = {
      ...txParams,
      chainId: hexChainId,
      gasLimit: maxGasLimit,
      gas: maxGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    // Need access to the txMeta.id, so we call addTransaction instead of addTransactionAndWaitForPublish
    const txMeta = await addTransaction(finalTxParams, {
      requireApproval: false,
      type: txType,
    });

    dispatch(updateTransaction({ ...txMeta, ...fieldsToAddToTxMeta }, true));

    await forceUpdateMetamaskState(dispatch);

    return txMeta;
  };

  return { handleTx };
}

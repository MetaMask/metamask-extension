import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  forceUpdateMetamaskState,
  addTransactionAndWaitForPublish,
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
    swapsOptions,
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
    swapsOptions: {
      hasApproveTx: boolean;
      meta: Partial<TransactionMeta>;
    };
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

    const txMeta = await addTransactionAndWaitForPublish(finalTxParams, {
      requireApproval: false,
      type: txType,
      swaps: swapsOptions,
    });

    await forceUpdateMetamaskState(dispatch);

    return txMeta;
  };

  return { handleTx };
}

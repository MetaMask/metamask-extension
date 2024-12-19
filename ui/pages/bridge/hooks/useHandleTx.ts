import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  forceUpdateMetamaskState,
  addTransaction,
  updateTransaction,
  addTransactionAndWaitForPublish,
} from '../../../store/actions';
import {
  getHexMaxGasLimit,
  getTxGasEstimates,
} from '../../../ducks/bridge/utils';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { ChainId } from '../../../../shared/types/bridge';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';

export default function useHandleTx() {
  const dispatch = useDispatch();
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);
  const shouldUseSmartTransaction = useSelector(getIsSmartTransaction);

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

    // For the bridge tx only
    // Need access to the txMeta.id right away so we can track it in BridgeStatusController,
    // so we call addTransaction instead of addTransactionAndWaitForPublish
    // if it's an STX, addTransactionAndWaitForPublish blocks until there is a txHash
    let txMeta: TransactionMeta;
    if (txType === TransactionType.bridge && shouldUseSmartTransaction) {
      txMeta = await addTransaction(finalTxParams, {
        requireApproval: false,
        type: txType,
      });
    } else {
      txMeta = await addTransactionAndWaitForPublish(finalTxParams, {
        requireApproval: false,
        type: txType,
      });
    }

    // Note that updateTransaction doesn't actually error if you add fields that don't conform the to the txMeta type
    // they will be there at runtime, but you just don't get any type safety checks on them
    dispatch(updateTransaction({ ...txMeta, ...fieldsToAddToTxMeta }, true));

    await forceUpdateMetamaskState(dispatch);

    return txMeta;
  };

  return { handleTx };
}

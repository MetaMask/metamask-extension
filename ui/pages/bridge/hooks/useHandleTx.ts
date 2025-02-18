import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import {
  forceUpdateMetamaskState,
  addTransaction,
  updateTransaction,
  addTransactionAndWaitForPublish,
  bridgeMultichainTransaction,
} from '../../../store/actions';
import {
  getHexMaxGasLimit,
  getTxGasEstimates,
} from '../../../ducks/bridge/utils';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import {
  checkNetworkAndAccountSupports1559,
  getSelectedInternalAccount,
} from '../../../selectors';
import type { ChainId } from '../../../../shared/types/bridge';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainCurrentChainId } from '../../../selectors/multichain';
import { useMultichainWalletSnapSender } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { SOLANA_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/solana-wallet-snap';

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

  const selectedAccount = useMultichainSelector(getSelectedInternalAccount);
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);

  const snapSender = useMultichainWalletSnapSender(SOLANA_WALLET_SNAP_ID);
  const handleSolanaTx = async ({
    _txType,
    trade,
    _fieldsToAddToTxMeta,
  }: {
    _txType: TransactionType.bridge;
    trade: string;
    _fieldsToAddToTxMeta?: Omit<Partial<TransactionMeta>, 'status'>;
  }) => {
    // First submit via snap
    const response = await snapSender.send({
      id: crypto.randomUUID(),
      jsonrpc: '2.0',
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        request: {
          params: { base64EncodedTransactionMessage: trade },
          method: 'sendAndConfirmTransaction',
        },
        id: crypto.randomUUID(),
        account: selectedAccount.id,
        scope: currentChainId,
      },
    });

    const txSignature =
      response && typeof response === 'object' && 'result' in response
        ? (response.result as { signature: string })?.signature
        : undefined;

    // Then use bridgeMultichainTransaction as before
    if (selectedAccount.metadata?.snap?.id) {
      await bridgeMultichainTransaction(selectedAccount.metadata.snap.id, {
        account: selectedAccount.id,
        scope: currentChainId,
        base64EncodedTransactionMessage: trade,
      });
    }

    await forceUpdateMetamaskState(dispatch);

    return {
      ...{},
      txSignature,
    };
  };
  return { handleTx, handleSolanaTx };
}

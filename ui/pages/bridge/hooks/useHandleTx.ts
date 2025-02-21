import {
  type TransactionMeta,
  type TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { useEffect, useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { useHistory } from 'react-router-dom';
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
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import type { ChainId } from '../../../../shared/types/bridge';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import {
  getMultichainCurrentChainId,
  getMultichainIsSolana,
} from '../../../selectors/multichain';
import { SOLANA_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/solana-wallet-snap';
import { useMultichainWalletSnapSender } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import {
  checkNetworkAndAccountSupports1559,
  getMemoizedUnapprovedTemplatedConfirmations,
  getMemoizedUnapprovedConfirmations,
  getSelectedInternalAccount,
} from '../../../selectors';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
} from '../../../helpers/constants/routes';

export default function useHandleTx() {
  const dispatch = useDispatch();
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const networkGasFeeEstimates = useSelector(getGasFeeEstimates);
  const shouldUseSmartTransaction = useSelector(getIsSmartTransaction);

  const handleEvmTx = async ({
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

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentChainId = useSelector(getMultichainCurrentChainId);
  const snapSender = useMultichainWalletSnapSender(SOLANA_WALLET_SNAP_ID);
  const history = useHistory();

  // Find unapproved confirmations which the snap has initiated
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const unapprovedConfirmations = useSelector(
    getMemoizedUnapprovedConfirmations,
  );
  // Redirect to the confirmation page if an unapproved confirmation exists
  useEffect(() => {
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
    );
    const snapApproval = unapprovedConfirmations.find(
      (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
    );
    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    } else if (snapApproval) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${snapApproval.id}`);
    }
  }, [history, unapprovedTemplatedConfirmations, unapprovedConfirmations]);

  const handleSolanaTx = async ({
    txType,
    txParams,
    fieldsToAddToTxMeta,
  }: {
    txType: TransactionType.bridge;
    txParams: string;
    fieldsToAddToTxMeta: Omit<Partial<TransactionMeta>, 'status'>;
  }): Promise<TransactionMeta> => {
    // Submit a signing request to the snap
    (await snapSender.send({
      id: crypto.randomUUID(),
      jsonrpc: '2.0',
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        request: {
          params: { base64EncodedTransactionMessage: txParams },
          method: 'sendAndConfirmTransaction',
        },
        id: crypto.randomUUID(),
        account: selectedAccount.id,
        scope: currentChainId,
      },
    })) as string;

    return {
      ...fieldsToAddToTxMeta,
      id: crypto.randomUUID(),
      chainId: currentChainId as Hex,
      networkClientId: selectedAccount.id,
      time: Date.now(),
      txParams: { data: txParams } as TransactionParams,
      type: txType,
      status: TransactionStatus.submitted,
    };
  };

  const isSolana = useMultichainSelector(getMultichainIsSolana);
  const handleTx = useMemo(
    () => (isSolana ? handleSolanaTx : handleEvmTx),
    [isSolana],
  );

  return { handleTx };
}

import {
  TransactionMeta,
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { useEffect, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import { useHistory } from 'react-router-dom';
import {
  forceUpdateMetamaskState,
  addTransaction,
  updateTransaction,
  addTransactionAndWaitForPublish,
  startPollingForBridgeTxStatus,
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
import { serializeQuoteMetadata } from '../../../../shared/lib/bridge-status/utils';
import type { QuoteResponse, QuoteMetadata } from '../../../../shared/lib/bridge-status/types';

type BridgeTransactionFields = {
  bridgeId: string;
  bridge: string;
  sourceChainId: string;
  destinationChainId: string;
  quote: unknown;
  quoteResponse: QuoteResponse & QuoteMetadata;
  slippagePercentage?: number;
}

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

  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const unapprovedConfirmations = useSelector(
    getMemoizedUnapprovedConfirmations,
  );

  // General confirmation logs
  console.log('====SOLANA: Current confirmations:', {
    templated: unapprovedTemplatedConfirmations,
    regular: unapprovedConfirmations,
  });

  // Snaps are allowed to redirect to their own pending confirmations (templated or not)
  const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
    (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
  );
  const snapApproval = unapprovedConfirmations.find(
    (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
  );

  console.log('====SOLANA: Found snap approvals:', {
    templatedSnapApproval,
    snapApproval,
  });

  const [isHandlingTransaction, setIsHandlingTransaction] = useState(false);

  useEffect(() => {
    console.log('====SOLANA: useEffect triggered for approvals');
    // Don't redirect if we're in the middle of handling a transaction
    if (isHandlingTransaction) {
      console.log('====SOLANA: Skipping redirect while handling transaction');
      return;
    }

    if (templatedSnapApproval) {
      console.log(
        '====SOLANA: Redirecting to templated confirmation:',
        templatedSnapApproval.id,
      );
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    } else if (snapApproval) {
      console.log(
        '====SOLANA: Redirecting to regular confirmation:',
        snapApproval.id,
      );
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${snapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, unapprovedConfirmations, history, isHandlingTransaction]);

  const handleSolanaTx = async ({
    txType,
    txParams,
    fieldsToAddToTxMeta,
  }: {
    txType: TransactionType.bridge;
    txParams: string;
    fieldsToAddToTxMeta: Omit<Partial<TransactionMeta>, 'status'> & BridgeTransactionFields;
  }): Promise<TransactionMeta> => {
    setIsHandlingTransaction(true);
    try {
      console.log('====SOLANA: Starting transaction flow:', {
        txType,
        account: selectedAccount.id,
        chainId: currentChainId,
        currentConfirmations: {
          templated: unapprovedTemplatedConfirmations.length,
          regular: unapprovedConfirmations.length,
        },
      });

      const snapRequest = {
        id: crypto.randomUUID(),
        jsonrpc: '2.0' as const,
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
      };

      console.log(
        '====SOLANA: Sending request to snap - this should trigger an approval:',
        snapRequest,
      );

      const rawResponse = await snapSender.send(snapRequest);
      console.log('====SOLANA: Raw response from snap:', {
        response: rawResponse,
        type: typeof rawResponse,
        keys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : [],
        isString: typeof rawResponse === 'string',
      });

      // Extract signature from response
      let signature: string | undefined;
      if (typeof rawResponse === 'string') {
        signature = rawResponse;
      } else if (rawResponse && typeof rawResponse === 'object') {
        // Log all possible paths we might find a signature
        console.log('====SOLANA: Examining response object:', {
          hasResult: 'result' in rawResponse,
          resultType: rawResponse.result !== null ? typeof rawResponse.result : 'null',
          hasPending: 'pending' in rawResponse,
          pendingValue: 'pending' in rawResponse ? rawResponse.pending : undefined,
        });

        if ('result' in rawResponse && typeof rawResponse.result === 'string') {
          signature = rawResponse.result;
        }
      }

      if (!signature) {
        console.error('====SOLANA ERROR: No signature in response:', rawResponse);
        throw new Error('Failed to get transaction signature from Solana snap');
      }

      console.log('====SOLANA: Using signature:', signature);

      // Only create and add transaction to state after successful submission
      const txMeta = await addTransaction(
        { data: txParams } as TransactionParams,
        {
          type: txType,
          requireApproval: false,
        },
      );

      // Add all necessary fields
      const finalTxMeta = {
        ...txMeta,
        ...fieldsToAddToTxMeta,
        chainId: currentChainId as Hex,
        networkClientId: selectedAccount.id,
        status: TransactionStatus.submitted,
        hash: signature,
      };

      // Update state with complete transaction
      dispatch(updateTransaction(finalTxMeta, true));
      await forceUpdateMetamaskState(dispatch);

      // Start polling for bridge status
      const statusRequest = {
        bridgeId: fieldsToAddToTxMeta.bridgeId,
        srcTxHash: signature,
        bridge: fieldsToAddToTxMeta.bridge,
        srcChainId: fieldsToAddToTxMeta.sourceChainId,
        destChainId: fieldsToAddToTxMeta.destinationChainId,
        quote: fieldsToAddToTxMeta.quote,
      };

      dispatch(
        startPollingForBridgeTxStatus({
          bridgeTxMeta: finalTxMeta,
          statusRequest,
          quoteResponse: serializeQuoteMetadata(fieldsToAddToTxMeta.quoteResponse),
          slippagePercentage: fieldsToAddToTxMeta.slippagePercentage ?? 0,
          startTime: finalTxMeta.time,
        }),
      );

      console.log('====SOLANA: Added submitted transaction to state:', finalTxMeta);
      return finalTxMeta;
    } catch (error) {
      console.error('====SOLANA ERROR: Transaction flow failed:', error);
      throw error;
    } finally {
      setIsHandlingTransaction(false);
    }
  };

  const isSolana = useMultichainSelector(getMultichainIsSolana);
  const handleTx = useMemo(
    () => (isSolana ? handleSolanaTx : handleEvmTx),
    [isSolana],
  );

  return { handleTx };
}

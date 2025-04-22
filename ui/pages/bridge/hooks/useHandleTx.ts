import {
  type TransactionMeta,
  type TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { useEffect } from 'react';
import { Hex } from '@metamask/utils';
import { useHistory } from 'react-router-dom';
import type { ChainId } from '@metamask/bridge-controller';
import {
  forceUpdateMetamaskState,
  addTransaction,
  updateTransaction,
  addTransactionAndWaitForPublish,
  setDefaultHomeActiveTabName,
} from '../../../store/actions';
import {
  getHexMaxGasLimit,
  getTxGasEstimates,
} from '../../../ducks/bridge/utils';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
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
  getNetworkConfigurationIdByChainId,
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

  const networkConfigurationIds = useSelector(
    getNetworkConfigurationIdByChainId,
  );

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

    const networkClientId =
      networkConfigurationIds[
        hexChainId as keyof typeof networkConfigurationIds
      ];

    // For the bridge tx only
    // Need access to the txMeta.id right away so we can track it in BridgeStatusController,
    // so we call addTransaction instead of addTransactionAndWaitForPublish
    // if it's an STX, addTransactionAndWaitForPublish blocks until there is a txHash
    let txMeta: TransactionMeta;
    if (txType === TransactionType.bridge && shouldUseSmartTransaction) {
      txMeta = await addTransaction(finalTxParams, {
        networkClientId,
        requireApproval: false,
        type: txType,
      });
    } else {
      txMeta = await addTransactionAndWaitForPublish(finalTxParams, {
        networkClientId,
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
    // Move to activity tab before submitting a transaction
    // This is a temporary solution to avoid the transaction not being shown in the activity tab
    // We should find a better solution in the future
    await dispatch(setDefaultHomeActiveTabName('activity'));
    // Submit a signing request to the snap
    const snapResponse = await snapSender.send({
      id: crypto.randomUUID(),
      jsonrpc: '2.0',
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        request: {
          params: {
            account: { address: selectedAccount.address },
            transaction: txParams,
            scope: currentChainId,
          },
          method: 'signAndSendTransaction',
        },
        id: crypto.randomUUID(),
        account: selectedAccount.id,
        scope: currentChainId,
      },
    });

    console.log('===SOLANA=== snap response:', snapResponse);

    // Extract signature from snap response to use as hash
    // This is crucial for the bridge status controller to track the transaction
    let signature;

    // Handle different response formats
    if (typeof snapResponse === 'string') {
      signature = snapResponse;
    } else if (snapResponse && typeof snapResponse === 'object') {
      // TODO: clean this up.
      // If it's an object with result property, try to get the signature
      // @ts-expect-error: snapResponse is not typed, need to clean this up later.
      if (snapResponse.result && typeof snapResponse.result === 'object') {
        // Log the result object to see its structure
        // @ts-expect-error: snapResponse is not typed, need to clean this up later.
        console.log('===SOLANA=== snap response result:', snapResponse.result);

        // Try to extract signature from common locations in response object
        signature =
          // @ts-expect-error: snapResponse is not typed, need to clean this up later.
          snapResponse.result.signature ||
          // @ts-expect-error: snapResponse is not typed, need to clean this up later.
          snapResponse.result.txid ||
          // @ts-expect-error: snapResponse is not typed, need to clean this up later.
          snapResponse.result.hash ||
          // @ts-expect-error: snapResponse is not typed, need to clean this up later.
          snapResponse.result.txHash;
      }
    }

    console.log('===SOLANA=== Extracted signature:', signature);

    // Create a transaction meta object with bridge-specific fields
    const txMeta: TransactionMeta = {
      ...fieldsToAddToTxMeta,
      id: crypto.randomUUID(),
      chainId: currentChainId as Hex,
      networkClientId: selectedAccount.id,
      time: Date.now(),
      txParams: { data: txParams } as TransactionParams,
      type: txType,
      status: TransactionStatus.submitted,
      hash: signature, // Add the transaction signature as hash
      // Add explicitly Solana-specific flags
      // @ts-expect-error: txMeta is not typed, need to clean this up later.
      isSolana: true,
      isBridgeTx: true,
      // Add key bridge-specific fields for proper categorization
      actionId: txType,
      origin: SOLANA_WALLET_SNAP_ID,
    };

    // Log detailed transaction meta for debugging
    console.log(
      '===SOLANA=== Creating bridge transaction meta with ALL fields:',
      {
        id: txMeta.id,
        hash: txMeta.hash,
        // @ts-expect-error: txMeta is not typed, need to clean this up later.
        isSolana: txMeta.isSolana,
        // @ts-expect-error: txMeta is not typed, need to clean this up later.
        isBridgeTx: txMeta.isBridgeTx,
        type: txMeta.type,
        chainId: txMeta.chainId,
        networkClientId: txMeta.networkClientId,
        time: txMeta.time,
        status: txMeta.status,
        origin: txMeta.origin,
        actionId: txMeta.actionId,
        fieldsFromParent: {
          ...fieldsToAddToTxMeta,
        },
        txParams: txMeta.txParams,
        fullObject: txMeta,
      },
    );

    return txMeta;
  };

  const isSolana = useMultichainSelector(getMultichainIsSolana);

  return {
    handleTx: async ({
      txType,
      txParams,
      fieldsToAddToTxMeta,
    }: {
      txType: TransactionType.bridgeApproval | TransactionType.bridge;
      txParams:
        | {
            chainId: ChainId;
            to: string;
            from: string;
            value: string;
            data: string;
            gasLimit: number | null;
          }
        | string; // Allow string for Solana transactions
      fieldsToAddToTxMeta: Omit<Partial<TransactionMeta>, 'status'>; // We don't add status, so omit it to fix the type error
    }) => {
      // Check for Solana transaction by the txParams type or the explicit isSolana flag
      if (
        isSolana &&
        txType === TransactionType.bridge &&
        typeof txParams === 'string'
      ) {
        console.log('Handling Solana bridge transaction');
        // Handle as Solana transaction
        return handleSolanaTx({
          txType,
          txParams:
            typeof txParams === 'string' ? txParams : JSON.stringify(txParams),
          fieldsToAddToTxMeta,
        });
      }

      // Handle as EVM transaction
      return handleEvmTx({
        txType,
        txParams: txParams as {
          chainId: ChainId;
          to: string;
          from: string;
          value: string;
          data: string;
          gasLimit: number | null;
        },
        fieldsToAddToTxMeta,
      });
    },
  };
}

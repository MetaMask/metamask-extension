import React, { useMemo } from 'react';
import { Box } from '@metamask/design-system-react';
import { V1TransactionByHashResponse } from '@metamask/core-backend';
import { useSelector } from 'react-redux';
import { mapApiEvmTransactions } from '../../../shared/lib/activity/adapters/api-evm-transactions';
import { mapLocalTransaction } from '../../../shared/lib/activity/adapters/local-transaction';
import { selectEvmAddress } from '../../selectors/accounts';
import {
  selectLocalTransactionsByHash,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { BlockExplorerFooter } from './components/block-explorer-footer';
import { Header } from './components/header';
import { SwapAgainButton } from './components/swap-again-button';
import { TemplateLoader } from './templates/template-loader';
import { useCachedEvmTransaction } from './useCachedEvmTransaction';
import { useTransactionQuery } from './useTransactionQuery';

type Props = {
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onBack: () => void;
};

export function TransactionDetails({ chainId, txIdentifier, onBack }: Props) {
  const selectedAddress = useSelector(selectEvmAddress);
  const isEvm = chainId?.startsWith('eip155:');

  const localTransactions = useSelector(selectLocalTransactionsByHash);
  const localTransaction = txIdentifier
    ? localTransactions.get(txIdentifier.toLowerCase())
    : undefined;

  const nonEvmActivityItems = useSelector(selectNonEvmActivityItemsById);
  const nonEvmActivityItem =
    !isEvm && txIdentifier
      ? nonEvmActivityItems.get(txIdentifier.toLowerCase())
      : undefined;

  const cachedApiTransaction = useCachedEvmTransaction({
    chainId,
    txHash: txIdentifier,
  });

  const { data: apiTransaction } = useTransactionQuery({
    chainId,
    txHash: txIdentifier,
    enabled: Boolean(
      isEvm && !localTransaction && !cachedApiTransaction && selectedAddress,
    ),
  });

  const transaction = useMemo(() => {
    if (localTransaction) {
      return mapLocalTransaction(localTransaction);
    }

    if (nonEvmActivityItem) {
      return nonEvmActivityItem;
    }

    const evmTransaction = (cachedApiTransaction ??
      apiTransaction) as V1TransactionByHashResponse;

    if (evmTransaction && selectedAddress) {
      return mapApiEvmTransactions({
        subjectAddress: selectedAddress,
        transaction: evmTransaction,
      });
    }

    return undefined;
  }, [
    apiTransaction,
    cachedApiTransaction,
    localTransaction,
    nonEvmActivityItem,
    selectedAddress,
  ]);

  return (
    <Box className="flex min-h-full flex-col bg-background-default p-4">
      <Header item={transaction} onBack={onBack} />

      <TemplateLoader item={transaction} />

      <div className="cta-footer mt-auto flex flex-col gap-3 pb-1">
        <BlockExplorerFooter
          chainId={transaction?.chainId}
          txHash={transaction?.data.hash}
        />
        {transaction?.type === 'swap' || transaction?.type === 'bridge' ? (
          <SwapAgainButton
            destinationToken={transaction.data.destinationToken}
            sourceToken={transaction.data.sourceToken}
          />
        ) : null}
      </div>
    </Box>
  );
}

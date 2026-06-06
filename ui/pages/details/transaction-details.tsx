import React, { useMemo } from 'react';
import { Box, Text } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { mapApiEvmTransactions } from '../../../shared/lib/activity/adapters/api-evm-transactions';
import { mapLocalTransaction } from '../../../shared/lib/activity/adapters/local-transaction';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectEvmAddress } from '../../selectors/accounts';
import {
  selectLocalTransactionsByHash,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { BlockExplorerFooter } from './components/block-explorer-footer';
import { Header } from './components/header';
import { TemplateLoader } from './templates/template-loader';
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

  const { data: apiTransaction } = useTransactionQuery({
    chainId,
    txHash: txIdentifier,
    enabled: Boolean(isEvm && !localTransaction && selectedAddress),
  });

  const transaction = useMemo(() => {
    if (localTransaction) {
      return mapLocalTransaction(localTransaction);
    }

    if (nonEvmActivityItem) {
      return nonEvmActivityItem;
    }

    if (apiTransaction && selectedAddress) {
      return mapApiEvmTransactions({
        subjectAddress: selectedAddress,
        transaction: apiTransaction as Parameters<
          typeof mapApiEvmTransactions
        >[0]['transaction'],
      });
    }

    return undefined;
  }, [apiTransaction, localTransaction, nonEvmActivityItem, selectedAddress]);

  return (
    <Box className="flex min-h-full flex-col bg-background-default p-4">
      <Header item={transaction} onBack={onBack} />

      <TemplateLoader item={transaction} />

      <BlockExplorerFooter
        chainId={transaction?.chainId}
        txHash={transaction?.data.hash}
      />
    </Box>
  );
}

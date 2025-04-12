import { TransactionType } from '@metamask/transaction-controller';
import { QuoteMetadata, type QuoteResponse } from '@metamask/bridge-controller';
import { getTxMetaFields } from '@metamask/bridge-status-controller';
import useHandleTx from './useHandleTx';

export default function useHandleBridgeTx() {
  const { handleTx } = useHandleTx();

  const handleBridgeTx = async ({
    quoteResponse,
    approvalTxId,
  }: {
    quoteResponse: QuoteResponse & QuoteMetadata;
    approvalTxId: string | undefined;
  }) => {
    const fieldsToAddToTxMeta = getTxMetaFields(quoteResponse, approvalTxId);

    // Handle the transaction
    const txMeta = await handleTx({
      txType: TransactionType.bridge,
      txParams: quoteResponse.trade,
      fieldsToAddToTxMeta,
    });

    return txMeta;
  };

  return { handleBridgeTx };
}

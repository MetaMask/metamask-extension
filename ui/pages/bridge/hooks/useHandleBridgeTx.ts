import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { useDispatch } from 'react-redux';
import { FeeType, type QuoteResponse } from '@metamask/bridge-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import useHandleTx from './useHandleTx';

export default function useHandleBridgeTx() {
  const { handleTx } = useHandleTx();
  const dispatch = useDispatch();

  const handleBridgeTx = async ({
    quoteResponse,
    approvalTxId,
  }: {
    quoteResponse: QuoteResponse;
    approvalTxId: string | undefined;
  }) => {
    const sentAmount = new BigNumber(quoteResponse.quote.srcTokenAmount).plus(
      quoteResponse.quote.feeData[FeeType.METABRIDGE].amount,
    );
    const sentAmountDec = new Numeric(sentAmount, 10)
      .shiftedBy(quoteResponse.quote.srcAsset.decimals)
      .toString();

    // Detect if this is a Solana transaction by the type of trade data
    // Solana transactions are passed as strings
    const isSolana = typeof quoteResponse.trade === 'string';

    const fieldsToAddToTxMeta = {
      destinationChainId: new Numeric(quoteResponse.quote.destChainId, 10)
        .toPrefixedHexString()
        .toLowerCase() as `0x${string}`,
      // estimatedBaseFee: decEstimatedBaseFee,

      sourceTokenAmount: quoteResponse.quote.srcTokenAmount,
      sourceTokenSymbol: quoteResponse.quote.srcAsset.symbol,
      sourceTokenDecimals: quoteResponse.quote.srcAsset.decimals,
      sourceTokenAddress: quoteResponse.quote.srcAsset.address,

      destinationTokenAmount: quoteResponse.quote.destTokenAmount,
      destinationTokenSymbol: quoteResponse.quote.destAsset.symbol,
      destinationTokenDecimals: quoteResponse.quote.destAsset.decimals,
      destinationTokenAddress: quoteResponse.quote.destAsset.address,

      approvalTxId,
      // this is the decimal (non atomic) amount (not USD value) of source token to swap
      swapTokenValue: sentAmountDec,
      // Add an explicit flag to mark this as a Solana transaction
      isSolana,
      // Ensure it's marked as a bridge transaction for UI detection
      isBridgeTx: true,
    };

    // Handle the transaction
    const txMeta = await handleTx({
      txType: TransactionType.bridge,
      txParams: quoteResponse.trade,
      fieldsToAddToTxMeta,
    });

    // For Solana transactions, make sure to add it to the transaction controller
    // Solana returns a different object structure so we need to handle it separately
    if (isSolana && txMeta) {
      // Ensure the isSolana flag is set in the transaction metadata
      // @ts-expect-error: txMeta is not typed, need to clean this up later.
      if (!txMeta.isSolana) {
        // @ts-expect-error: txMeta is not typed, need to clean this up later.
        txMeta.isSolana = true;
      }

      // Make sure the transaction hash is set so it can be tracked by the bridge status controller
      // and displayed properly in the UI
      if (txMeta.hash) {
        // We need to dispatch the transaction from here for Solana since
        // the handleSolanaTx function doesn't use addTransaction
        // This ensures it's properly registered in the UI
        dispatch({
          type: 'TRANSACTION_CREATED',
          payload: txMeta,
        });
      }
    }

    return txMeta;
  };

  return { handleBridgeTx };
}

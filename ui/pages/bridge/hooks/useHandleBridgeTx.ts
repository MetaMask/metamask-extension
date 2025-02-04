import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { isCaipChainId } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { FeeType, type QuoteResponse } from '../../../../shared/types/bridge';
import { formatChainIdFromApi } from '../../../../shared/modules/bridge-utils/multichain';
import useHandleTx from './useHandleTx';

export default function useHandleBridgeTx() {
  const { handleTx } = useHandleTx();

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

    const hexDestChainId = formatChainIdFromApi(
      quoteResponse.quote.destChainId,
    );
    if (isCaipChainId(hexDestChainId)) {
      // TODO handle non-evm chains
      return undefined;
    }
    const txMeta = await handleTx({
      txType: TransactionType.bridge,
      txParams: quoteResponse.trade,
      fieldsToAddToTxMeta: {
        destinationChainId: hexDestChainId,
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
      },
    });

    return txMeta;
  };

  return { handleBridgeTx };
}

import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import { FeeType, QuoteResponse } from '../types';
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

    const txMeta = await handleTx({
      txType: TransactionType.bridge,
      txParams: quoteResponse.trade,
      swapsOptions: {
        hasApproveTx: Boolean(quoteResponse?.approval),
        meta: {
          destinationChainId: new Numeric(quoteResponse.quote.destChainId, 10)
            .toPrefixedHexString()
            .toLowerCase() as `0x${string}`,
          // estimatedBaseFee: decEstimatedBaseFee,
          // swapMetaData,
          type: TransactionType.bridge,
          sourceTokenSymbol: quoteResponse.quote.srcAsset.symbol,
          destinationTokenSymbol: quoteResponse.quote.destAsset.symbol,
          destinationTokenDecimals: quoteResponse.quote.destAsset.decimals,
          destinationTokenAddress: quoteResponse.quote.destAsset.address,
          approvalTxId,
          // this is the decimal (non atomic) amount (not USD value) of source token to swap
          swapTokenValue: sentAmountDec,
          // Convert chainIds to hex
          bridgeSteps: quoteResponse.quote.steps.map((step) => ({
            ...step,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            action: step.action as any,
            srcChainId: new Numeric(step.srcChainId, 10)
              .toPrefixedHexString()
              .toLowerCase() as `0x${string}`,
            destChainId: step.destChainId
              ? (new Numeric(step.destChainId, 10)
                  .toPrefixedHexString()
                  .toLowerCase() as `0x${string}`)
              : undefined,
            srcAsset: {
              ...step.srcAsset,
              chainId: new Numeric(step.srcAsset.chainId, 10)
                .toPrefixedHexString()
                .toLowerCase() as `0x${string}`,
            },
            destAsset: {
              ...step.destAsset,
              chainId: new Numeric(step.destAsset.chainId, 10)
                .toPrefixedHexString()
                .toLowerCase() as `0x${string}`,
            },
          })),
        },
      },
    });

    return txMeta;
  };

  return { handleBridgeTx };
}

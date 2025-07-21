import { TransactionType } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { TxData, QuoteResponse, FeeType } from '../types';
import { isEthUsdt, getEthUsdtResetData } from '../bridge.util';
import { Numeric } from '../../../../shared/modules/Numeric';
import { ETH_USDT_ADDRESS } from '../../../../shared/constants/bridge';
import { getBridgeERC20Allowance } from '../../../ducks/bridge/actions';
import useHandleTx from './useHandleTx';

export default function useHandleApprovalTx() {
  const { handleTx } = useHandleTx();

  const handleEthUsdtAllowanceReset = async ({
    approval,
    quoteResponse,
    hexChainId,
  }: {
    approval: TxData;
    quoteResponse: QuoteResponse;
    hexChainId: Hex;
  }) => {
    const allowance = new BigNumber(
      await getBridgeERC20Allowance(ETH_USDT_ADDRESS, hexChainId),
    );

    // quote.srcTokenAmount is actually after the fees
    // so we need to add fees back in for total allowance to give
    const sentAmount = new BigNumber(quoteResponse.quote.srcTokenAmount)
      .plus(quoteResponse.quote.feeData[FeeType.METABRIDGE].amount)
      .toString();

    const shouldResetApproval = allowance.lt(sentAmount) && allowance.gt(0);

    if (shouldResetApproval) {
      const resetData = getEthUsdtResetData();
      const txParams = {
        ...approval,
        data: resetData,
      };

      await handleTx({
        txType: TransactionType.bridgeApproval,
        txParams,
        swapsOptions: {
          hasApproveTx: true,
          meta: {
            type: TransactionType.bridgeApproval,
          },
        },
      });
    }
  };

  const handleApprovalTx = async ({
    approval,
    quoteResponse,
  }: {
    approval: TxData;
    quoteResponse: QuoteResponse;
  }) => {
    const hexChainId = new Numeric(
      approval.chainId,
      10,
    ).toPrefixedHexString() as `0x${string}`;

    // On Ethereum, we need to reset the allowance to 0 for USDT first if we need to set a new allowance
    // https://www.google.com/url?q=https://docs.unizen.io/trade-api/before-you-get-started/token-allowance-management-for-non-updatable-allowance-tokens&sa=D&source=docs&ust=1727386175513609&usg=AOvVaw3Opm6BSJeu7qO0Ve5iLTOh
    if (isEthUsdt(hexChainId, quoteResponse.quote.srcAsset.address)) {
      await handleEthUsdtAllowanceReset({
        approval,
        quoteResponse,
        hexChainId,
      });
    }

    const txMeta = await handleTx({
      txType: TransactionType.bridgeApproval,
      txParams: approval,
      swapsOptions: {
        hasApproveTx: true,
        meta: {
          type: TransactionType.bridgeApproval,
          sourceTokenSymbol: quoteResponse.quote.srcAsset.symbol,
        },
      },
    });

    return txMeta.id;
  };
  return {
    handleApprovalTx,
  };
}

import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

import { TokenStandAndDetails } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SimulationDetailsLayout } from '../../simulation-details/simulation-details';
import { BalanceChangeRow } from '../../simulation-details/balance-change-row';
import { TokenAssetIdentifier } from '../../simulation-details/types';

export const QuoteSwapSimulationDetails = ({
  fiatRates,
  quote,
  sourceTokenAmount,
  tokenDetails,
}: {
  fiatRates?: Record<Hex, number | undefined>;
  quote?: QuoteResponse;
  sourceTokenAmount?: string;
  tokenDetails?: Record<Hex, TokenStandAndDetails>;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: transactionId } = currentConfirmation;

  const { srcAssetBalanceChange, destAssetBalanceChange } = useMemo(() => {
    if (!quote || !tokenDetails || !fiatRates) {
      return {};
    }
    const { srcAsset, destAsset, destTokenAmount } = quote.quote;
    return {
      srcAssetBalanceChange: {
        asset: {
          ...tokenDetails[srcAsset.address as Hex],
          chainId: toHex(srcAsset.chainId),
          address: srcAsset.address as Hex,
        } as unknown as TokenAssetIdentifier,
        amount: new BigNumber(sourceTokenAmount ?? '0x0', 16)
          .negated()
          .dividedBy(new BigNumber(10).pow(srcAsset.decimals)),
        fiatAmount: new BigNumber(sourceTokenAmount ?? '0x0', 16)
          .negated()
          .dividedBy(new BigNumber(10).pow(srcAsset.decimals))
          .times(fiatRates[srcAsset.address as Hex] ?? 0)
          .toNumber(),
        usdAmount: 0,
      },
      destAssetBalanceChange: {
        asset: {
          ...tokenDetails[destAsset.address as Hex],
          chainId: toHex(destAsset.chainId),
          address: destAsset.address as Hex,
        } as unknown as TokenAssetIdentifier,
        amount: new BigNumber(destTokenAmount).dividedBy(
          new BigNumber(10).pow(destAsset.decimals),
        ),
        fiatAmount: new BigNumber(destTokenAmount)
          .dividedBy(new BigNumber(10).pow(destAsset.decimals))
          .times(fiatRates[destAsset.address as Hex] ?? 0)
          .toNumber(),
        usdAmount: 0,
      },
    };
  }, [fiatRates, quote, sourceTokenAmount, tokenDetails]);

  if (
    !quote ||
    !tokenDetails ||
    !fiatRates ||
    !srcAssetBalanceChange ||
    !destAssetBalanceChange
  ) {
    return null;
  }

  return (
    <SimulationDetailsLayout
      isTransactionsRedesign
      transactionId={transactionId}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        data-testid="quote-swap-simulation-details"
      >
        <BalanceChangeRow
          balanceChange={srcAssetBalanceChange}
          confirmationId={currentConfirmation?.id}
          isFirstRow
          label={t('simulationDetailsOutgoingHeading')}
          showFiat
        />
        <BalanceChangeRow
          balanceChange={destAssetBalanceChange}
          hasIncomingTokens
          confirmationId={currentConfirmation?.id}
          label={t('simulationDetailsIncomingHeading')}
          showFiat
        />
      </Box>
    </SimulationDetailsLayout>
  );
};

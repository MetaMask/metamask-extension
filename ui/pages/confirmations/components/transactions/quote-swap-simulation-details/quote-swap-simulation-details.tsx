import React, { useMemo } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { isNativeAddress, QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

import { TokenStandard } from '../../../../../../shared/constants/transaction';
import { TokenStandAndDetails } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { calculateTokenAmount } from '../../../utils/token';
import { getTokenValueFromRecord } from '../../../utils/dapp-swap-comparison-utils';
import { useConfirmContext } from '../../../context/confirm';
import { AssetIdentifier } from '../../simulation-details/types';
import { BalanceChangeRow } from '../../simulation-details/balance-change-row';
import { SimulationDetailsLayout } from '../../simulation-details/simulation-details';

const getSrcAssetBalanceChange = (
  srcAsset: QuoteResponse['quote']['srcAsset'],
  tokenDetails: Record<Hex, TokenStandAndDetails>,
  sourceTokenAmount: string | undefined,
  fiatRates: Record<Hex, number | undefined>,
) => {
  let asset = {
    ...tokenDetails[srcAsset.address.toLowerCase() as Hex],
    chainId: toHex(srcAsset.chainId),
    address: srcAsset.address as Hex,
  } as AssetIdentifier;
  if (isNativeAddress(srcAsset.address)) {
    asset = {
      chainId: toHex(srcAsset.chainId),
      standard: TokenStandard.none,
    };
  }
  return {
    asset,
    amount: calculateTokenAmount(
      sourceTokenAmount ?? '0x0',
      srcAsset.decimals,
      16,
    ).negated(),
    fiatAmount: calculateTokenAmount(
      sourceTokenAmount ?? '0x0',
      srcAsset.decimals,
      16,
      getTokenValueFromRecord(fiatRates, srcAsset.address as Hex) ?? 0,
    )
      .negated()
      .toNumber(),
    usdAmount: 0,
  };
};

const getDestAssetBalanceChange = (
  destAsset: QuoteResponse['quote']['destAsset'],
  tokenDetails: Record<Hex, TokenStandAndDetails>,
  destTokenAmount: string,
  fiatRates: Record<Hex, number | undefined>,
) => {
  let asset = {
    ...tokenDetails[destAsset.address.toLowerCase() as Hex],
    chainId: toHex(destAsset.chainId),
    address: destAsset.address as Hex,
  } as AssetIdentifier;
  if (isNativeAddress(destAsset.address)) {
    asset = {
      chainId: toHex(destAsset.chainId),
      standard: TokenStandard.none,
    };
  }
  return {
    asset,
    amount: calculateTokenAmount(destTokenAmount, destAsset.decimals),
    fiatAmount: calculateTokenAmount(
      destTokenAmount,
      destAsset.decimals,
      10,
      getTokenValueFromRecord(fiatRates, destAsset.address as Hex) ?? 0,
    ).toNumber(),
    usdAmount: 0,
  };
};
export const QuoteSwapSimulationDetails = ({
  fiatRates,
  quote,
  sourceTokenAmount,
  tokenDetails,
  tokenAmountDifference = 0,
}: {
  fiatRates?: Record<Hex, number | undefined>;
  quote?: QuoteResponse;
  sourceTokenAmount?: string;
  tokenDetails?: Record<Hex, TokenStandAndDetails>;
  tokenAmountDifference?: number;
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
      srcAssetBalanceChange: getSrcAssetBalanceChange(
        srcAsset,
        tokenDetails,
        sourceTokenAmount,
        fiatRates,
      ),
      destAssetBalanceChange: getDestAssetBalanceChange(
        destAsset,
        tokenDetails,
        destTokenAmount,
        fiatRates,
      ),
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
      title={t('bestQuote')}
      titleTooltip={t('bestQuoteTooltip')}
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
        {tokenAmountDifference > 0 && (
          <Box justifyContent={BoxJustifyContent.End}>
            <Box
              className="quote-swap_highlighted-text"
              backgroundColor={BoxBackgroundColor.SuccessMuted}
              padding={2}
            >
              <Text
                color={TextColor.SuccessDefault}
                variant={TextVariant.BodyXs}
              >
                {t('getDollarMore', [tokenAmountDifference?.toFixed(2)])}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </SimulationDetailsLayout>
  );
};

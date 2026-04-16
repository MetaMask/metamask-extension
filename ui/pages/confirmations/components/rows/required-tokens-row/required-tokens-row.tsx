import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { TokenStandard } from '../../../../../../shared/constants/transaction';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AmountPill } from '../../simulation-details/amount-pill';
import { AssetPill } from '../../simulation-details/asset-pill';
import type { TokenAssetIdentifier } from '../../simulation-details/types';

export type RequiredTokensRowProps = {
  variant?: ConfirmInfoRowSize;
};

export const RequiredTokensRow = ({
  variant = ConfirmInfoRowSize.Default,
}: RequiredTokensRowProps) => {
  const t = useI18nContext();
  const requiredTokens = useTransactionPayRequiredTokens();
  const fiatFormatter = useFiatFormatter();

  const visibleTokens = useMemo(
    () => requiredTokens?.filter((token) => !token.skipIfBalance) ?? [],
    [requiredTokens],
  );

  const isDefaultVariant = variant === ConfirmInfoRowSize.Default;

  if (!visibleTokens.length) {
    return null;
  }

  return (
    <>
      {visibleTokens.map((token) => {
        const asset: TokenAssetIdentifier = {
          chainId: token.chainId as Hex,
          address: token.address as Hex,
          standard: TokenStandard.ERC20,
        };

        const amount = new BigNumber(token.amountHuman).negated();
        const amountFiatFormatted = fiatFormatter(
          new BigNumber(token.amountUsd).toNumber(),
        );

        return (
          <ConfirmInfoRow
            key={`${token.chainId}-${token.address}`}
            data-testid="required-tokens-row"
            label={t('requiredToken')}
            rowVariant={variant}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              gap={1}
            >
              <AmountPill asset={asset} amount={amount} />
              <AssetPill asset={asset} />
              {isDefaultVariant && (
                <Text color={TextColor.textAlternative}>
                  {amountFiatFormatted}
                </Text>
              )}
            </Box>
          </ConfirmInfoRow>
        );
      })}
    </>
  );
};

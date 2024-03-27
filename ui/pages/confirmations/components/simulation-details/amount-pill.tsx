import React from 'react';
import { Box, Text } from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import {
  DEFAULT_PRECISION_DECIMALS,
  MIN_DISPLAY_AMOUNT,
} from '../../../../hooks/useCurrencyDisplay';
import Tooltip from '../../../../components/ui/tooltip';
import { Amount, AssetIdentifier } from './types';

// Format an amount for display.
const formatAmount = (amount: Amount): string => {
  const displayAmount = amount.numeric.abs().round(DEFAULT_PRECISION_DECIMALS);

  return displayAmount.isZero() && !amount.numeric.isZero()
    ? MIN_DISPLAY_AMOUNT
    : displayAmount.toString();
};

/**
 * Displays a pill with an amount and a background color indicating whether the amount
 * is an increase or decrease.
 *
 * @param props
 * @param props.asset
 * @param props.amount
 */
export const AmountPill: React.FC<{
  asset: AssetIdentifier;
  amount: Amount;
}> = ({ asset, amount }) => {
  const backgroundColor = amount.isNegative
    ? BackgroundColor.errorMuted
    : BackgroundColor.successMuted;

  const color = amount.isNegative
    ? TextColor.errorAlternative
    : TextColor.successDefault;

  const amountParts: string[] = [amount.isNegative ? '-' : '+'];

  if (asset.standard !== TokenStandard.ERC721) {
    // ERC721 amounts are always 1 and don't need to be displayed.
    amountParts.push(formatAmount(amount));
  }

  if (asset.tokenId) {
    amountParts.push(`#${hexToDecimal(asset.tokenId)}`);
  }
  return (
    <Box
      data-testid="simulation-details-amount-pill"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      backgroundColor={backgroundColor}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      style={{
        padding: '0px 8px',
        flexShrink: 1,
        flexBasis: 'auto',
        minWidth: 0,
      }}
    >
      <Tooltip
        position="bottom"
        title={amountParts.join(' ')}
        wrapperStyle={{ minWidth: 0 }}
        interactive
      >
        <Text ellipsis variant={TextVariant.bodyMd} color={color}>
          {amountParts.join(' ')}
        </Text>
      </Tooltip>
    </Box>
  );
};

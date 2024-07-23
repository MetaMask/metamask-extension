import React from 'react';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
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
import Tooltip from '../../../../components/ui/tooltip';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { shortenString as shortenAssetId } from '../../../../helpers/utils/util';
import { AssetIdentifier } from './types';
import { formatAmount, formatAmountMaxPrecision } from './formatAmount';

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
  amount: BigNumber;
}> = ({ asset, amount }) => {
  const locale = useSelector(getIntlLocale);

  const backgroundColor = amount.isNegative()
    ? BackgroundColor.errorMuted
    : BackgroundColor.successMuted;

  const color = amount.isNegative()
    ? TextColor.errorAlternative
    : TextColor.successDefault;

  const amountParts: string[] = [amount.isNegative() ? '-' : '+'];
  const tooltipParts: string[] = [];

  // ERC721 amounts are always 1 and are not displayed.
  if (asset.standard !== TokenStandard.ERC721) {
    const formattedAmount = formatAmount(locale, amount.abs());
    const fullPrecisionAmount = formatAmountMaxPrecision(locale, amount.abs());

    amountParts.push(formattedAmount);
    tooltipParts.push(fullPrecisionAmount);
  }

  if (asset.tokenId) {
    const decimalTokenId = hexToDecimal(asset.tokenId);
    const shortenedDecimalTokenId = shortenAssetId(decimalTokenId, {
      truncatedCharLimit: 11,
      truncatedStartChars: 4,
      truncatedEndChars: 4,
      skipCharacterInEnd: false,
    });

    const shortenedTokenIdPart = `#${shortenedDecimalTokenId}`;
    const tooltipIdPart = `#${decimalTokenId}`;

    amountParts.push(shortenedTokenIdPart);
    tooltipParts.push(tooltipIdPart);
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
        title={tooltipParts.join(' ')}
        wrapperStyle={{ minWidth: 0 }}
        theme="word-break-all"
        interactive
      >
        <Text ellipsis variant={TextVariant.bodyMd} color={color}>
          {amountParts.join(' ')}
        </Text>
      </Tooltip>
    </Box>
  );
};

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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetIdentifier } from './types';
import { formatAmount, formatAmountMaxPrecision } from './formatAmount';

/**
 * Displays a pill with an amount and a background color indicating whether the amount
 * is an increase or decrease.
 *
 * @param props
 * @param props.asset
 * @param props.amount
 * @param props.isApproval
 * @param props.isAllApproval
 * @param props.isUnlimitedApproval
 */
export const AmountPill: React.FC<{
  asset: AssetIdentifier;
  amount: BigNumber;
  isApproval?: boolean;
  isAllApproval?: boolean;
  isUnlimitedApproval?: boolean;
}> = ({ asset, amount, isApproval, isAllApproval, isUnlimitedApproval }) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const backgroundColor = getBackgroundColour({ amount, isApproval });
  const color = getColor({ amount, isApproval });

  const amountParts: string[] = [];
  const tooltipParts: string[] = [];

  if (!isApproval) {
    amountParts.push(amount.isNegative() ? '-' : '+');
  }

  // ERC721 amounts are always 1 and are not displayed.
  if (asset.standard !== TokenStandard.ERC721 && !isAllApproval) {
    const formattedAmount = isUnlimitedApproval
      ? t('unlimited')
      : formatAmount(locale, amount.abs());

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

  if (isAllApproval) {
    amountParts.push(t('all'));
    tooltipParts.push(t('all'));
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

function getBackgroundColour({
  amount,
  isApproval,
}: {
  amount: BigNumber;
  isApproval?: boolean;
}) {
  if (isApproval) {
    return BackgroundColor.backgroundMuted;
  }

  return amount.isNegative()
    ? BackgroundColor.errorMuted
    : BackgroundColor.successMuted;
}

function getColor({
  amount,
  isApproval,
}: {
  amount: BigNumber;
  isApproval?: boolean;
}) {
  if (isApproval) {
    return TextColor.textDefault;
  }

  return amount.isNegative()
    ? TextColor.errorAlternative
    : TextColor.successDefault;
}

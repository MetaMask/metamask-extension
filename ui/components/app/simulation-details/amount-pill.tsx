import React from 'react';
import { Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { BalanceChange } from './types';

/**
 * Displays a pill with an amount and a background color indicating whether the amount
 * is an increase or decrease.
 *
 * @param props
 * @param props.asset
 * @param props.amount
 */
export const AmountPill: React.FC<BalanceChange> = ({ asset, amount }) => {
  const backgroundColor = amount.isNegative
    ? BackgroundColor.errorMuted
    : BackgroundColor.successMuted;

  const color = amount.isNegative
    ? TextColor.errorAlternative
    : TextColor.successDefault;

  const amountParts: string[] = [amount.isNegative ? '-' : '+'];

  const hideAmount = asset.standard === TokenStandard.ERC721;
  if (!hideAmount) {
    amountParts.push(amount.numeric.round(6).toString());
  }
  if (asset.tokenId) {
    amountParts.push(`#${hexToDecimal(asset.tokenId)}`);
  }
  return (
    <Text
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      backgroundColor={backgroundColor}
      color={color}
      borderRadius={BorderRadius.pill}
      style={{
        padding: '0px 8px',
      }}
      variant={TextVariant.bodyMd}
    >
      {amountParts.join(' ')}
    </Text>
  );
};

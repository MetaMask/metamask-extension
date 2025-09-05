import React from 'react';
import classnames from 'classnames';
import { Box, Text } from '../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  AlignItems,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type AccountDetailsRowProps = {
  label: string;
  value: string;
  endAccessory: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  labelColor?: TextColor;
};

export const AccountDetailsRow = ({
  label,
  value,
  endAccessory,
  style,
  onClick,
  labelColor,
}: AccountDetailsRowProps) => {
  const rowClassName = classnames('multichain-account-details__row', {
    'multichain-account-details__row--clickable': Boolean(onClick),
    'multichain-account-details__row--default': !onClick,
  });

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      style={style}
      paddingLeft={4}
      paddingRight={4}
      alignItems={AlignItems.center}
      onClick={onClick}
      className={rowClassName}
      data-testid={`account-details-row-${label
        .toLowerCase()
        .replaceAll(' ', '-')}`}
    >
      <Text
        color={labelColor ?? TextColor.textDefault}
        variant={TextVariant.bodyMdMedium}
        className="multichain-account-details__label"
      >
        {label}
      </Text>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        className="multichain-account-details__value-container"
      >
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMdMedium}
          ellipsis
          className="multichain-account-details__value"
          data-testid={`account-details-row-value-${label
            .toLowerCase()
            .replaceAll(' ', '-')}`}
        >
          {value}
        </Text>
        {endAccessory}
      </Box>
    </Box>
  );
};

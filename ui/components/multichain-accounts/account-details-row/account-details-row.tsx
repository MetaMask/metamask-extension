import React from 'react';
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
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      style={{
        ...style,
        height: '52px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      paddingLeft={4}
      paddingRight={4}
      alignItems={AlignItems.center}
      onClick={onClick}
      className="multichain-account-details__row"
      data-testid={`account-details-row-${label
        .toLowerCase()
        .replaceAll(' ', '-')}`}
    >
      <Text
        color={labelColor ?? TextColor.textDefault}
        variant={TextVariant.bodyMdMedium}
        style={{ fontWeight: '600' }}
      >
        {label}
      </Text>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ minWidth: 0, flex: 1, justifyContent: 'flex-end' }}
      >
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMdMedium}
          ellipsis
          style={{
            maxWidth: '150px',
          }}
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

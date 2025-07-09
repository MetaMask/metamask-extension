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
};

export const AccountDetailsRow = ({
  label,
  value,
  endAccessory,
  style,
  onClick,
}: AccountDetailsRowProps) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      style={{
        ...style,
        height: '48px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      paddingLeft={4}
      paddingRight={4}
      alignItems={AlignItems.center}
      onClick={onClick}
      className="multichain-account-details__row"
    >
      <Text
        color={TextColor.textDefault}
        variant={TextVariant.bodyMdMedium}
        paddingRight={12}
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
        >
          {value}
        </Text>
        {endAccessory}
      </Box>
    </Box>
  );
};

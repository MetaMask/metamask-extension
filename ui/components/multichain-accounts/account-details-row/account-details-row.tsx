import type { ComponentProps } from 'react';
import React from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

type AccountDetailsRowProps = {
  label: string;
  value: string;
  endAccessory: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  labelColor?: ComponentProps<typeof Text>['color'];
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
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={style}
      paddingLeft={4}
      paddingRight={2}
      alignItems={BoxAlignItems.Center}
      onClick={onClick}
      className={rowClassName}
      data-testid={`account-details-row-${label
        .toLowerCase()
        .replaceAll(' ', '-')}`}
    >
      <Text
        color={labelColor ?? TextColor.TextDefault}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        className="multichain-account-details__label"
      >
        {label}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="multichain-account-details__value-container"
      >
        <Text
          color={TextColor.TextAlternative}
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
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

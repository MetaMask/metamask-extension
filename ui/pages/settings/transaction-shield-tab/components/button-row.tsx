import React from 'react';
import {
  Box,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconProps,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';

type ButtonRowProps = {
  title: string;
  description?: string;
  startAccessory?: React.ReactNode;
  rightIconProps?: IconProps;
  onClick?: () => void;
  'data-testid'?: string;
  className?: string;
};

const ButtonRow = ({
  title,
  description,
  startAccessory,
  rightIconProps,
  onClick,
  'data-testid': dataTestId,
  className = '',
}: ButtonRowProps) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Box
      asChild
      className={twMerge(
        'button-row flex w-full items-center px-4 gap-4',
        className,
      )}
      data-testid={dataTestId}
      onClick={onClick}
    >
      <Component className="button-row__button">
        {startAccessory && <Box>{startAccessory}</Box>}
        <Box className="text-left">
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {title}
          </Text>
          {description && (
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {description}
            </Text>
          )}
        </Box>
        {onClick && (
          <Icon
            name={IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
            {...rightIconProps}
            className={twMerge('ml-auto', rightIconProps?.className)}
          />
        )}
      </Component>
    </Box>
  );
};

export default ButtonRow;

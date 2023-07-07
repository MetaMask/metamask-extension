import React from 'react';
import { Box, Text, Icon, IconName, IconSize } from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

export type ConfirmationInlineStatusProps = {
  type: StatusType;
  value: string;
};

export enum StatusType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Error = 'error',
}

const types = {
  [StatusType.Error]: {
    iconColor: IconColor.errorDefault,
    textColor: TextColor.errorDefault,
    icon: IconName.Danger,
  },
};

export const ConfirmationInlineStatus = ({
  type,
  value,
}: ConfirmationInlineStatusProps) => {
  const { textColor, iconColor, icon } = types[type];

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      <Icon size={IconSize.Sm} color={iconColor} name={icon} />
      <Text marginLeft={2} color={textColor}>
        {value}
      </Text>
    </Box>
  );
};

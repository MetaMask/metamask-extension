import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

export type TransactionNoticeProps = {
  notice: string;
};

export const TransactionNotice = ({ notice }: TransactionNoticeProps) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      <Icon
        name={IconName.Info}
        size={IconSize.Sm}
        color={IconColor.iconMuted}
        marginRight={1}
      />
      <Text color={TextColor.textAlternative}>{notice}</Text>
    </Box>
  );
};

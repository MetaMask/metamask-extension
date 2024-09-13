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
  FontWeight,
  IconColor,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import Tooltip from '../../../../ui/tooltip';

export type FeeRowProps = {
  title: string;
  tooltipText?: string;
  value: React.ReactNode;
  isLoading: boolean;
};

export const FeeRow = ({
  title,
  tooltipText,
  value,
  isLoading,
}: FeeRowProps) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      marginBottom={2}
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
        <Tooltip title={tooltipText} disabled={!tooltipText} position="top">
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
          >
            <Text fontWeight={FontWeight.Medium} color={TextColor.textDefault}>
              {title}
            </Text>
            {tooltipText && (
              <Icon
                name={IconName.Question}
                size={IconSize.Sm}
                color={IconColor.iconMuted}
                marginLeft={1}
              />
            )}
          </Box>
        </Tooltip>
      </Box>
      <Box
        className={isLoading ? 'loading-item' : ''}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
      >
        {isLoading ? 'Loading' : value}
      </Box>
    </Box>
  );
};

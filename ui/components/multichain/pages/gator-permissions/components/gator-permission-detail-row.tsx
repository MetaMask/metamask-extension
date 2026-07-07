import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  Text,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../../component-library/skeleton';

export const gatorPermissionDetailRowStyle = {
  flex: '1',
  alignSelf: 'center',
} as const;

type GatorPermissionDetailRowProps = {
  label: string;
  value: React.ReactNode;
  testId?: string;
  isLoading?: boolean;
};

/**
 * Row layout for gator permission review / expanded details (label left, value right + skeleton).
 * @param options0
 * @param options0.label
 * @param options0.value
 * @param options0.testId
 * @param options0.isLoading
 */
export const GatorPermissionDetailRow = ({
  label,
  value,
  testId,
  isLoading = false,
}: GatorPermissionDetailRowProps): JSX.Element => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={gatorPermissionDetailRowStyle}
      gap={4}
      marginTop={2}
    >
      <Text
        textAlign={TextAlign.Left}
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
      >
        {label}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        style={gatorPermissionDetailRowStyle}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Skeleton isLoading={isLoading} width="100px" height="16px">
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Right}
            data-testid={testId}
          >
            {value}
          </Text>
        </Skeleton>
      </Box>
    </Box>
  );
};

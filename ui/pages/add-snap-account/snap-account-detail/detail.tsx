import React from 'react';
import {
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
import { Text } from '../../../components/component-library';

const Detail = ({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) => {
  return (
    <Box flexDirection={FlexDirection.Column} marginBottom={4}>
      <Text variant={TextVariant.bodySmBold} marginBottom={1}>
        {title}
      </Text>
      {children}
    </Box>
  );
};

export default Detail;

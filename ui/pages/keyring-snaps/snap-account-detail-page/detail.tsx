import React from 'react';
import { Box, Text } from '../../../components/component-library';
import {
  FlexDirection,
  OverflowWrap,
  TextVariant,
} from '../../../helpers/constants/design-system';

const Detail = ({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) => {
  return (
    <Box flexDirection={FlexDirection.Column} marginBottom={4}>
      <Text
        variant={TextVariant.bodySmBold}
        overflowWrap={OverflowWrap.BreakWord}
        marginBottom={1}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
};

export default Detail;

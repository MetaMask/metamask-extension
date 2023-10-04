import React from 'react';
import { Box, Text } from '../../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../helpers/constants/design-system';

export const Connections = () => {
  // TODO use translations here
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      gap={2}
    >
      <Text>MetaMask isn’t connected to this site</Text>
      <Text color={TextColor.textAlternative}>
        To connect to a web3 site, find and click{' '}
        <Text color={TextColor.textAlternative} as="strong">
          connect
        </Text>
      </Text>
    </Box>
  );
};

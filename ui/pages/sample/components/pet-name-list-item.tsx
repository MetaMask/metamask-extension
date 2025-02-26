import React from 'react';
import { Box, Text } from '../../../components/component-library';
import {
  Display,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';

interface PetNameListItemProps {
  name: string;
  address: string;
  chainId?: string; // Optional for items that don't have chain ID
}

export function PetNameListItem({
  name,
  address,
  chainId,
}: PetNameListItemProps) {
  return (
    <Box
      key={chainId ? `${chainId}-${address}` : address}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      padding={2}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.LG}
    >
      <Text>{name}</Text>
      <Text
        color={TextColor.textAlternative}
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '120px',
        }}
      >
        {address}
      </Text>
    </Box>
  );
}

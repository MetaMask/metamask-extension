import React from 'react';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import {
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
} from '../../../components/component-library';

interface SampleNetworkDisplayProps {
  name: string;
  imageUrl?: string;
}

export const SampleNetworkDisplay: React.FC<SampleNetworkDisplayProps> = ({
  name,
  imageUrl,
}) => {
  return (
    <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
      <AvatarNetwork size={AvatarNetworkSize.Md} name={name} src={imageUrl} />
      <Text>{name}</Text>
    </Box>
  );
};

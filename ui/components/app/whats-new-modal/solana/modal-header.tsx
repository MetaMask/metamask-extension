import React from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import {
  ModalHeader as BaseModalHeader,
  Box,
} from '../../../component-library';

type ModalHeaderProps = {
  onClose?: () => void;
  image?: {
    src: string;
    width?: string;
    height?: string;
  };
};

export const SolanaModalHeader = ({ onClose, image }: ModalHeaderProps) => {
  const imageComponent = image && (
    <img src={image.src} width={image.width} height={image.height} />
  );

  return (
    <BaseModalHeader onClose={onClose} paddingTop={4} paddingBottom={4}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        {imageComponent}
      </Box>
    </BaseModalHeader>
  );
};

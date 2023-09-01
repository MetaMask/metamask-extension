import React from 'react';
import {
  Box,
  Icon,
  IconName,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';

export default function SnapRemovalResult({
  success,
  snapName,
  isOpen,
  onClose,
}: {
  success: boolean;
  snapName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
        }}
      >
        <ModalHeader onClose={onClose}></ModalHeader>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Icon name={success ? IconName.Confirmation : IconName.Danger} />
          <Text>{`${snapName} ${success ? 'removed' : 'not removed'}`}</Text>
        </Box>
      </ModalContent>
    </Modal>
  );
}

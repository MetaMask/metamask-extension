import React from 'react';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalOverlay,
  Text,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import { ACTION_MODE } from './network-list-menu';

type NetworkListMenuModalProps = {
  onClose: () => void;
  actionMode: ACTION_MODE;
  onBack?: () => void;
  title: string;
  children: React.ReactNode;
};

export const NetworkListMenuModal = ({
  onClose,
  actionMode,
  onBack,
  title,
  children,
}: NetworkListMenuModalProps) => {
  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        padding={0}
        className="multichain-network-list-menu-content-wrapper"
        modalDialogProps={{
          className: 'multichain-network-list-menu-content-wrapper__dialog',
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        <ModalHeader
          paddingTop={4}
          paddingRight={4}
          paddingBottom={actionMode === ACTION_MODE.SELECT_RPC ? 0 : 4}
          onClose={onClose}
          onBack={onBack}
        >
          <Text
            ellipsis
            variant={TextVariant.headingSm}
            textAlign={TextAlign.Center}
          >
            {title}
          </Text>
        </ModalHeader>
        {children}
      </ModalContent>
    </Modal>
  );
};

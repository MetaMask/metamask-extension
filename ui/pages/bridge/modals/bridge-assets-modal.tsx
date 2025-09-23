import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../components/component-library';

interface BridgeAssetsModalProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
}

export const BridgeAssetsModal = ({ isOpen, onClose }: BridgeAssetsModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(false)}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={() => onClose(false)}>
          My Modal Title
        </ModalHeader>
        <ModalBody>
          <Text>This is my simple modal content!</Text>
        </ModalBody>
        <ModalFooter
          onSubmit={() => onClose(false)}
          submitButtonProps={{ children: 'Close' }}
        />
      </ModalContent>
    </Modal>
  )
}

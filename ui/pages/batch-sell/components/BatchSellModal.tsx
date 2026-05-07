import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextProps,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../components/component-library';

export type BatchSellModalProps = {
  open: boolean;
  modalProps?: {
    ctaProps?: {
      text: string;
      onClick: () => void;
    };
    titleProps: TextProps;
    descriptionProps: TextProps;
  };
  onClose: () => void;
}

export const BatchSellModal = ({
  open,
  modalProps,
  onClose,
}: BatchSellModalProps) => {
  if (!modalProps) {
    return null
  }

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm} {...modalProps.titleProps} />
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodySm} {...modalProps.descriptionProps} />
        </ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            isFullWidth
            onClick={modalProps.ctaProps?.onClick}
          >
            <Text
              variant={TextVariant.ButtonLabelMd}
              fontWeight={FontWeight.Medium}
              textAlign={TextAlign.Center}
              color={TextColor.PrimaryInverse}
            >
              {modalProps.ctaProps?.text}
            </Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

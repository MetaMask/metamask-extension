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
import { Modal } from '../../../components/component-library/modal/modal';
import { ModalOverlay } from '../../../components/component-library/modal-overlay/modal-overlay';
import { ModalContent } from '../../../components/component-library/modal-content/modal-content';
import { ModalHeader } from '../../../components/component-library/modal-header/modal-header';
import { ModalBody } from '../../../components/component-library/modal-body/modal-body';
import { ModalFooter } from '../../../components/component-library/modal-footer/modal-footer';

export type BatchSellInfoModalProps = {
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
};

export const BatchSellInfoModal = ({
  open,
  modalProps,
  onClose,
}: BatchSellInfoModalProps) => {
  if (!modalProps) {
    return null;
  }

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={onClose}
      data-testid="batch-sell-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text
            textAlign={TextAlign.Center}
            variant={TextVariant.HeadingSm}
            {...modalProps.titleProps}
          />
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodySm} {...modalProps.descriptionProps} />
        </ModalBody>
        {modalProps.ctaProps && (
          <ModalFooter>
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              isFullWidth
              onClick={modalProps.ctaProps.onClick}
            >
              <Text
                variant={TextVariant.ButtonLabelMd}
                fontWeight={FontWeight.Medium}
                textAlign={TextAlign.Center}
                color={TextColor.PrimaryInverse}
              >
                {modalProps.ctaProps.text}
              </Text>
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

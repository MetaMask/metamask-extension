import React, { useContext, useState } from 'react';
import { useModalProps } from '../../../../../hooks/useModalProps';
import {
  Box,
  ButtonSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  Text,
  ModalFooter,
  Icon,
  IconName,
  IconSize,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextAlign,
  IconColor,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../../contexts/i18n';
import useOriginThrottling from '../../../hooks/useOriginThrottling';

const MultipleRequestContent = ({
  onConfirmationCancel,
  setIsTemporaryBlock,
}: {
  onConfirmationCancel: (forceCancel?: boolean) => void;
  setIsTemporaryBlock: (isTemporaryBlock: boolean) => void;
}) => {
  const t = useContext(I18nContext);
  const { resetOrigin } = useOriginThrottling();

  const title = t('spamModalTitle');
  const description = t('spamModalDescription');
  const temporaryBlockButton = t('spamModalTemporaryBlockButton');

  return (
    <ModalContent size={ModalContentSize.Md}>
      <Box
        justifyContent={JustifyContent.center}
        display={Display.Flex}
        marginBottom={4}
      >
        <Icon
          name={IconName.Warning}
          size={IconSize.Xl}
          color={IconColor.warningDefault}
        />
      </Box>
      <ModalHeader endAccessory={<></>}>{title}</ModalHeader>
      <ModalBody>
        <Text
          textAlign={TextAlign.Center}
          as="p"
          data-testid="confirmation-text"
        >
          {description}
        </Text>
      </ModalBody>
      <ModalFooter
        paddingTop={4}
        onSubmit={() => {
          // Order of operations is important here to ensure the origin is reset after the confirmation is cancelled
          onConfirmationCancel(true);
          resetOrigin();
        }}
        onCancel={() => {
          setIsTemporaryBlock(true);
        }}
        containerProps={{
          alignItems: AlignItems.stretch,
          flexDirection: FlexDirection.Column,
        }}
        submitButtonProps={{
          children: t('cancel'),
          size: ButtonSize.Lg,
        }}
        cancelButtonProps={{
          children: temporaryBlockButton,
          size: ButtonSize.Lg,
        }}
      />
    </ModalContent>
  );
};

const OriginBlockedContent = ({
  onConfirmationCancel,
}: {
  onConfirmationCancel: (forceCancel?: boolean) => void;
}) => {
  const t = useContext(I18nContext);

  const blockedTitle = t('spamModalBlockedTitle');
  const blockedDescription = t('spamModalBlockedDescription');

  return (
    <ModalContent size={ModalContentSize.Md}>
      <Box
        justifyContent={JustifyContent.center}
        display={Display.Flex}
        marginBottom={4}
      >
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.successDefault}
        />
      </Box>
      <ModalHeader endAccessory={<></>}>{blockedTitle}</ModalHeader>
      <ModalBody>
        <Text
          textAlign={TextAlign.Center}
          as="p"
          data-testid="confirmation-text"
        >
          {blockedDescription}
        </Text>
      </ModalBody>
      <ModalFooter
        paddingTop={4}
        onSubmit={() => {
          onConfirmationCancel(true);
        }}
        submitButtonProps={{
          children: t('gotIt'),
          size: ButtonSize.Lg,
        }}
      />
    </ModalContent>
  );
};

export default function OriginThrottleModal({
  isOpen,
  onConfirmationCancel,
}: {
  isOpen: boolean;
  onConfirmationCancel: (forceCancel?: boolean) => void;
}) {
  const { hideModal } = useModalProps();
  const [isTemporaryBlock, setIsTemporaryBlock] = useState(false);

  const handleHideModal = () => {
    hideModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleHideModal}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      {isTemporaryBlock ? (
        <OriginBlockedContent onConfirmationCancel={onConfirmationCancel} />
      ) : (
        <MultipleRequestContent
          onConfirmationCancel={onConfirmationCancel}
          setIsTemporaryBlock={setIsTemporaryBlock}
        />
      )}
    </Modal>
  );
}

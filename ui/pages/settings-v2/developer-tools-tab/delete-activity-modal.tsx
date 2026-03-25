import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { resetAccount } from '../../../store/actions';

type DeleteActivityModalProps = {
  onClose: () => void;
};

export default function DeleteActivityModal({
  onClose,
}: Readonly<DeleteActivityModalProps>) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const deleteActivityData = async () => {
    await dispatch(resetAccount());
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="delete-activity-and-nonce-data-modal"
    >
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader onClose={onClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('deleteActivityAndNonceData')}
            </Text>
          </Box>
        </ModalHeader>
        <Box
          marginHorizontal={4}
          marginBottom={3}
          flexDirection={BoxFlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('clearActivityDescription')}
          </Text>
        </Box>
        <ModalFooter>
          <Box className="flex gap-4">
            <Button
              className="flex-1"
              variant={ButtonVariant.Secondary}
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="delete-activity-and-nonce-data-button"
              className="flex-1"
              variant={ButtonVariant.Primary}
              isDanger
              onClick={deleteActivityData}
            >
              {t('delete')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

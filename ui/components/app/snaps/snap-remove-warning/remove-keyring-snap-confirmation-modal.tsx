import React, { useState } from 'react';
import {
  BannerAlert,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextField,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  Severity,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const RemoveKeyringSnapConfirmationModal = ({
  snapName,
  onSubmit,
  onCancel,
  onClose,
  onBack,
  isOpen,
}: {
  snapName: string;
  onSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
  onBack: () => void;
  isOpen: boolean;
}) => {
  const t = useI18nContext();
  const [confirmedRemoval, setConfirmedRemoval] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState(false);

  const validateConfirmationInput = (input: string): boolean => {
    setError(false);
    if (input === snapName) {
      return true;
    }
    setError(true);
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onBack={onBack} onClose={onClose}>
          {t('removeSnap')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          marginTop={6}
        >
          <BannerAlert
            severity={Severity.Warning}
            className=""
            marginBottom={4}
          >
            {t('backupKeyringSnapReminder')}
          </BannerAlert>
          <Text marginBottom={4}>
            {t('keyringSnapRemoveConfirmation', [
              <Text
                key="keyringSnapRemoveConfirmation2"
                as="span"
                fontWeight={FontWeight.Bold}
              >
                {snapName}
              </Text>,
            ])}
          </Text>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore TODO: fix TextField props */}
          <TextField
            marginBottom={4}
            value={confirmationInput}
            onChange={(e: { target: { value: string } }) => {
              setConfirmationInput(e.target.value);
              setConfirmedRemoval(validateConfirmationInput(e.target.value));
            }}
            error={error}
            inputProps={{
              'data-testid': 'remove-snap-confirmation-input',
            }}
            type="text"
          />
          <Box width={BlockSize.Full} display={Display.Flex} gap={4}>
            <Button
              block
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={onCancel}
            >
              {t('nevermind')}
            </Button>
            <Button
              block
              size={ButtonSize.Lg}
              id="popoverRemoveSnapButton"
              danger
              disabled={!confirmedRemoval}
              onClick={async () => {
                if (confirmedRemoval) {
                  await onSubmit();
                }
              }}
            >
              {t('removeSnap')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};

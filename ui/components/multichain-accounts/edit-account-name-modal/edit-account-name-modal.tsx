import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ButtonPrimary,
  ButtonSecondary,
  FormTextField,
  Box
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountLabel } from '../../../store/actions';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

type EditAccountNameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentAccountName: string;
  address: string;
};

export const EditAccountNameModal = ({
  isOpen,
  onClose,
  currentAccountName,
  address,
}: EditAccountNameModalProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [accountName, setAccountName] = useState(currentAccountName);

  const handleSave = () => {
    if (accountName.trim() && accountName !== currentAccountName) {
      dispatch(setAccountLabel(address, accountName.trim()));
    }
    onClose();
  };

  const handleCancel = () => {
    setAccountName(currentAccountName);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('editAccountName')}
        </ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <FormTextField
              label={t('accountName')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={t('enterAccountName')}
              autoFocus
            />
            <Box
              display={Display.Flex}
              gap={3}
              marginTop={4}
            >
              <ButtonSecondary
                onClick={handleCancel}
                block
              >
                {t('cancel')}
              </ButtonSecondary>
              <ButtonPrimary
                onClick={handleSave}
                disabled={!accountName.trim()}
                block
              >
                {t('save')}
              </ButtonPrimary>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

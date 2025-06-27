import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ButtonPrimary,
  FormTextField,
  Box,
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
  const [accountName, setAccountName] = useState('');

  const handleSave = () => {
    if (accountName.trim() && accountName !== currentAccountName) {
      dispatch(setAccountLabel(address, accountName.trim()));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} onBack={onClose}>
          {t('editAccountName')}
        </ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <FormTextField
              label={t('name')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={currentAccountName}
              autoFocus
              helpText={address}
            />
            <ButtonPrimary
              onClick={handleSave}
              disabled={!accountName.trim()}
              block
              marginTop={4}
            >
              {t('save')}
            </ButtonPrimary>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

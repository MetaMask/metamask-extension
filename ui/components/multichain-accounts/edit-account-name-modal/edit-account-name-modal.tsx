import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormTextField,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountLabel } from '../../../store/actions';
import { useDispatch } from 'react-redux';

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
  const [accountName, setAccountName] = useState('');
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleSaveAccountName = () => {
    onClose();
    dispatch(setAccountLabel(address, accountName));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onBack={onClose} onClose={onClose}>
          {t('editAccountName')}
        </ModalHeader>
        <ModalBody>
          <FormTextField
            label={t('name')}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={currentAccountName}
            helpText={address}
          />
        </ModalBody>
        <ModalFooter
          onSubmit={handleSaveAccountName}
          submitButtonProps={{ children: t('save'), disabled: !accountName }}
        />
      </ModalContent>
    </Modal>
  );
};

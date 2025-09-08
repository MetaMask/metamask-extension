import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormTextField,
  Box,
  ButtonSecondary,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountGroupName } from '../../../store/actions';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { getMultichainAccountGroupById } from '../../../selectors/multichain-accounts/account-tree';

export type MultichainAccountEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accountGroupId: AccountGroupId;
};

export const MultichainAccountEditModal = ({
  isOpen,
  onClose,
  accountGroupId,
}: MultichainAccountEditModalProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const accountGroup = useSelector((state) =>
    getMultichainAccountGroupById(state, accountGroupId),
  );
  const currentAccountName = accountGroup?.metadata.name || '';
  const [accountName, setAccountName] = useState('');

  const handleSave = async () => {
    const normalizedAccountName = accountName.trim();
    if (normalizedAccountName && normalizedAccountName !== currentAccountName) {
      await dispatch(
        setAccountGroupName(accountGroupId, normalizedAccountName),
      );
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} onBack={onClose}>
          {t('rename')}
        </ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Box>
              <FormTextField
                label={t('accountName')}
                aria-label={t('accountName')}
                data-testid="account-name-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={currentAccountName}
                autoFocus
              />
            </Box>
            <ButtonSecondary
              onClick={handleSave}
              disabled={!accountName.trim()}
              aria-label={t('confirm')}
              block
              marginTop={4}
            >
              {t('confirm')}
            </ButtonSecondary>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

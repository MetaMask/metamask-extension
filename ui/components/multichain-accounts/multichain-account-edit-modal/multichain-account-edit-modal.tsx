import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  ButtonsAlignment,
  FormTextField,
  TextFieldSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountGroupName } from '../../../store/actions';
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
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const handleSave = useCallback(async () => {
    const normalizedAccountName = accountName.trim();
    if (normalizedAccountName && normalizedAccountName !== currentAccountName) {
      const result = (await dispatch(
        setAccountGroupName(accountGroupId, normalizedAccountName),
      )) as unknown as boolean;

      if (result) {
        onClose();
      } else {
        setShowErrorMessage(true);
      }
    }
  }, [accountName, currentAccountName, accountGroupId, dispatch, onClose]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && accountName.trim()) {
        await handleSave();
      }
    },
    [accountName, handleSave],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          data-testid="account-edit-modal-header"
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
          onBack={onClose}
          backButtonProps={{ ariaLabel: t('back') }}
        >
          {t('rename')}
        </ModalHeader>
        <ModalBody>
          <FormTextField
            id="account-name-input"
            label={t('accountName')}
            data-testid="account-name-input"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentAccountName}
            aria-invalid={showErrorMessage}
            autoFocus
            size={TextFieldSize.Lg}
            isError={showErrorMessage}
            helpText={
              showErrorMessage ? t('accountNameAlreadyInUse') : undefined
            }
          />
        </ModalBody>
        <ModalFooter
          buttonsAlignment={ButtonsAlignment.Vertical}
          secondaryButtonProps={{
            'data-testid': 'account-name-confirm-button',
            disabled: !accountName.trim(),
            children: t('confirm'),
            onClick: handleSave,
          }}
        />
      </ModalContent>
    </Modal>
  );
};

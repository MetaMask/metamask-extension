import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonsAlignment,
  FormTextField,
  IconColor,
  IconName,
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
import { useDispatch } from '../../../store/hooks';

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
  const [accountName, setAccountName] = useState(currentAccountName);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedAccountName = accountName.trim();
  const isSaveDisabled =
    !normalizedAccountName || normalizedAccountName === currentAccountName;

  const handleSave = useCallback(async () => {
    if (isSaveDisabled) {
      return;
    }

    const result = (await dispatch(
      setAccountGroupName(accountGroupId, normalizedAccountName),
    )) as unknown as boolean;

    if (result) {
      onClose();
    } else {
      setShowErrorMessage(true);
    }
  }, [
    isSaveDisabled,
    normalizedAccountName,
    accountGroupId,
    dispatch,
    onClose,
  ]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        await handleSave();
      }
    },
    [handleSave],
  );

  const handleClear = useCallback(() => {
    setAccountName('');
    setShowErrorMessage(false);
    inputRef.current?.focus();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          data-testid="account-edit-modal-header"
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('renameAccount')}
        </ModalHeader>
        <ModalBody>
          <FormTextField
            id="account-name-input"
            data-testid="account-name-input"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
              setShowErrorMessage(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={currentAccountName}
            inputRef={inputRef}
            inputProps={{
              'aria-label': t('accountName'),
              'aria-invalid': showErrorMessage,
            }}
            autoFocus
            size={TextFieldSize.Lg}
            isError={showErrorMessage}
            endAccessory={
              accountName ? (
                <ButtonIcon
                  data-testid="account-name-clear-button"
                  ariaLabel={t('clear')}
                  iconName={IconName.CircleX}
                  size={ButtonIconSize.Md}
                  iconProps={{ color: IconColor.IconAlternative }}
                  onClick={handleClear}
                />
              ) : null
            }
            helpText={
              showErrorMessage ? t('accountNameAlreadyInUse') : undefined
            }
          />
        </ModalBody>
        <ModalFooter
          buttonsAlignment={ButtonsAlignment.Vertical}
          primaryButtonProps={{
            'data-testid': 'account-name-confirm-button',
            isDisabled: isSaveDisabled,
            children: t('save'),
            onClick: handleSave,
          }}
        />
      </ModalContent>
    </Modal>
  );
};

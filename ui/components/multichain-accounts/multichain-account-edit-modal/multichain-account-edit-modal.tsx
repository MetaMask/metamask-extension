import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  HelpText,
  HelpTextSeverity,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
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
  const [helpText, setHelpText] = useState('');
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
        setHelpText(t('accountNameAlreadyInUse'));
        setShowErrorMessage(true);
      }
    }
  }, [accountName, currentAccountName, accountGroupId, dispatch, onClose, t]);

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
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
          onBack={onClose}
          backButtonProps={{ ariaLabel: t('back') }}
        >
          {t('rename')}
        </ModalHeader>
        <ModalBody>
          <Box className="flex" flexDirection={BoxFlexDirection.Column} gap={4}>
            <Box>
              <Label htmlFor="account-name-input">{t('accountName')}</Label>
              <Input
                id="account-name-input"
                aria-label={t('accountName')}
                data-testid="account-name-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentAccountName}
                aria-invalid={showErrorMessage}
                autoFocus
              />
              {showErrorMessage && (
                <HelpText severity={HelpTextSeverity.Danger}>
                  {helpText}
                </HelpText>
              )}
            </Box>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={handleSave}
              disabled={!accountName.trim()}
              aria-label={t('confirm')}
              className="w-full mt-4"
            >
              {t('confirm')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

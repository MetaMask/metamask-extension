import React, { useState, useEffect } from 'react';
import { getAccountLink } from '@metamask/etherscan-link';
import { Snap } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonVariant,
  Modal,
  ModalOverlay,
  Text,
  TextField,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../component-library';

import {
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import InfoTooltip from '../../../ui/info-tooltip';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import { KeyringAccountListItem } from './keyring-account-list-item';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function KeyringRemovalSnapWarning({
  snap,
  keyringAccounts,
  onCancel,
  onClose,
  onSubmit,
  onBack,
  isOpen,
}: {
  snap: Snap;
  keyringAccounts: { name: string; address: string }[];
  onCancel: () => void;
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
  isOpen: boolean;
}) {
  const t = useI18nContext();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedRemoval, setConfirmedRemoval] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState(false);
  const chainId = useSelector(getCurrentChainId);

  useEffect(() => {
    setShowConfirmation(keyringAccounts.length === 0);
  }, [keyringAccounts]);

  const validateConfirmationInput = (input: string): boolean => {
    setError(false);
    if (input === snap.manifest.proposedName) {
      return true;
    }
    setError(true);
    return false;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          modalDialogProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            gap: 4,
          }}
        >
          <ModalHeader
            onBack={() => {
              if (showConfirmation) {
                setShowConfirmation(false);
              } else {
                onBack();
              }
            }}
            onClose={() => {
              setShowConfirmation(false);
              onClose();
            }}
          >
            {t('removeSnap')}
          </ModalHeader>
          <ModalBody
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <BannerAlert severity={BannerAlertSeverity.Warning}>
              {t('backupKeyringSnapReminder')}
            </BannerAlert>
            {showConfirmation === false ? (
              <>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text>{t('removeKeyringSnap')}</Text>
                  <InfoTooltip
                    contentText={t('removeKeyringSnapToolTip')}
                    position="top"
                  />
                </Box>
                {keyringAccounts.map((account, index) => {
                  return (
                    <KeyringAccountListItem
                      key={index}
                      account={account}
                      snapUrl={getAccountLink(account.address, chainId)}
                    />
                  );
                })}
              </>
            ) : (
              <>
                <Text>
                  {t('keyringSnapRemoveConfirmation', [
                    <Text
                      key="keyringSnapRemoveConfirmation2"
                      fontWeight={FontWeight.Bold}
                      as="span"
                    >
                      {snap.manifest.proposedName}
                    </Text>,
                  ])}
                </Text>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore TODO: fix TextField props */}
                <TextField
                  value={confirmationInput}
                  onChange={(e: { target: { value: string } }) => {
                    setConfirmationInput(e.target.value);
                    setConfirmedRemoval(
                      validateConfirmationInput(e.target.value),
                    );
                  }}
                  onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                    e.preventDefault();
                  }}
                  error={error}
                  inputProps={{
                    'data-testid': 'remove-snap-confirmation-input',
                  }}
                />
              </>
            )}
          </ModalBody>
          <ModalFooter
            onCancel={onCancel}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={async () => {
              if (!showConfirmation) {
                setShowConfirmation(true);
                return;
              }
              if (confirmedRemoval) {
                onSubmit();
              }
            }}
            submitButtonProps={{
              id: 'popoverRemoveSnapButton',
              danger: showConfirmation,
              disabled: showConfirmation && !confirmedRemoval,
              children: showConfirmation ? t('removeSnap') : t('continue'),
            }}
            cancelButtonProps={{
              variant: ButtonVariant.Secondary,
              children: t('cancel'),
            }}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

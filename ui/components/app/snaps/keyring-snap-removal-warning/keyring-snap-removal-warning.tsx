import React, { useState } from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import { Snap } from '@metamask/snaps-utils';
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
  JustifyContent,
  Severity,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import InfoTooltip from '../../../ui/info-tooltip';
import { KeyringAccountListItem } from './keyring-account-list-item';

export default function KeyringRemovalSnapWarning({
  snap,
  keyringAccounts,
  onCancel,
  onClose,
  onBack,
  onSubmit,
  isOpen,
}: {
  snap: Snap;
  keyringAccounts: InternalAccount[];
  onCancel: () => void;
  onClose: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isOpen: boolean;
}) {
  const t = useI18nContext();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedRemoval, setConfirmedRemoval] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState(false);

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
              setShowConfirmation(false);
              onBack();
            }}
            onClose={() => {
              setShowConfirmation(false);
              onClose();
            }}
          >
            {t('removeSnap')}
          </ModalHeader>
          {showConfirmation === false ? (
            <>
              <BannerAlert severity={Severity.Warning} className="">
                {t('backupKeyringSnapReminder')}
              </BannerAlert>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text>{t('removeKeyringSnap')}</Text>
                <InfoTooltip contentText={t('removeKeyringSnapToolTip')} />
              </Box>
              {keyringAccounts.map((account, index) => {
                return (
                  <KeyringAccountListItem
                    key={index}
                    account={account}
                    snapUrl={''}
                  />
                );
              })}
            </>
          ) : (
            <>
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
                  marginBottom={4}
                  value={confirmationInput}
                  onChange={(e: { target: { value: string } }) => {
                    setConfirmationInput(e.target.value);
                    setConfirmedRemoval(
                      validateConfirmationInput(e.target.value),
                    );
                  }}
                  error={error}
                  inputProps={{
                    'data-testid': 'remove-snap-confirmation-input',
                  }}
                  type="text"
                />
              </Box>
            </>
          )}
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
              danger={showConfirmation}
              disabled={showConfirmation && !confirmedRemoval}
              onClick={async () => {
                if (!showConfirmation) {
                  setShowConfirmation(true);
                  return;
                }
                if (confirmedRemoval) {
                  onSubmit();
                }
              }}
            >
              {showConfirmation ? t('removeSnap') : t('continue')}
            </Button>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
}

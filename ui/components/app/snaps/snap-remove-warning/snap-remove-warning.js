import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Text,
  Box,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ButtonSize,
  ButtonVariant,
  BannerAlert,
} from '../../../component-library';

import {
  BlockSize,
  Display,
  FlexDirection,
  Severity,
} from '../../../../helpers/constants/design-system';

import { KeyringAccountListItem } from './keyring-account-list-item';
import { RemoveKeyringSnapConfirmationModal } from './remove-keyring-snap-confirmation-modal';

export default function SnapRemoveWarning({
  isOpen,
  onCancel,
  onSubmit,
  snapName,
  keyringAccounts = [],
  snapUrl,
}) {
  const t = useI18nContext();
  const [displayKeyringSnapRemovalModal, setDisplayKeyringSnapRemovalModal] =
    useState(false);

  return (
    <>
      <Modal
        isOpen={isOpen && !displayKeyringSnapRemovalModal}
        onClose={onCancel}
      >
        <ModalOverlay />
        <ModalContent
          modalDialogProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            gap: 4,
          }}
        >
          <ModalHeader onClose={onCancel}>{t('pleaseConfirm')}</ModalHeader>
          {keyringAccounts.length > 0 ? (
            <>
              <BannerAlert severity={Severity.Warning}>
                {t('backupKeyringSnapReminder')}
              </BannerAlert>
              <Text>{t('removeKeyringSnap')}</Text>
              {keyringAccounts.map((account, index) => {
                return (
                  <KeyringAccountListItem
                    key={index}
                    account={account}
                    snapUrl={snapUrl}
                  />
                );
              })}
            </>
          ) : (
            <Text>{t('removeSnapConfirmation', [snapName])}</Text>
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
              danger
              onClick={async () => {
                if (keyringAccounts.length === 0) {
                  await onSubmit();
                } else {
                  setDisplayKeyringSnapRemovalModal(true);
                }
              }}
            >
              {t('removeSnap')}
            </Button>
          </Box>
        </ModalContent>
      </Modal>
      <RemoveKeyringSnapConfirmationModal
        isOpen={isOpen && displayKeyringSnapRemovalModal}
        onClose={onCancel}
        onSubmit={async () => await onSubmit()}
        onBack={() => setDisplayKeyringSnapRemovalModal(false)}
        snapName={snapName}
      />
    </>
  );
}

SnapRemoveWarning.propTypes = {
  /**
   * onCancel handler
   */
  onCancel: PropTypes.func,
  /**
   * onSubmit handler
   */
  onSubmit: PropTypes.func,
  /**
   * Name of snap
   */
  snapName: PropTypes.string,
  /**
   * Whether the modal is open
   */
  isOpen: PropTypes.bool,
  /**
   * Array of keyring accounts
   */
  keyringAccounts: PropTypes.array,
  /**
   * Url of snap
   */
  snapUrl: PropTypes.string,
};

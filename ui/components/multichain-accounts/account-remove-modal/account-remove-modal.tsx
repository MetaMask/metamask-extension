import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';

import { Modal } from '../../component-library/modal/modal';
import { ModalBody } from '../../component-library/modal-body/modal-body';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalFooter } from '../../component-library/modal-footer/modal-footer';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import { ModalOverlay } from '../../component-library/modal-overlay/modal-overlay';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PreferredAvatar } from '../../app/preferred-avatar/preferred-avatar';
import AddressCopyButton from '../../multichain/address-copy-button/address-copy-button';

export type AccountRemoveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  accountName: string;
  accountAddress: string;
};

export const AccountRemoveModal = ({
  isOpen,
  onClose,
  onSubmit,
  accountName,
  accountAddress,
}: AccountRemoveModalProps) => {
  const t = useI18nContext();

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('removeAccount')}</ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <PreferredAvatar address={accountAddress} />
            <Text
              variant={TextVariant.BodyLg}
              fontWeight={FontWeight.Medium}
              className="mt-2 mb-2"
            >
              {accountName}
            </Text>
            <AddressCopyButton address={accountAddress} shorten />
          </Box>
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            marginTop={6}
            marginBottom={2}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold}>
              {t('removeAccountModalBannerTitle')}
            </Text>
            <Text variant={TextVariant.BodyMd}>
              {t('removeAccountModalBannerDescription')}
            </Text>
          </BannerAlert>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          submitButtonProps={{
            children: t('remove'),
            danger: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
};

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

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { AddressCopyButton } from '../../multichain';

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

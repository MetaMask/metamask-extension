import React from 'react';

import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';
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
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('removeAccount')}</ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            flexDirection={FlexDirection.Column}
          >
            <AvatarAccount
              borderColor={BorderColor.transparent}
              size={AvatarAccountSize.Md}
              address={accountAddress}
              variant={
                useBlockie
                  ? AvatarAccountVariant.Blockies
                  : AvatarAccountVariant.Jazzicon
              }
            />
            <Text
              variant={TextVariant.bodyLgMedium}
              marginTop={2}
              marginBottom={2}
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
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Bold}>
              {t('removeAccountModalBannerTitle')}
            </Text>
            <Text variant={TextVariant.bodyMd}>
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

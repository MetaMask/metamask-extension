import React, { useState, FC } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
  ButtonPrimary,
  Box,
  IconName,
  AvatarIcon,
  AvatarIconSize,
} from '../../component-library';
import { ConnectedSitePermissionsPill } from '../connected-site-permissions-pill';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

interface ConnectedSitePermissionsModalProps {
  onClose: () => void;
  siteIcon: string;
  siteName: string;
}

export const ConnectedSitePermissionsModal: FC<
  ConnectedSitePermissionsModalProps
> = ({ onClose, siteIcon, siteName }) => {
  const [open, setOpen] = useState(true);
  const t = useI18nContext();

  const handleOnClose = () => {
    setOpen(false);
    onClose();
  };
  return (
    <Modal isOpen={open} onClose={handleOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleOnClose}>
          {t('permissionsTitle')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingTop={6}
          paddingBottom={2}
          gap={4}
        >
          <Box
            width={BlockSize.TenTwelfths}
            justifyContent={JustifyContent.center}
          >
            <ConnectedSitePermissionsPill
              siteName={siteName}
              siteIcon={siteIcon}
            />
          </Box>

          <Box className="site-permissions-modal-container">
            <Text
              paddingBottom={4}
              paddingTop={2}
              fontWeight={FontWeight.Normal}
              variant={TextVariant.bodyMd}
              color={TextColor.textDefault}
            >
              {t('connectedSitePermissionsSubtitle')}
            </Text>
            <Box
              gap={4}
              paddingBottom={2}
              paddingTop={2}
              alignItems={AlignItems.center}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
            >
              <AvatarIcon
                iconName={IconName.Eye}
                size={AvatarIconSize.Md}
                color={IconColor.primaryDefault}
                backgroundColor={BackgroundColor.primaryMuted}
                borderRadius={BorderRadius.full}
              />
              <Text
                fontWeight={FontWeight.Normal}
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
              >
                {t('connectedSitePermission1')}
              </Text>
            </Box>
            <Box
              gap={4}
              paddingBottom={2}
              paddingTop={2}
              alignItems={AlignItems.center}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
            >
              <AvatarIcon
                iconName={IconName.SecurityTick}
                size={AvatarIconSize.Md}
                color={IconColor.primaryDefault}
                backgroundColor={BackgroundColor.primaryMuted}
                borderRadius={BorderRadius.full}
              />
              <Text
                fontWeight={FontWeight.Normal}
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
              >
                {t('connectedSitePermission2')}
              </Text>
            </Box>
          </Box>
          <ButtonPrimary block onClick={handleOnClose} tabIndex={0}>
            {t('gotItButton')}
          </ButtonPrimary>
        </Box>
      </ModalContent>
    </Modal>
  );
};

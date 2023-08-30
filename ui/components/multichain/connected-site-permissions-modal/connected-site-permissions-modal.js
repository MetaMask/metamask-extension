import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
  ButtonPrimary,
  Box,
  IconName,
  IconSize,
  AvatarIcon,
} from '../../component-library';
import { ConnectedSitePermissionsPill } from '../connected-site-permissions-pill';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const ConnectedSitePermissionsModal = ({ onClose }) => {
  const [open, setOpen] = useState(true);
  const t = useI18nContext();

  const handleOnClose = () => {
    setOpen(false);
    onClose();
  };
  return (
    <Modal isOpen={open} onClose={handleOnClose} autofocus>
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
          <ConnectedSitePermissionsPill
            siteName="app.uniswap.org"
            siteIcon="https://uniswap.org/favicon.ico"
          />

          <Box className="container">
            <Text
              fontWeight={FontWeight.Normal}
              variant={TextVariant.bodyMd}
              color={TextColor.textDefault}
              paddingBottom={4}
            >
              {t('connectedSitePermissionsSubtitle')}
            </Text>
            <Box
              gap={4}
              paddingBottom={4}
              alignItems={AlignItems.center}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
            >
              <AvatarIcon
                iconName={IconName.Eye}
                size={IconSize.Md}
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
              alignItems={AlignItems.center}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              paddingBottom={4}
            >
              <AvatarIcon
                iconName={IconName.SecurityTick}
                size={IconSize.Md}
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
            {t('gotIt')}
          </ButtonPrimary>
        </Box>
      </ModalContent>
    </Modal>
  );
};

ConnectedSitePermissionsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

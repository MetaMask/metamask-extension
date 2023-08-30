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

export const ConnectedSitePermissionsModal = ({ onClose }) => {
  const [open, setOpen] = useState(true);

  const handleOnClose = () => {
    setOpen(false);
    onClose();
  };
  return (
    <Modal isOpen={open} onClose={handleOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleOnClose}>Permissions</ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingTop={6}
          paddingBottom={2}
          gap={2}
        >
          <ConnectedSitePermissionsPill
            siteName="app.uniswap.org"
            siteIcon="https://uniswap.org/favicon.ico"
          />
        </Box>

        <Box gap={2}>
          <Text
            fontWeight={FontWeight.Normal}
            variant={TextVariant.bodyMd}
            color={TextColor.textDefault}
          >
            This site has permission to:
          </Text>

          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            <AvatarIcon
              iconName={IconName.Eye}
              size={IconSize.Md}
              color={IconColor.primaryDefault}
              backgroundColor={BackgroundColor.primaryMuted}
              borderRadius={BorderRadius.full}
            />
            See address, account balance, and activity
          </Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            <AvatarIcon
              iconName={IconName.SecurityTick}
              size={IconSize.Md}
              color={IconColor.primaryDefault}
              backgroundColor={BackgroundColor.primaryMuted}
              borderRadius={BorderRadius.full}
            />
            Suggest transactions to approve
          </Text>
        </Box>
        <ButtonPrimary block onClick={handleOnClose}>
          Got it
        </ButtonPrimary>
      </ModalContent>
    </Modal>
  );
};

ConnectedSitePermissionsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

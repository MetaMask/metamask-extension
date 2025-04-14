// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import PropTypes from 'prop-types';
import {
  ButtonVariant,
  Button,
  Box,
  Modal,
  ModalOverlay,
  Text,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header/deprecated';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';

export enum ConfigureSnapPopupType {
  CONFIGURE = 'configure',
  INSTALL = 'install',
}

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConfigureSnapPopup({
  type,
  isOpen,
  onClose,
  link,
}: {
  type: ConfigureSnapPopupType;
  isOpen: boolean;
  onClose: () => void;
  link: string;
}) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} marginBottom={4}>
          {type === ConfigureSnapPopupType.CONFIGURE
            ? t('configureSnapPopupTitle')
            : t('configureSnapPopupInstallTitle')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.flexStart}
          alignItems={AlignItems.center}
        >
          <img
            src="images/logo/metamask-fox.svg"
            width="54x"
            height="50px"
            style={{ marginBottom: '16px' }}
          />
          <Text
            variant={TextVariant.bodyLgMedium}
            textAlign={TextAlign.Center}
            marginBottom={5}
          >
            {type === ConfigureSnapPopupType.CONFIGURE
              ? t('configureSnapPopupDescription')
              : t('configureSnapPopupInstallDescription')}
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            {t('configureSnapPopupLink')}
          </Text>
          <Button
            variant={ButtonVariant.Link}
            marginBottom={8}
            onClick={() => {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
              // eslint-disable-next-line no-restricted-globals
              global.platform.openTab({
                url: link,
              });
            }}
          >
            {link}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

ConfigureSnapPopup.propTypes = {
  type: PropTypes.oneOf([
    ConfigureSnapPopupType.CONFIGURE,
    ConfigureSnapPopupType.INSTALL,
  ]).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  link: PropTypes.string.isRequired,
};

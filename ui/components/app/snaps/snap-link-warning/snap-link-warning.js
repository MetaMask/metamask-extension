import React from 'react';
import PropTypes from 'prop-types';
import { AvatarIconSize } from '../../../component-library/avatar-icon/avatar-icon.types';
import { Box } from '../../../component-library/box/box';
import { Button } from '../../../component-library/button/button';
import { ButtonLink } from '../../../component-library/button-link/button-link';
import {
  ButtonSize,
  ButtonVariant,
} from '../../../component-library/button/button.types';
import { Icon } from '../../../component-library/icon/icon';
import { IconName } from '../../../component-library/icon/icon.types';
import { Modal } from '../../../component-library/modal/modal';
import { ModalOverlay } from '../../../component-library/modal-overlay/modal-overlay';
import { Text } from '../../../component-library/text/text';
import { ModalContent } from '../../../component-library/modal-content/deprecated/modal-content';
import { ModalHeader } from '../../../component-library/modal-header/deprecated/modal-header';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapLinkDisplay = ({ url }) => {
  const parsedUrl = new URL(url);
  const isHTTPS = parsedUrl.protocol === 'https:';

  // If the link is HTTPS we split on the host to highlight it
  if (isHTTPS) {
    const urlParts = url.split(parsedUrl.host);

    return (
      <>
        {urlParts[0]}
        <b>{parsedUrl.host}</b>
        {urlParts[1]}
      </>
    );
  }

  // Otherwise highlight anything beyond the protocol
  const urlParts = url.split(parsedUrl.protocol);

  return (
    <>
      {parsedUrl.protocol}
      <b>{urlParts[1]}</b>
    </>
  );
};

SnapLinkDisplay.propTypes = {
  /**
   * The URL to display
   */
  url: PropTypes.string,
};

export default function SnapLinkWarning({ isOpen, onClose, url }) {
  const t = useI18nContext();

  return (
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
          onClose={onClose}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            gap: 2,
          }}
        >
          <Icon
            name={IconName.Danger}
            color={IconColor.warningDefault}
            size={AvatarIconSize.Xl}
          />
          <Text variant={TextVariant.headingMd}>{t('leaveMetaMask')}</Text>
          <Text textAlign={TextAlign.Center}>{t('leaveMetaMaskDesc')}</Text>
        </ModalHeader>
        <ButtonLink
          externalLink
          href={url}
          width={BlockSize.Full}
          textProps={{ width: BlockSize.Full }}
        >
          <Box
            display={Display.Flex}
            FlexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderColor={BorderColor.borderDefault}
            borderStyle={BorderStyle.solid}
            borderRadius={BorderRadius.MD}
            paddingTop={3}
            paddingBottom={3}
            paddingRight={4}
            paddingLeft={4}
            width={BlockSize.Full}
          >
            <Text
              ellipsis
              style={{ overflow: 'hidden' }}
              color={TextColor.primaryDefault}
            >
              <SnapLinkDisplay url={url} />
            </Text>
            <Icon
              name={IconName.Export}
              color={IconColor.iconAlternative}
              marginLeft={2}
            />
          </Box>
        </ButtonLink>
        <Box width={BlockSize.Full} display={Display.Flex} gap={4}>
          <Button
            block
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onClose}
          >
            {t('back')}
          </Button>
          <Button
            block
            size={ButtonSize.Lg}
            data-testid="modalSnapLinkButton"
            href={url}
            externalLink
            onClick={onClose}
          >
            {t('visitSite')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

SnapLinkWarning.propTypes = {
  /**
   * whether if the modal is open or not
   */
  isOpen: PropTypes.bool,
  /**
   * onCancel handler
   */
  onClose: PropTypes.func,
  /**
   * The URL to display
   */
  url: PropTypes.string,
};

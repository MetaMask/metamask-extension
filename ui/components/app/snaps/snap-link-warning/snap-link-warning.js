import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarIconSize,
  Box,
  Button,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  Modal,
  ModalOverlay,
  Text,
} from '../../../component-library';
import { ModalContent } from '../../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../../component-library/modal-header/deprecated';
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

export default function SnapLinkWarning({ isOpen, onClose, url }) {
  const t = useI18nContext();

  const parsedUrl = url && new URL(url);
  const urlParts = parsedUrl && url.split(parsedUrl.host);
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
            {parsedUrl && (
              <Text
                ellipsis
                style={{ overflow: 'hidden' }}
                color={TextColor.primaryDefault}
              >
                {urlParts[0]}
                <b>{parsedUrl.host}</b>
                {urlParts[1]}
              </Text>
            )}
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

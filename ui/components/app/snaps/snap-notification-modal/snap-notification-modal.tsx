import React from 'react';
import { useSelector } from 'react-redux';
import { Box, ButtonLink, Icon, IconName, IconSize, Modal, ModalContent, ModalHeader, ModalOverlay, Text } from '../../../component-library';
import { AlignItems, BackgroundColor, BorderRadius, Display, FlexDirection, TextAlign, TextColor, TextVariant } from '../../../../helpers/constants/design-system';
import { RawSnapNotification } from '../../../../pages/notifications/snap/types/types';
import { hasProperty } from '@metamask/utils';
import { SnapIcon } from '../snap-icon';
import { getSnapMetadata } from '../../../../selectors';
import { SnapUIMarkdown } from '../snap-ui-markdown';
import { SnapUIRenderer } from '../snap-ui-renderer';

type SnapNotificationModalProps = {
  handleClose: () => void;
  isOpen: boolean;
  data: RawSnapNotification;
}

const SnapNotificationModal = ({ handleClose, isOpen, data }: SnapNotificationModalProps) => {
  const { expandedView } = data;
  const hasFooter = hasProperty(expandedView, 'footerLink');
  const { name: snapName } = useSelector((state) =>
    // @ts-expect-error incorrectly typed
    getSnapMetadata(state, data.origin),
  );

  const SnapNotificationModalFooter = () => {
    const { footerLink: { href, text } } = expandedView;
    return (
      <ButtonLink externalLink href={href}>
        {text}
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      </ButtonLink>
    )
  }

  const SnapNotificationContentHeader = () => {
    return (
      <Box className="snap-notification-modal__content__header" style={{ borderBottom: '1px solid', borderColor: 'var(--color-border-muted)' }}>
        <Box>
          <SnapIcon snapId={data.origin} avatarSize={IconSize.Xl} />
          <Text>{snapName}</Text>
        </Box>
        <Box
          color={TextColor.textDefault}
          className="snap-notifications__item__details__message"
        >
          <SnapUIMarkdown markdown>{data.message}</SnapUIMarkdown>
        </Box>
      </Box>
    )
  }

  const SnapNotificationContent = () => {
    return (
      <Box paddingTop={4}>
        <SnapUIRenderer
          snapId={data.origin}
          interfaceId={expandedView.interfaceId}
          useDelineator={false}
          contentBackgroundColor={BackgroundColor.backgroundDefault}
        />
      </Box>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="snaps-notification-modal"
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          onClose={handleClose}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            gap: 2,
            marginBottom: 6,
          }}
        >
          <Text variant={TextVariant.bodyMdMedium} textAlign={TextAlign.Center}>
            {data.expandedView.title}
          </Text>
        </ModalHeader>
        <Box className="snap-notification-modal__content" backgroundColor={BackgroundColor.backgroundDefault} borderRadius={BorderRadius.LG} marginBottom={4}>
          <SnapNotificationContentHeader />
          <SnapNotificationContent />
        </Box>
        {hasFooter && <SnapNotificationModalFooter />}
      </ModalContent>
    </Modal>
  );
}

export default SnapNotificationModal;
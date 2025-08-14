import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Button,
  ModalFooter,
  ModalBody,
  ButtonSize,
  ButtonIconSize,
  IconName,
  ButtonIcon,
  Box,
  AvatarIcon,
  AvatarIconSize,
  ButtonVariant,
  ButtonLink,
  ButtonLinkSize,
} from '../../component-library';
import { ThemeType } from '../../../../shared/constants/preferences';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ShieldEntryModal() {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={() => undefined} className="shield-entry-modal">
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        modalDialogProps={{ paddingTop: 0, paddingBottom: 6 }}
      >
        <ModalHeader
          paddingTop={4}
          className="shield-entry-modal__header h-[160px] flex items-center"
          data-theme={ThemeType.dark}
        >
          <Text
            variant={TextVariant.displayMd}
            className="shield-entry-modal__title"
          >
            {t('shieldEntryModalTitle')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            ariaLabel={t('close')}
            size={ButtonIconSize.Sm}
            className="absolute top-2 right-2"
          />
        </ModalHeader>
        <ModalBody paddingTop={4}>
          <Text variant={TextVariant.headingMd} marginBottom={1}>
            {t('shieldEntryModalSubtitle')}
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            {t('shieldEntryModalDescription', [
              '$8',
              <ButtonLink
                key="learn-more-link"
                size={ButtonLinkSize.Inherit}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>,
            ])}
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon size={AvatarIconSize.Sm} iconName={IconName.Plant} />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalAssetCoverage')}
              </Text>
            </Box>
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon
                size={AvatarIconSize.Sm}
                iconName={IconName.ShieldLock}
              />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalProtection')}
              </Text>
            </Box>
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon size={AvatarIconSize.Sm} iconName={IconName.Flash} />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalSupport')}
              </Text>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              block
            >
              {t('shieldEntryModalSkip')}
            </Button>
            <Button size={ButtonSize.Lg} block>
              {t('shieldEntryModalGetStarted')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

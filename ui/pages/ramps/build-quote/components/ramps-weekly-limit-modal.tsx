import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  AvatarIcon,
  AvatarIconSize,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type RampsWeeklyLimitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  supportUrl: string | null;
  onContactSupport: () => void;
};

export default function RampsWeeklyLimitModal({
  isOpen,
  onClose,
  providerName,
  supportUrl,
  onContactSupport,
}: RampsWeeklyLimitModalProps) {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{ 'data-testid': 'ramps-weekly-limit-modal' }}
      >
        <ModalHeader onClose={onClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <AvatarIcon
              iconName={IconName.Danger}
              size={AvatarIconSize.Md}
              color={IconColor.errorDefault}
              backgroundColor={BackgroundColor.errorMuted}
            />
            <Text variant={TextVariant.HeadingSm} className="text-center">
              {t('rampsWeeklyLimitReached')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('rampsWeeklyLimitDescription')}
            </Text>
            <ol className="list-decimal pl-5">
              <li>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t('rampsWeeklyLimitReasonLargeOrders')}
                </Text>
              </li>
              <li>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t('rampsWeeklyLimitReasonTimeLimits')}
                </Text>
              </li>
            </ol>
          </Box>
          <Box className="pt-4" flexDirection={BoxFlexDirection.Column} gap={2}>
            {supportUrl ? (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                className="w-full"
                onClick={onContactSupport}
                data-testid="ramps-weekly-limit-contact-support"
              >
                {t('rampsContactProviderSupport', [providerName])}
              </Button>
            ) : null}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full"
              onClick={onClose}
              data-testid="ramps-weekly-limit-got-it"
            >
              {t('gotIt')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

import React, { useContext } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  BoxFlexDirection,
  TextButton,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function PasskeyTroubleshootModal({
  onClose,
  onOpenFullScreen,
}: {
  onClose: () => void;
  onOpenFullScreen: () => void;
}) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const handleContactSupportTrackEvent = () => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  };

  const handleOpenFullScreen = () => {
    onOpenFullScreen();
    onClose();
  };

  const handleStillHavingTrouble = () => {
    handleContactSupportTrackEvent();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="passkey-troubleshoot-modal"
      data-testid="passkey-troubleshoot-modal"
    >
      <ModalOverlay />
      <ModalContent style={{ alignItems: 'center' }}>
        <ModalHeader
          onClose={onClose}
          childrenWrapperProps={{
            className: 'flex flex-col items-center justify-center gap-4',
          }}
        >
          <Text
            variant={TextVariant.HeadingSm}
            className="mb-4 mx-auto"
            color={TextColor.TextDefault}
            textAlign={TextAlign.Center}
          >
            {t('passkeyTroubleshootModalTitle')}
          </Text>
        </ModalHeader>
        <Box paddingHorizontal={4}>
          <Text
            variant={TextVariant.BodyMd}
            className="mb-6"
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {t('passkeyTroubleshootModalDescription')}
          </Text>
          <Box flexDirection={BoxFlexDirection.Column} gap={3}>
            <Button
              data-testid="passkey-troubleshoot-open-full-screen-button"
              variant={ButtonVariant.Primary}
              onClick={handleOpenFullScreen}
              size={ButtonSize.Lg}
              className="w-full"
            >
              {t('passkeyTroubleshootModalOpenFullScreen')}
            </Button>
            <TextButton
              color={TextColor.PrimaryDefault}
              className="w-full text-center"
              onClick={handleStillHavingTrouble}
              asChild
            >
              <a
                data-testid="passkey-troubleshoot-still-having-trouble-link"
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('passkeyTroubleshootModalStillHavingTrouble')}
              </a>
            </TextButton>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

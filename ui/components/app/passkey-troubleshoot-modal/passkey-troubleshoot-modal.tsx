import React, { useContext, useEffect, useMemo, useRef } from 'react';
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
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export type PasskeyTroubleshootModalMode = 'unlock' | 'verify';

type PasskeyTroubleshootModalProps = Readonly<{
  mode: PasskeyTroubleshootModalMode;
  location: string;
  onClose: () => void;
  onOpenFullScreen: () => void;
}>;

export default function PasskeyTroubleshootModal({
  mode,
  location: troubleshootLocation,
  onClose,
  onOpenFullScreen,
}: PasskeyTroubleshootModalProps) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const baseProperties = useMemo(
    () => ({
      location: troubleshootLocation,
      mode,
    }),
    [troubleshootLocation, mode],
  );

  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }
    hasTrackedView.current = true;
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshoot,
      properties: {
        ...baseProperties,
        cta: 'modal',
      },
    });
  }, [baseProperties, trackEvent]);

  const handleContactSupportTrackEvent = () => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: ZENDESK_URLS.PASSKEYS,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  };

  const handleOpenFullScreen = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshoot,
      properties: {
        ...baseProperties,
        cta: 'full_screen',
      },
    });
    onOpenFullScreen();
    onClose();
  };

  const handleStillHavingTrouble = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshoot,
      properties: {
        ...baseProperties,
        cta: 'support',
      },
    });
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
            {t(
              mode === 'unlock'
                ? 'passkeyTroubleshootUnlockModalTitle'
                : 'passkeyTroubleshootVerifyModalTitle',
            )}
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
              className="text-center"
              onClick={handleStillHavingTrouble}
              asChild
            >
              <a
                data-testid="passkey-troubleshoot-still-having-trouble-link"
                href={ZENDESK_URLS.PASSKEYS}
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

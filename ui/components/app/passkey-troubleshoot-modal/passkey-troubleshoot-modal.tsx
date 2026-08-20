import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useSegmentContext } from '../../../hooks/useSegmentContext';

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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();

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
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeyTroubleshoot)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          ...baseProperties,
          cta: 'modal',
        })
        .build(),
    );
  }, [baseProperties, createEventBuilder, trackEvent]);

  const handleContactSupportTrackEvent = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          url: ZENDESK_URLS.PASSKEYS,
          [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
        })
        .build(),
    );
  }, [createEventBuilder, segmentContext.page?.title, trackEvent]);

  const handleOpenFullScreen = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeyTroubleshoot)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          ...baseProperties,
          cta: 'full_screen',
        })
        .build(),
    );
    onOpenFullScreen();
    onClose();
  };

  const handleStillHavingTrouble = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeyTroubleshoot)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          ...baseProperties,
          cta: 'support',
        })
        .build(),
    );
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

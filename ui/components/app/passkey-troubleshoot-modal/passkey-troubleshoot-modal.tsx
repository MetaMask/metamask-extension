import React, { useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getAccountType } from '../../../../shared/lib/selectors/keyring';
import { getPasskeyDerivationMethod } from '../../../selectors';

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
  const accountType = useSelector(getAccountType);
  const passkeyDerivationMethod = useSelector(getPasskeyDerivationMethod);

  const baseProperties = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      account_type: accountType,
      location: troubleshootLocation,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      environment_type: getEnvironmentType(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      derivation_method: passkeyDerivationMethod,
    }),
    [accountType, passkeyDerivationMethod, troubleshootLocation],
  );

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshootClicked,
      properties: baseProperties,
    });
  }, [baseProperties, trackEvent]);

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
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshootCtaClicked,
      properties: {
        ...baseProperties,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cta: 'full_screen',
      },
    });
    onOpenFullScreen();
    onClose();
  };

  const handleStillHavingTrouble = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyTroubleshootCtaClicked,
      properties: {
        ...baseProperties,
        // eslint-disable-next-line @typescript-eslint/naming-convention
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

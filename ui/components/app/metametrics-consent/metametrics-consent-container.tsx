import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getDataCollectionForMarketing } from '../../../selectors/metametrics';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import {
  optOutOfMarketing,
  optInToMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { METAMETRICS_SETTINGS_LINK } from '../../../helpers/constants/common';
import { useDispatch } from '../../../store/hooks';

export function MetaMetricsConsentContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);

  // Social-login wallets also store the choice server-side so the auth
  // service can create the HubSpot contact for email marketing and learn
  // of opt-outs. A failed sync keeps the local decision; reads that would
  // overwrite the local choice stay removed.
  const syncMarketingConsentToServer = useCallback(
    (consent: boolean) => {
      if (socialLoginEnabled) {
        dispatch(setMarketingConsent(consent));
      }
    },
    [dispatch, socialLoginEnabled],
  );

  const handleClose = useCallback(() => {
    dispatch(optOutOfMarketing());
    syncMarketingConsentToServer(false);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          location: 'marketing_consent_modal',
        })
        .build(),
    );
  }, [createEventBuilder, dispatch, syncMarketingConsentToServer, trackEvent]);

  const handleConsent = useCallback(
    (consent: boolean) => {
      dispatch(consent ? optInToMarketing() : optOutOfMarketing());
      syncMarketingConsentToServer(consent);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Home)
          .addProperties({
            [MetaMetricsUserTrait.HasMarketingConsent]: consent,
            location: 'marketing_consent_modal',
          })
          .build(),
      );
    },
    [createEventBuilder, dispatch, syncMarketingConsentToServer, trackEvent],
  );

  if (dataCollectionForMarketing !== null) {
    return null;
  }

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('onboardedMetametricsTitle')}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text>
              {t('onboardedMetametricsParagraph1', [
                <a
                  href={METAMETRICS_SETTINGS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  key="retention-link"
                >
                  {t('onboardedMetametricsLink')}
                </a>,
              ])}
            </Text>
            <Text>{t('onboardedMetametricsParagraph2')}</Text>
            <ul className="home__onboarding_list">
              <li>{t('onboardedMetametricsKey1')}</li>
              <li>{t('onboardedMetametricsKey2')}</li>
              <li>{t('onboardedMetametricsKey3')}</li>
            </ul>
            <Text>{t('onboardedMetametricsParagraph3')}</Text>
          </Box>
        </ModalBody>
        <ModalFooter
          secondaryButtonProps={{
            children: t('onboardedMetametricsDisagree'),
            onClick: () => handleConsent(false),
          }}
          primaryButtonProps={{
            children: t('onboardedMetametricsAccept'),
            onClick: () => handleConsent(true),
          }}
        />
      </ModalContent>
    </Modal>
  );
}

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
import {
  getConsentDecisionMade,
  getDataCollectionForMarketing,
  getOptedIn,
} from '../../../selectors/metametrics';
import { setDataCollectionForMarketing } from '../../../store/actions';
import { METAMETRICS_SETTINGS_LINK } from '../../../helpers/constants/common';
import type { MetaMaskReduxState } from '../../../store/types';
import { useDispatch } from '../../../store/hooks';

export function MetaMetricsConsentContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const isMetaMetricsEnabled = useSelector(
    (state: MetaMaskReduxState) =>
      getConsentDecisionMade(state) && getOptedIn(state),
  );

  const handleClose = useCallback(() => {
    dispatch(setDataCollectionForMarketing(false));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          location: 'marketing_consent_modal',
        })
        .build(),
    );
  }, [createEventBuilder, dispatch, trackEvent]);

  const handleConsent = useCallback(
    (consent: boolean) => {
      dispatch(setDataCollectionForMarketing(consent));
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
    [createEventBuilder, dispatch, trackEvent],
  );

  if (dataCollectionForMarketing !== null || !isMetaMetricsEnabled) {
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

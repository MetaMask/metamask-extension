import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../selectors/metametrics';
import { setDataCollectionForMarketing } from '../../../store/actions';
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { METAMETRICS_SETTINGS_LINK } from '../../../helpers/constants/common';
import type { MetaMaskReduxState } from '../../../store/store';

export function MetaMetricsConsentContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const dataCollectionForMarketing = useSelector(
    (state: MetaMaskReduxState) => state.metamask.dataCollectionForMarketing,
  );
  const isMetaMetricsEnabled = useSelector(
    (state: MetaMaskReduxState) =>
      getCompletedMetaMetricsOnboarding(state) && getOptedIn(state),
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
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          gap={4}
          paddingBottom={0}
        >
          {t('onboardedMetametricsTitle')}
        </ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            margin={4}
          >
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
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            gap={2}
            width={BlockSize.Full}
          >
            <Button type="secondary" onClick={() => handleConsent(false)}>
              {t('onboardedMetametricsDisagree')}
            </Button>
            <Button type="primary" onClick={() => handleConsent(true)}>
              {t('onboardedMetametricsAccept')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

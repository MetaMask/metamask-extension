import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_REVEAL_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonIcon,
  IconName,
  ButtonIconSize,
} from '../../../components/component-library';
import {
  TextVariant,
  JustifyContent,
  BlockSize,
  TextColor,
  IconColor,
  FontWeight,
  Display,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function RecoveryPhrase({ secretRecoveryPhrase }) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const { search } = useLocation();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');

  const queryParams = new URLSearchParams();
  if (isFromReminder) {
    queryParams.set('isFromReminder', isFromReminder);
  }
  if (isFromSettingsSecurity) {
    queryParams.set('isFromSettingsSecurity', isFromSettingsSecurity);
  }
  const nextRouteQueryString = queryParams.toString();

  useEffect(() => {
    if (!secretRecoveryPhrase) {
      navigate({
        pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
        search: nextRouteQueryString ? `?${nextRouteQueryString}` : '',
        replace: true,
      });
    }
  }, [navigate, secretRecoveryPhrase, nextRouteQueryString]);

  const trackEvent = useContext(MetaMetricsContext);

  const handleContinue = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });

    navigate(
      `${ONBOARDING_CONFIRM_SRP_ROUTE}${
        nextRouteQueryString ? `?${nextRouteQueryString}` : ''
      }`,
    );
  }, [hdEntropyIndex, navigate, trackEvent, nextRouteQueryString]);

  const handleOnShowSrpDetailsModal = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SrpDefinitionClicked,
      properties: {
        location: 'review_recovery_phrase',
      },
    });
    setShowSrpDetailsModal(true);
  }, [trackEvent]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.Center}
      height={BlockSize.Full}
      gap={6}
      className="recovery-phrase"
      data-testid="recovery-phrase"
    >
      <Box>
        {showSrpDetailsModal && (
          <SRPDetailsModal onClose={() => setShowSrpDetailsModal(false)} />
        )}
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="review-srp-back-button"
            onClick={() => navigate(-1)}
            ariaLabel={t('back')}
          />
        </Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          {!isFromReminder && (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('stepOf', [2, 3])}
            </Text>
          )}
          <Text variant={TextVariant.headingLg} as="h2">
            {t('seedPhraseReviewTitle')}
          </Text>
        </Box>
        <Box marginBottom={6}>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {t('seedPhraseReviewDetails', [
              <ButtonLink
                key="seedPhraseReviewDetails"
                size={ButtonLinkSize.Inherit}
                onClick={handleOnShowSrpDetailsModal}
              >
                {t('secretRecoveryPhrase')}
              </ButtonLink>,
              <Text
                key="seedPhraseReviewDetails2"
                fontWeight={FontWeight.Medium}
                color={TextColor.textAlternative}
              >
                {t('seedPhraseReviewDetails2')}
              </Text>,
            ])}
          </Text>
        </Box>
        <RecoveryPhraseChips
          secretRecoveryPhrase={secretRecoveryPhrase.split(' ')}
          phraseRevealed={phraseRevealed}
          revealPhrase={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event:
                MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
              properties: {
                hd_entropy_index: hdEntropyIndex,
              },
            });
            setPhraseRevealed(true);
          }}
        />
      </Box>
      <Box width={BlockSize.Full}>
        <Button
          width={BlockSize.Full}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          data-testid="recovery-phrase-continue"
          className="recovery-phrase__footer--button"
          disabled={!phraseRevealed}
          onClick={handleContinue}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}

RecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};

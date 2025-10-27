import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_REVEAL_SRP_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
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
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getHDEntropyIndex } from '../../../selectors';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import RecoveryPhraseChips from './recovery-phrase-chips';
import SkipSRPBackup from './skip-srp-backup-popover';

export default function RecoveryPhrase({ secretRecoveryPhrase }) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const { search } = useLocation();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);
  const [showSkipSRPBackupPopover, setShowSkipSRPBackupPopover] =
    useState(false);
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
      navigate(
        {
          pathname: ONBOARDING_REVEAL_SRP_ROUTE,
          search: nextRouteQueryString ? `?${nextRouteQueryString}` : '',
        },
        {
          replace: true,
        },
      );
    }
  }, [navigate, secretRecoveryPhrase, nextRouteQueryString]);

  const handleContinue = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });

    navigate({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: nextRouteQueryString ? `?${nextRouteQueryString}` : '',
    });
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

  const handleClickNotRecommended = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecuritySkipInitiated,
      properties: {
        hd_entropy_index: hdEntropyIndex ?? 0,
      },
    });
    setShowSkipSRPBackupPopover(true);
  };

  const handleBack = useCallback(() => {
    navigate(
      `${ONBOARDING_REVEAL_SRP_ROUTE}${
        nextRouteQueryString ? `?${nextRouteQueryString}` : ''
      }`,
      { replace: true },
    );
  }, [navigate, nextRouteQueryString]);

  const onClose = useCallback(() => {
    navigate(REVEAL_SRP_LIST_ROUTE, { replace: true });
  }, [navigate]);

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
        {showSkipSRPBackupPopover &&
          !isFromReminder &&
          !isFromSettingsSecurity && (
            <SkipSRPBackup
              onClose={() => setShowSkipSRPBackupPopover(false)}
              secureYourWallet={handleContinue}
            />
          )}
        {showSrpDetailsModal && (
          <SRPDetailsModal onClose={() => setShowSrpDetailsModal(false)} />
        )}
        {isFromReminder && isFromSettingsSecurity ? (
          <Box
            className="recovery-phrase__header"
            display={Display.Grid}
            alignItems={AlignItems.center}
            gap={3}
            marginBottom={4}
            width={BlockSize.Full}
          >
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.iconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-review-back-button"
              onClick={handleBack}
              ariaLabel={t('back')}
            />
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('seedPhraseReviewTitleSettings')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              color={IconColor.iconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-review-close-button"
              onClick={onClose}
              ariaLabel={t('close')}
            />
          </Box>
        ) : (
          <Box
            justifyContent={JustifyContent.flexStart}
            marginBottom={4}
            width={BlockSize.Full}
          >
            <Text variant={TextVariant.headingLg} as="h2">
              {t('seedPhraseReviewTitle')}
            </Text>
          </Box>
        )}
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
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
      >
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
        {!isFromReminder && (
          <Button
            width={BlockSize.Full}
            variant={ButtonVariant.Link}
            size={ButtonSize.Lg}
            onClick={handleClickNotRecommended}
            type="button"
            data-testid="recovery-phrase-remind-later"
          >
            {t('secureWalletRemindLaterButton')}
          </Button>
        )}
      </Box>
    </Box>
  );
}

RecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};

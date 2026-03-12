import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  TextVariant,
  TextColor,
  IconColor,
  TextAlign,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getHDEntropyIndex, getFirstTimeFlowType } from '../../../selectors';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import { TraceName } from '../../../../shared/lib/trace';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import RecoveryPhraseChips from './recovery-phrase-chips';

type RecoveryPhraseProps = {
  secretRecoveryPhrase: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RecoveryPhrase({
  secretRecoveryPhrase,
}: RecoveryPhraseProps) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const { search } = useLocation();
  const dispatch = useDispatch();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const hasSeedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const { trackEvent, bufferedEndTrace } = useContext(MetaMetricsContext);
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
      navigate(
        {
          pathname: ONBOARDING_REVEAL_SRP_ROUTE,
          search: nextRouteQueryString ? `?${nextRouteQueryString}` : '',
        },
        {
          replace: true,
        },
      );
    } else if (hasSeedPhraseBackedUp) {
      // if user has already done the Secure Wallet flow, we can redirect to the next page
      const isFirefox = getBrowserName() === PLATFORM_FIREFOX;
      navigate(
        isFirefox ? ONBOARDING_COMPLETION_ROUTE : ONBOARDING_METAMETRICS,
        { replace: true },
      );
    }
  }, [
    navigate,
    secretRecoveryPhrase,
    nextRouteQueryString,
    hasSeedPhraseBackedUp,
  ]);

  const handleContinue = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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

  const handleRemindLater = useCallback(async () => {
    await dispatch(setSeedPhraseBackedUp(false));

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecuritySkipConfirmed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    bufferedEndTrace?.({ name: TraceName.OnboardingNewSrpCreateWallet });
    bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });

    if (
      getBrowserName() === PLATFORM_FIREFOX ||
      firstTimeFlowType === FirstTimeFlowType.restore
    ) {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_METAMETRICS, { replace: true });
    }
  }, [
    bufferedEndTrace,
    dispatch,
    firstTimeFlowType,
    hdEntropyIndex,
    navigate,
    trackEvent,
  ]);

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
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      gap={6}
      className="recovery-phrase h-full"
      data-testid="recovery-phrase"
    >
      <Box>
        {showSrpDetailsModal && (
          <SRPDetailsModal onClose={() => setShowSrpDetailsModal(false)} />
        )}
        {isFromReminder && isFromSettingsSecurity ? (
          <Box
            className="recovery-phrase__header grid w-full"
            alignItems={BoxAlignItems.Center}
            gap={3}
            marginBottom={4}
          >
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-review-back-button"
              onClick={handleBack}
              ariaLabel={t('back')}
            />
            <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
              {t('seedPhraseReviewTitleSettings')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              color={IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-review-close-button"
              onClick={onClose}
              ariaLabel={t('close')}
            />
          </Box>
        ) : (
          <Box
            justifyContent={BoxJustifyContent.Start}
            marginBottom={4}
            className="w-full"
          >
            <Text variant={TextVariant.HeadingLg}>
              {t('seedPhraseReviewTitle')}
            </Text>
          </Box>
        )}
        <Box>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('seedPhraseReviewDetails', [
              <TextButton
                key="seedPhraseReviewDetails"
                onClick={handleOnShowSrpDetailsModal}
                className="hover:bg-transparent active:bg-transparent w-fit"
              >
                {t('secretRecoveryPhrase')}
              </TextButton>,
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
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              },
            });
            setPhraseRevealed(true);
          }}
        />
      </Box>
      <Box className="w-full" flexDirection={BoxFlexDirection.Column} gap={2}>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          data-testid="recovery-phrase-continue"
          className="recovery-phrase__footer--button w-full"
          disabled={!phraseRevealed}
          onClick={handleContinue}
        >
          {t('continue')}
        </Button>
        {!isFromReminder && (
          <TextButton
            size={TextButtonSize.BodyMd}
            onClick={handleRemindLater}
            className="w-full hover:bg-transparent active:bg-transparent"
            data-testid="recovery-phrase-remind-later"
          >
            {t('secureWalletRemindLaterButton')}
          </TextButton>
        )}
      </Box>
    </Box>
  );
}

RecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};

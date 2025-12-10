import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
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
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedEndTrace } = trackEvent;
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
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      gap={6}
      className="recovery-phrase"
      data-testid="recovery-phrase"
    >
      <Box>
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
            onClick={handleRemindLater}
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

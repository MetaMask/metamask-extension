import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  COHORT_NAMES,
  MODAL_TYPE,
  ModalType,
  SubscriptionUserEvent,
} from '@metamask/subscription-controller';
import {
  BoxJustifyContent,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
} from '@metamask/design-system-react';
import log from 'loglevel';
import {
  MarketingMoment,
  type MarketingMomentAction,
} from '../../ui/marketing-moment';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setShowShieldEntryModalOnce,
  submitSubscriptionUserEvents,
} from '../../../store/actions';
import {
  SETTINGS_ROUTE,
  SHIELD_PLAN_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getShouldSubmitEventsForShieldEntryModal,
  getShieldEntryModalTriggeringCohort,
  getModalTypeForShieldEntryModal,
} from '../../../selectors';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  ShieldMetricsSourceEnum,
  ShieldCtaActionClickedEnum,
} from '../../../../shared/constants/subscriptions';
import { TRANSACTION_SHIELD_LINK } from '../../../helpers/constants/common';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  determineSubscriptionMetricsSourceFromMarketingUtmParams,
  getShieldMarketingUtmParamsForMetrics,
} from '../../../../shared/lib/shield';
import { useDispatch } from '../../../store/hooks';
import ShieldIllustrationAnimation from './shield-illustration-animation';

const ShieldEntryModal = ({
  skipEventSubmission = false,
  onClose,
}: {
  skipEventSubmission?: boolean;
  onClose?: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { captureShieldEntryModalEvent, captureShieldCtaClickedEvent } =
    useSubscriptionMetrics();
  const shouldSubmitEvent = useSelector(
    getShouldSubmitEventsForShieldEntryModal,
  );
  const modalType: ModalType = useSelector(getModalTypeForShieldEntryModal);
  const triggeringCohort = useSelector(getShieldEntryModalTriggeringCohort);

  const [actionLoading, setActionLoading] = useState(false);

  const determineEntryModalSource = useCallback((): ShieldMetricsSourceEnum => {
    const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);
    const source =
      determineSubscriptionMetricsSourceFromMarketingUtmParams(
        marketingUtmParams,
      );
    if (source) {
      return source;
    }

    if (triggeringCohort === COHORT_NAMES.POST_TX) {
      return ShieldMetricsSourceEnum.PostTransaction;
    } else if (triggeringCohort === COHORT_NAMES.WALLET_HOME) {
      return ShieldMetricsSourceEnum.Homepage;
    } else if (pathname.startsWith(SETTINGS_ROUTE)) {
      return ShieldMetricsSourceEnum.Settings;
    }

    return ShieldMetricsSourceEnum.Homepage;
  }, [triggeringCohort, pathname, search]);

  const handleOnClose = async (
    ctaActionClicked: ShieldCtaActionClickedEnum = ShieldCtaActionClickedEnum.Dismiss,
  ) => {
    try {
      const source = determineEntryModalSource();
      const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);
      captureShieldEntryModalEvent({
        source,
        type: modalType,
        modalCtaActionClicked: ctaActionClicked,
        marketingUtmParams,
      });

      if (ctaActionClicked === ShieldCtaActionClickedEnum.Dismiss) {
        captureShieldCtaClickedEvent({
          source,
          ctaActionClicked: ShieldCtaActionClickedEnum.Dismiss,
          marketingUtmParams,
        });
      }

      if (skipEventSubmission) {
        onClose?.();
        return;
      } else if (shouldSubmitEvent) {
        await dispatch(
          submitSubscriptionUserEvents({
            event: SubscriptionUserEvent.ShieldEntryModalViewed,
            cohort: triggeringCohort,
          }),
        );
      }

      await dispatch(
        setShowShieldEntryModalOnce({
          show: false,
          hasUserInteractedWithModal: true,
        }),
      );
    } catch (error) {
      log.error('[handleOnClose] error', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnGetStarted = async () => {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      const source = determineEntryModalSource();
      const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);

      captureShieldCtaClickedEvent({
        // ShieldCtaSourceEnum & EntryModalSourceEnum are the same enum, so we can cast it to ShieldCtaSourceEnum
        source,
        ctaActionClicked: ShieldCtaActionClickedEnum.Start14DayTrial,
        redirectToPage: SHIELD_PLAN_ROUTE,
        marketingUtmParams,
      });

      // Ensure handleOnClose completes before redirecting
      await handleOnClose(ShieldCtaActionClickedEnum.Start14DayTrial);

      navigate({
        pathname: SHIELD_PLAN_ROUTE,
        search:
          Object.keys(marketingUtmParams).length > 0
            ? `?${new URLSearchParams(marketingUtmParams).toString()}`
            : `?source=${source}`,
      });
    } catch (error) {
      log.error('[handleOnGetStarted] error', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnLearnMoreClick = () => {
    if (actionLoading) {
      return;
    }
    setActionLoading(true);

    try {
      const source = determineEntryModalSource();
      const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);
      captureShieldCtaClickedEvent({
        // ShieldCtaSourceEnum & EntryModalSourceEnum are the same enum, so we can cast it to ShieldCtaSourceEnum
        source,
        ctaActionClicked: ShieldCtaActionClickedEnum.LearnMore,
        redirectToUrl: TRANSACTION_SHIELD_LINK,
        marketingUtmParams,
      });

      window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener,noreferrer');
    } catch (error) {
      log.error('[handleOnLearnMoreClick] error', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal
      data-testid="shield-entry-modal"
      isOpen
      autoFocus={false}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      onClose={() => {
        if (actionLoading) {
          return;
        }

        setActionLoading(true);
        handleOnClose();
      }}
      data-theme={ThemeType.dark}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          className: 'relative overflow-hidden bg-accent03-dark py-0',
        }}
        size={ModalContentSize.Md}
      >
        <ModalHeader
          onClose={() => {
            if (actionLoading) {
              return;
            }

            setActionLoading(true);
            handleOnClose();
          }}
          closeButtonProps={{
            'data-testid': 'shield-entry-modal-close-button',
            ariaLabel: t('close'),
          }}
          className="absolute top-4 left-0 right-0 w-full"
        />
        <ModalBody className="overflow-y-auto py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MarketingMoment
            className="pt-4"
            title={
              modalType === MODAL_TYPE.A
                ? t('shieldEntryModalTitleA')
                : t('shieldEntryModalTitleB')
            }
            titleProps={{ className: 'text-accent04-light' }}
            description={
              modalType === MODAL_TYPE.A
                ? t('shieldEntryModalSubtitleA', ['$10,000'])
                : t('shieldEntryModalSubtitleB', ['$10,000'])
            }
            descriptionProps={{
              className: 'text-accent04-light',
            }}
            artworkWrapperProps={{
              justifyContent: BoxJustifyContent.End,
              className: 'min-h-0 min-w-0 w-full',
            }}
            artwork={
              <ShieldIllustrationAnimation
                containerClassName="aspect-[346/252] h-auto max-h-[252px] w-full min-w-0"
                canvasClassName="h-full w-full"
              />
            }
            primaryAction={
              {
                label: t('shieldEntryModalGetStarted'),
                onClick: handleOnGetStarted,
                isDisabled: actionLoading,
                'data-testid': 'shield-entry-modal-get-started-button',
              } as MarketingMomentAction
            }
            secondaryAction={
              {
                label: t('learnMoreUpperCase'),
                onClick: handleOnLearnMoreClick,
                isDisabled: actionLoading,
                'data-testid': 'shield-entry-modal-learn-more-button',
              } as MarketingMomentAction
            }
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShieldEntryModal;

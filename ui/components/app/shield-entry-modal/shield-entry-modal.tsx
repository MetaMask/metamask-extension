import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import {
  COHORT_NAMES,
  MODAL_TYPE,
  ModalType,
  SubscriptionUserEvent,
} from '@metamask/subscription-controller';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontFamily,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalFooter,
  ModalBody,
} from '../../component-library';
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
  EntryModalSourceEnum,
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
} from '../../../../shared/constants/subscriptions';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { TRANSACTION_SHIELD_LINK } from '../../../helpers/constants/common';
import { ThemeType } from '../../../../shared/constants/preferences';

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

  const getMarketingUtmId = useCallback(() => {
    const searchParams = new URLSearchParams(search);
    const utmId = searchParams.get('utm_id');
    if (utmId) {
      return utmId;
    }
    return undefined;
  }, [search]);

  const determineEntryModalSource = useCallback((): EntryModalSourceEnum => {
    const marketingUtmId = getMarketingUtmId();
    if (marketingUtmId) {
      return EntryModalSourceEnum.Marketing;
    } else if (triggeringCohort === COHORT_NAMES.POST_TX) {
      return EntryModalSourceEnum.PostTransaction;
    } else if (triggeringCohort === COHORT_NAMES.WALLET_HOME) {
      return EntryModalSourceEnum.Homepage;
    } else if (pathname.startsWith(SETTINGS_ROUTE)) {
      return EntryModalSourceEnum.Settings;
    }

    // TODO: Add logics for other entry modal sources, Carousel and Notification.

    return EntryModalSourceEnum.Homepage;
  }, [triggeringCohort, pathname, getMarketingUtmId]);

  const handleOnClose = (
    ctaActionClicked: ShieldCtaActionClickedEnum = ShieldCtaActionClickedEnum.Dismiss,
  ) => {
    const source = determineEntryModalSource();
    const marketingUtmId = getMarketingUtmId();
    captureShieldEntryModalEvent({
      source,
      type: modalType,
      modalCtaActionClicked: ctaActionClicked,
      marketingUtmId,
    });

    if (ctaActionClicked === ShieldCtaActionClickedEnum.Dismiss) {
      captureShieldCtaClickedEvent({
        source: ShieldCtaSourceEnum.Homepage, // FIXME: get the correct source
        ctaActionClicked: ShieldCtaActionClickedEnum.Dismiss,
        marketingUtmId,
      });
    }

    if (skipEventSubmission) {
      onClose?.();
      return;
    } else if (shouldSubmitEvent) {
      dispatch(
        submitSubscriptionUserEvents({
          event: SubscriptionUserEvent.ShieldEntryModalViewed,
          cohort: triggeringCohort,
        }),
      );
    }

    dispatch(setShowShieldEntryModalOnce(false));
  };

  const handleOnGetStarted = () => {
    const source = determineEntryModalSource();
    const marketingUtmId = getMarketingUtmId();

    captureShieldCtaClickedEvent({
      // ShieldCtaSourceEnum & EntryModalSourceEnum are the same enum, so we can cast it to ShieldCtaSourceEnum
      source: source as unknown as ShieldCtaSourceEnum,
      ctaActionClicked: ShieldCtaActionClickedEnum.Start14DayTrial,
      redirectToPage: SHIELD_PLAN_ROUTE,
      marketingUtmId,
    });

    handleOnClose(ShieldCtaActionClickedEnum.Start14DayTrial);

    navigate({
      pathname: SHIELD_PLAN_ROUTE,
      search: marketingUtmId
        ? `?utm_id=${marketingUtmId}`
        : `?source=${source}`,
    });
  };

  const handleOnLearnMoreClick = () => {
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Homepage, // FIXME: get the correct source
      ctaActionClicked: ShieldCtaActionClickedEnum.LearnMore,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });

    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      data-testid="shield-entry-modal"
      isOpen
      autoFocus={false}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      onClose={handleOnClose}
      className="shield-entry-modal"
      data-theme={ThemeType.dark}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          className: 'shield-entry-modal__dialog',
        }}
        className="shield-entry-modal__content"
      >
        <ModalHeader
          onClose={handleOnClose}
          closeButtonProps={{
            'data-testid': 'shield-entry-modal-close-button',
            className: 'absolute top-2 right-2',
          }}
        />
        <ModalBody
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          gap={3}
          paddingTop={4}
          height={BlockSize.Full}
        >
          <Text
            fontFamily={FontFamily.Hero}
            fontWeight={FontWeight.Regular}
            className="shield-entry-modal__title text-center text-accent04-light"
          >
            {modalType === MODAL_TYPE.A
              ? t('shieldEntryModalTitleA')
              : t('shieldEntryModalTitleB')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="text-center"
          >
            {modalType === MODAL_TYPE.A
              ? t('shieldEntryModalSubtitleA', ['$10,000'])
              : t('shieldEntryModalSubtitleB', ['$10,000'])}
          </Text>
          <Box className="shield-entry-modal-sheild-image flex-1 flex items-center justify-center">
            <img
              src="/images/transaction-shield-modal.png"
              alt="Shield Entry Illustration"
              className="mx-auto h-full w-full object-contain"
            />
          </Box>
        </ModalBody>
        <ModalFooter
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          className="shield-entry-modal__footer"
        >
          <Button
            data-testid="shield-entry-modal-get-started-button"
            size={ButtonSize.Lg}
            onClick={handleOnGetStarted}
            className="w-full mb-2"
          >
            {t('shieldEntryModalGetStarted')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            className="w-full mb-2"
            size={ButtonSize.Lg}
            onClick={handleOnLearnMoreClick}
          >
            {t('learnMoreUpperCase')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShieldEntryModal;

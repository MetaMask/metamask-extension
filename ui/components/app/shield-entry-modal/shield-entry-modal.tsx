import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
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
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
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
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { TRANSACTION_SHIELD_LINK } from '../../../helpers/constants/common';
import { ThemeType } from '../../../../shared/constants/preferences';
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
  const { captureShieldEntryModalEvent, captureShieldCtaClickedEvent } =
    useSubscriptionMetrics();
  const shouldSubmitEvent = useSelector(
    getShouldSubmitEventsForShieldEntryModal,
  );
  const modalType: ModalType = useSelector(getModalTypeForShieldEntryModal);
  const triggeringCohort = useSelector(getShieldEntryModalTriggeringCohort);

  const handleOnClose = (
    ctaActionClicked: ShieldCtaActionClickedEnum = ShieldCtaActionClickedEnum.Dismiss,
  ) => {
    captureShieldEntryModalEvent({
      source: EntryModalSourceEnum.Homepage,
      type: modalType,
      modalCtaActionClicked: ctaActionClicked,
    });

    if (ctaActionClicked === ShieldCtaActionClickedEnum.Dismiss) {
      captureShieldCtaClickedEvent({
        source: ShieldCtaSourceEnum.Homepage, // FIXME: get the correct source
        ctaActionClicked: ShieldCtaActionClickedEnum.Dismiss,
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
    handleOnClose(ShieldCtaActionClickedEnum.Start14DayTrial);

    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Homepage, // FIXME: get the correct source
      ctaActionClicked: ShieldCtaActionClickedEnum.Start14DayTrial,
      redirectToPage: SHIELD_PLAN_ROUTE,
    });

    navigate(SHIELD_PLAN_ROUTE);
  };

  const handleOnLearnMoreClick = () => {
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Homepage, // FIXME: get the correct source
      ctaActionClicked: ShieldCtaActionClickedEnum.LearnMore,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });

    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener noreferrer');
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
          <Box className="grid place-items-center">
            <img
              src="/images/shield-entry-modal-bg.png"
              alt="Shield Entry Illustration"
              className="col-start-1 row-start-1"
            />
            <ShieldIllustrationAnimation
              containerClassName="shield-entry-modal-shield-illustration__container col-start-1 row-start-1"
              canvasClassName="shield-entry-modal-shield-illustration__canvas"
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
          <Button asChild variant={ButtonVariant.Secondary} className="w-full">
            <a
              onClick={handleOnLearnMoreClick}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMoreUpperCase')}
            </a>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShieldEntryModal;

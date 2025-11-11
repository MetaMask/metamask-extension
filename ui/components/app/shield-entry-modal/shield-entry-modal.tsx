import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { SubscriptionUserEvent } from '@metamask/subscription-controller';
import {
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
  getModalTypeForShieldEntryModal,
  getShouldSubmitEventsForShieldEntryModal,
} from '../../../selectors';
import {
  AlignItems,
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
  const shouldSubmitEvent = useSelector(
    getShouldSubmitEventsForShieldEntryModal,
  );
  const modalType = useSelector(getModalTypeForShieldEntryModal);

  const handleOnClose = () => {
    if (skipEventSubmission) {
      onClose?.();
      return;
    }
    if (shouldSubmitEvent) {
      dispatch(
        submitSubscriptionUserEvents({
          event: SubscriptionUserEvent.ShieldEntryModalViewed,
        }),
      );
    }
    dispatch(setShowShieldEntryModalOnce(false));
  };

  const handleOnGetStarted = () => {
    handleOnClose();
    navigate(SHIELD_PLAN_ROUTE);
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
            {modalType === 'A'
              ? t('shieldEntryModalTitleA')
              : t('shieldEntryModalTitleB')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="text-center"
          >
            {modalType === 'A'
              ? t('shieldEntryModalSubtitleA', ['$10,000'])
              : t('shieldEntryModalSubtitleB', ['$10,000'])}
          </Text>
          <img
            src="/images/shield-entry-modal.png"
            alt="Shield Entry Illustration"
          />
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
              href={TRANSACTION_SHIELD_LINK}
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

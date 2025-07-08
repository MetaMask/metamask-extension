import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from '@sentry/browser';
import browser from 'webextension-polyfill';

import { getParticipateInMetaMetrics } from '../../selectors';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  BannerAlert,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
  Button,
  ButtonVariant,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';

import { Textarea } from '../../components/component-library/textarea/textarea';
import { TextareaResize } from '../../components/component-library/textarea/textarea.types';
import { ButtonSize } from '../../components/component-library/button/button.types';
import VisitSupportDataConsentModal from '../../components/app/modals/visit-support-data-consent-modal';
import { getShowSupportDataConsentModal } from '../../ducks/app/app';
import { setShowSupportDataConsentModal } from '../../store/actions';

type ErrorPageProps = {
  error: {
    message?: string;
    code?: string;
    name?: string;
    stack?: string;
  };
};

const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const showSupportDataConsentModal = useSelector(
    getShowSupportDataConsentModal,
  );

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);

  const handleClickDescribeButton = (): void => {
    setIsFeedbackModalOpen(true);
  };

  const handleCloseDescribeModal = (): void => {
    setIsFeedbackModalOpen(false);
  };

  const handleSubmitFeedback = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const eventId = Sentry.lastEventId();

    Sentry.captureFeedback({
      message: feedbackMessage,
      associatedEventId: eventId,
    });
    handleCloseDescribeModal();
    setIsSuccessModalShown(true);
  };

  useEffect(() => {
    if (isSuccessModalShown) {
      const timeoutId = setTimeout(() => {
        setIsSuccessModalShown(false); // Close the modal after 5 seconds
      }, 5000);

      // Cleanup function to clear timeout if the component unmounts or state changes
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isSuccessModalShown]);

  return (
    <section className="error-page">
      <section className="error-page__inner-wrapper">
        <Box
          className="error-page__header"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
        >
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.warningDefault}
          />
          <Text
            color={TextColor.inherit}
            variant={TextVariant.headingMd}
            marginBottom={4}
          >
            {t('errorPageTitle')}
          </Text>
        </Box>
        <div className="error-page__banner-wrapper">
          <BannerAlert
            childrenWrapperProps={{ color: TextColor.inherit }}
            marginBottom={4}
          >
            {t('errorPageInfo')}
          </BannerAlert>
        </div>
        <Text color={TextColor.inherit} variant={TextVariant.bodyMd}>
          {t('errorPageMessageTitle')}
        </Text>
        <Box
          borderRadius={BorderRadius.LG}
          marginBottom={2}
          marginTop={2}
          backgroundColor={BackgroundColor.errorMuted}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          padding={2}
          className="error-page__error-message-wrapper"
        >
          {error.message ? (
            <Text
              variant={TextVariant.bodyXs}
              marginBottom={2}
              data-testid="error-page-error-message"
              color={TextColor.inherit}
            >
              {t('errorMessage', [error.message])}
            </Text>
          ) : null}
          {error.code ? (
            <Text
              variant={TextVariant.bodyXs}
              marginBottom={2}
              data-testid="error-page-error-code"
              color={TextColor.inherit}
            >
              {t('errorCode', [error.code])}
            </Text>
          ) : null}
          {error.name ? (
            <Text
              variant={TextVariant.bodyXs}
              marginBottom={2}
              data-testid="error-page-error-name"
              color={TextColor.inherit}
            >
              {t('errorName', [error.name])}
            </Text>
          ) : null}
          {error.stack ? (
            <>
              <Text
                color={TextColor.inherit}
                variant={TextVariant.bodyXs}
                marginBottom={2}
              >
                {t('errorStack')}
              </Text>
              <pre
                className="error-page__stack"
                data-testid="error-page-error-stack"
              >
                {error.stack}
              </pre>
            </>
          ) : null}
        </Box>
        {isFeedbackModalOpen && (
          <Modal
            isOpen={isFeedbackModalOpen}
            onClose={handleCloseDescribeModal}
            data-testid="error-page-sentry-feedback-modal"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader onClose={handleCloseDescribeModal}>
                {t('errorPageSentryFormTitle')}
              </ModalHeader>
              <ModalBody>
                <Textarea
                  resize={TextareaResize.Vertical}
                  required
                  autoFocus
                  cols={32}
                  rows={6}
                  placeholder={t('errorPageSentryMessagePlaceholder')}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  data-testid="error-page-sentry-feedback-textarea"
                />
              </ModalBody>
              <ModalFooter>
                <Box display={Display.Flex} gap={4}>
                  <Button
                    variant={ButtonVariant.Secondary}
                    width={BlockSize.Half}
                    onClick={handleCloseDescribeModal}
                    size={ButtonSize.Md}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant={ButtonVariant.Primary}
                    width={BlockSize.Half}
                    onClick={handleSubmitFeedback}
                    size={ButtonSize.Md}
                    data-testid="error-page-sentry-feedback-submit-button"
                  >
                    {t('submit')}
                  </Button>
                </Box>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
        {isSuccessModalShown && (
          <Modal
            isOpen={isSuccessModalShown}
            onClose={() => setIsSuccessModalShown(false)}
            data-testid="error-page-sentry-feedback-success-modal"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalBody
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                gap={4}
              >
                <Icon
                  name={IconName.CheckBold}
                  color={IconColor.successDefault}
                  size={IconSize.Md}
                  marginRight={2}
                />
                <Text
                  variant={TextVariant.bodyMdMedium}
                  color={TextColor.successDefault}
                >
                  {t('errorPageSentrySuccessMessageText')}
                </Text>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
        (
        <VisitSupportDataConsentModal
          isOpen={showSupportDataConsentModal}
          onClose={() => dispatch(setShowSupportDataConsentModal(false))}
        />
        )
        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          marginTop={4}
        >
          {isMetaMetricsEnabled && (
            <Button
              className="error-page__report-to-sentry-button"
              marginBottom={2}
              block
              data-testid="error-page-describe-what-happened-button"
              onClick={handleClickDescribeButton}
            >
              {t('errorPageDescribeUsWhatHappened')}
            </Button>
          )}
          <Button
            marginBottom={2}
            variant={ButtonVariant.Secondary}
            block
            data-testid="error-page-contact-support-button"
            onClick={() => dispatch(setShowSupportDataConsentModal(true))}
          >
            {t('errorPageContactSupport')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            block
            data-testid="error-page-try-again-button"
            // TODO: should this be a safe reload via the `WriteManager`?
            onClick={() => browser.runtime.reload()}
          >
            {t('errorPageTryAgain')}
          </Button>
        </Box>
      </section>
    </section>
  );
};

export default ErrorPage;

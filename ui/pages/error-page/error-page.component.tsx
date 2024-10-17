import React, { useEffect, useContext, useRef } from 'react';
import * as Sentry from '@sentry/browser';
import browser from 'webextension-polyfill';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

import { MetaMetricsContext } from '../../contexts/metametrics';
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
  TextVariant,
} from '../../helpers/constants/design-system';

import { SUPPORT_REQUEST_LINK } from '../../helpers/constants/common';

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
  const trackEvent = useContext(MetaMetricsContext);
  const sentryButtonRef = useRef(null);

  useEffect(() => {
    // Initialize the Sentry feedback integration widget
    const feedback = Sentry.feedbackIntegration({
      enableScreenshot: false,
      autoInject: false,
      showBranding: false,
      showName: false,
      showEmail: false,
      triggerLabel: t('errorPageSentryTriggerLabel'),
      formTitle: t('errorPageSentryFormTitle'),
      submitButtonLabel: t('errorPageSentrySubmitButtonLabel'),
      cancelButtonLabel: t('errorPageSentryCancelButtonLabel'),
      confirmButtonLabel: t('errorPageSentryConfirmButtonLabel'),
      isRequiredLabel: t('errorPageSentryIsRequiredLabel'),
      messageLabel: t('errorPageSentryMessageLabel'),
      messagePlaceholder: t('errorPageSentryMessagePlaceholder'),
      errorPageSuccessMessageText: t('errorPageSentrySuccessMessageText'),
    });

    let isMounted = true; // For preventing memory leak

    if (sentryButtonRef.current && isMounted) {
      feedback.attachTo(sentryButtonRef.current); // Attach feedback widget to button
    }

    return () => {
      isMounted = false; // Prevents async operations on unmounted component
      if (feedback) {
        feedback.remove(); // Clean up feedback widget
      }
    };
  }, [sentryButtonRef, t]);

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
          <Text variant={TextVariant.headingMd} marginBottom={4}>
            {t('errorPageTitle')}
          </Text>
        </Box>

        <div className="error-page__banner-wrapper">
          <BannerAlert marginBottom={4}>{t('errorPageInfo')}</BannerAlert>
        </div>

        <Text variant={TextVariant.bodyMd}>{t('errorPageMessageTitle')}</Text>

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
            >
              {t('errorMessage', [error.message])}
            </Text>
          ) : null}
          {error.code ? (
            <Text
              variant={TextVariant.bodyXs}
              marginBottom={2}
              data-testid="error-page-error-code"
            >
              {t('errorCode', [error.code])}
            </Text>
          ) : null}
          {error.name ? (
            <Text
              variant={TextVariant.bodyXs}
              marginBottom={2}
              data-testid="error-page-error-name"
            >
              {t('errorName', [error.name])}
            </Text>
          ) : null}
          {error.stack ? (
            <>
              <Text variant={TextVariant.bodyXs} marginBottom={2}>
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

        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          marginTop={4}
        >
          <Button
            ref={sentryButtonRef}
            className="error-page__report-to-sentry-button"
            marginBottom={2}
            block
            data-testid="error-page-describe-what-happened-button"
          >
            {t('errorPageDescribeUsWhatHappened')}
          </Button>
          <Button
            marginBottom={2}
            variant={ButtonVariant.Secondary}
            block
            data-testid="error-page-contact-support-button"
            onClick={() => {
              window.open(SUPPORT_REQUEST_LINK, '_blank');
              trackEvent(
                {
                  category: MetaMetricsEventCategory.Error,
                  event: MetaMetricsEventName.SupportLinkClicked,
                  properties: {
                    url: SUPPORT_REQUEST_LINK,
                  },
                },
                {
                  contextPropsIntoEventProperties: [
                    MetaMetricsContextProp.PageTitle,
                  ],
                },
              );
            }}
          >
            {t('errorPageContactSupport')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            block
            data-testid="error-page-try-again-button"
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

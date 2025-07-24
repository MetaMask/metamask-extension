import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  TextVariant,
  Display,
  AlignItems,
  FlexDirection,
  TextColor,
  IconColor,
  JustifyContent,
  BackgroundColor,
  BorderRadius,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  BannerAlert,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getOnboardingErrorReport } from '../../../selectors';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { setOnboardingErrorReport } from '../../../store/actions';
// eslint-disable-next-line import/no-restricted-paths
import setupSentry from '../../../../app/scripts/lib/setupSentry';
import { captureException } from '../../../../shared/lib/sentry';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingError() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const [copied, handleCopy] = useCopyToClipboard();
  const onboardingErrorReport = useSelector(getOnboardingErrorReport);

  useEffect(() => {
    if (onboardingErrorReport === null) {
      history.push(ONBOARDING_WELCOME_ROUTE);
    }
  }, [history, onboardingErrorReport]);

  const clearReport = useCallback(() => {
    dispatch(setOnboardingErrorReport(null));
    history.push(ONBOARDING_WELCOME_ROUTE);
  }, [dispatch, history]);

  const onSendReport = useCallback(() => {
    if (!onboardingErrorReport) {
      return;
    }
    try {
      setupSentry(true);
      const { error, view = 'Unknown' } = onboardingErrorReport || {};
      captureException(error, {
        extra: {
          view,
          context: 'OnboardingError forced report',
        },
      });
    } catch (sentryError) {
      console.error('Failed to force report error to Sentry:', sentryError);
    } finally {
      setupSentry(false);
      clearReport();
    }
  }, [clearReport, onboardingErrorReport]);

  return (
    <Box
      className="onboarding-error"
      data-testid="onboarding-error"
      marginTop={7}
      marginInline="auto"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        marginBottom={4}
        gap={2}
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Xl}
          color={IconColor.warningDefault}
        />
        <Text variant={TextVariant.headingMd}>{t('sentryErrorTitle')}</Text>
      </Box>

      <BannerAlert
        childrenWrapperProps={{ color: TextColor.inherit }}
        marginBottom={4}
      >
        {t('sentryErrorNote')}
      </BannerAlert>

      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={2}
      >
        <Text>{t('sentryErrorReport')}</Text>
        <Button
          onClick={() => {
            handleCopy(onboardingErrorReport?.error.stack || '');
          }}
          startIconName={copied ? IconName.CopySuccess : IconName.Copy}
          variant={ButtonVariant.Link}
        >
          {copied ? t('copied') : t('copy')}
        </Button>
      </Box>

      <Box
        borderRadius={BorderRadius.LG}
        marginBottom={4}
        backgroundColor={BackgroundColor.errorMuted}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={4}
        paddingBottom={4}
        paddingInline={5}
        color={TextColor.errorDefault}
      >
        <Text
          variant={TextVariant.bodyXs}
          data-testid="error-page-error-message"
          color={TextColor.inherit}
        >
          {t('sentryErrorView', [onboardingErrorReport?.view || ''])}
        </Text>
        <Text
          variant={TextVariant.bodyXs}
          data-testid="error-page-error-message"
          color={TextColor.inherit}
        >
          {t('sentryErrorError', [onboardingErrorReport?.error?.message || ''])}
        </Text>
        <pre className="onboarding-error__stack">
          {onboardingErrorReport?.error?.stack || ''}
        </pre>
      </Box>

      <Box display={Display.Flex} width={BlockSize.Full} gap={4}>
        <Button
          block
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          onClick={clearReport}
        >
          {t('tryAgain')}
        </Button>
        <Button
          block
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          onClick={onSendReport}
        >
          {t('sendReport')}
        </Button>
      </Box>
    </Box>
  );
}

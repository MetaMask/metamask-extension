import React, { useCallback, useEffect } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { ONBOARDED_IN_THIS_UI_SESSION } from '../../../store/actionConstants';
import { useHistory } from 'react-router-dom';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { setOnboardingErrorReport } from '../../../store/actions';

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
      history.push(ONBOARDED_IN_THIS_UI_SESSION);
    }
  }, [history, onboardingErrorReport]);

  const onTryAgain = useCallback(() => {
    dispatch(setOnboardingErrorReport(null));
    history.push(ONBOARDING_WELCOME_ROUTE);
  }, [dispatch, history]);

  // TODO: Implement this
  const onSendReport = useCallback(() => {
    console.log('onSendReport');
  }, []);

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
            handleCopy(onboardingErrorReport?.stack || '');
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
          {t('sentryErrorView', ['Root'])}
        </Text>
        <Text
          variant={TextVariant.bodyXs}
          data-testid="error-page-error-message"
          color={TextColor.inherit}
        >
          {t('sentryErrorError', [onboardingErrorReport?.message || ''])}
        </Text>
        <pre className="onboarding-error__stack">
          {onboardingErrorReport?.stack || ''}
        </pre>
      </Box>

      <Box display={Display.Flex} width={BlockSize.Full} gap={4}>
        <Button
          block
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          onClick={onTryAgain}
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

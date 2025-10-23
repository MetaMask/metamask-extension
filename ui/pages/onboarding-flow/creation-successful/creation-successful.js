import React, { useCallback, useMemo, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
import { capitalize } from 'lodash';
///: BEGIN:ONLY_INCLUDE_IF(build-experimental)
import browser from 'webextension-polyfill';
///: END:ONLY_INCLUDE_IF
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import {
  TextVariant,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
  BorderRadius,
  BlockSize,
  FontWeight,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  IconName,
  IconSize,
  Icon,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  DEFAULT_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getSocialLoginType,
  getExternalServicesOnboardingToggleState,
  getFirstTimeFlowType,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import {
  toggleExternalServices,
  setCompletedOnboarding,
  ///: BEGIN:ONLY_INCLUDE_IF(build-experimental)
  setCompletedOnboardingWithSidepanel,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';
///: BEGIN:ONLY_INCLUDE_IF(build-experimental)
import { getIsSidePanelFeatureEnabled } from '../../../../shared/modules/environment';
///: END:ONLY_INCLUDE_IF

export default function CreationSuccessful() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { search } = useLocation();
  const isWalletReady = useSelector(getIsPrimarySeedPhraseBackedUp);
  const userSocialLoginType = useSelector(getSocialLoginType);
  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const learnMoreLink =
    'https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask/';

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');

  const renderTitle = useMemo(() => {
    if (isWalletReady) {
      return isFromReminder
        ? t('yourWalletIsReadyFromReminder')
        : t('yourWalletIsReady');
    }

    return t('yourWalletIsReadyRemind');
  }, [isFromReminder, isWalletReady, t]);

  const renderDetails1 = useMemo(() => {
    if (userSocialLoginType) {
      return t('walletReadySocialDetails1', [capitalize(userSocialLoginType)]);
    }

    if (isWalletReady) {
      return isFromReminder
        ? t('walletReadyLoseSrpFromReminder')
        : t('walletReadyLoseSrp');
    }

    return t('walletReadyLoseSrpRemind');
  }, [userSocialLoginType, isWalletReady, t, isFromReminder]);

  const renderDetails2 = useMemo(() => {
    if (userSocialLoginType) {
      return t('walletReadySocialDetails2');
    }

    if (isWalletReady || isFromReminder) {
      return t('walletReadyLearn', [
        <ButtonLink
          key="walletReadyLearn"
          size={ButtonLinkSize.Inherit}
          textProps={{
            variant: TextVariant.bodyMd,
            alignItems: AlignItems.flexStart,
          }}
          as="a"
          href={learnMoreLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('learnHow')}
        </ButtonLink>,
      ]);
    }

    return t('walletReadyLearnRemind');
  }, [userSocialLoginType, isWalletReady, isFromReminder, t]);

  const renderFox = useMemo(() => {
    if (isWalletReady || isFromReminder) {
      return (
        <LottieAnimation
          path="images/animations/fox/celebrating.lottie.json"
          loop
          autoplay
        />
      );
    }

    return (
      <LottieAnimation
        path="images/animations/fox/celebrating.lottie.json"
        loop
        autoplay
      />
    );
  }, [isWalletReady, isFromReminder]);

  const onDone = useCallback(async () => {
    if (isWalletReady) {
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.ExtensionPinned,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type:
            firstTimeFlowType === FirstTimeFlowType.import ? 'import' : 'new',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: firstTimeFlowType === FirstTimeFlowType.create,
        },
      });
    }

    if (isFromReminder) {
      navigate(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE);
      return;
    }

    await dispatch(
      toggleExternalServices(externalServicesOnboardingToggleState),
    );

    ///: BEGIN:ONLY_INCLUDE_IF(build-experimental)
    // Side Panel - only if feature flag is enabled
    if (getIsSidePanelFeatureEnabled()) {
      try {
        if (browser?.sidePanel?.open) {
          const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tabs && tabs.length > 0) {
            await browser.sidePanel.open({ windowId: tabs[0].windowId });
            // Use the sidepanel-specific action to avoid redirect in fullscreen
            await dispatch(setCompletedOnboardingWithSidepanel());
            // Don't navigate to DEFAULT_ROUTE when using sidepanel
            return;
          }
        }
        // Fallback to regular onboarding completion
        await dispatch(setCompletedOnboarding());
      } catch (error) {
        console.error('Error opening side panel:', error);
        await dispatch(setCompletedOnboarding());
      }
    } else {
      // Regular onboarding completion when sidepanel is disabled
      await dispatch(setCompletedOnboarding());
    }
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    // Regular onboarding completion for non-experimental builds
    await dispatch(setCompletedOnboarding());
    ///: END:ONLY_INCLUDE_IF

    navigate(DEFAULT_ROUTE);
  }, [
    isWalletReady,
    isFromReminder,
    dispatch,
    externalServicesOnboardingToggleState,
    navigate,
    trackEvent,
    firstTimeFlowType,
    isFromSettingsSecurity,
  ]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={6}
      className="creation-successful"
      data-testid="wallet-ready"
    >
      <Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
        >
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            justifyContent={JustifyContent.center}
            style={{
              alignSelf: AlignItems.flexStart,
            }}
            marginBottom={4}
          >
            {renderTitle}
          </Text>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            marginBottom={6}
          >
            <Box
              display={Display.Flex}
              style={{ width: '144px', height: '144px' }}
            >
              {renderFox}
            </Box>
          </Box>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {renderDetails1}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {renderDetails2}
          </Text>
        </Box>
        {!isFromReminder && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            className="creation-successful__settings-actions"
            gap={4}
          >
            <Button
              variant={ButtonVariant.Secondary}
              data-testid="manage-default-settings"
              borderRadius={BorderRadius.LG}
              width={BlockSize.Full}
              onClick={() => navigate(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
            >
              <Box display={Display.Flex} alignItems={AlignItems.center}>
                <Icon
                  name={IconName.Setting}
                  size={IconSize.Md}
                  marginInlineEnd={3}
                />
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('manageDefaultSettings')}
                </Text>
              </Box>
              <Icon
                name={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={IconSize.Sm}
              />
            </Button>
          </Box>
        )}
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onDone}
        >
          {t('done')}
        </Button>
      </Box>
    </Box>
  );
}

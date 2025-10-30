import React, { useCallback, useMemo, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
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
  TextAlign,
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
import WalletReadyAnimation from './wallet-ready-animation';

export default function CreationSuccessful() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { search } = useLocation();
  const isWalletReady = useSelector(getIsPrimarySeedPhraseBackedUp);
  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isTestEnvironment = Boolean(process.env.IN_TEST);

  const learnMoreLink =
    'https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask/';

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');
  const isFromSettingsSRPBackup = isWalletReady && isFromReminder;

  const renderDetails1 = useMemo(() => {
    if (isFromReminder) {
      return t('walletReadyLoseSrpFromReminder');
    }

    return t('walletReadyLoseSrp');
  }, [isFromReminder, t]);

  const renderFox = useMemo(() => {
    return (
      <LottieAnimation
        path="images/animations/fox/celebrating.lottie.json"
        loop
        autoplay
      />
    );
  }, []);

  const renderSettingsActions = useMemo(() => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        justifyContent={JustifyContent.flexStart}
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
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
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
    );
  }, [navigate, t]);

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
            // Use the sidepanel-specific action - no navigation needed, sidepanel is already open
            await dispatch(setCompletedOnboardingWithSidepanel());
            return;
          }
        }
      } catch (error) {
        console.error('Error opening side panel:', error);
        // Fall through to regular onboarding
      }
    }
    // Fallback to regular onboarding completion
    await dispatch(setCompletedOnboarding());
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

  const renderDoneButton = () => {
    return (
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
    );
  };

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
      {isFromSettingsSRPBackup && (
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
              {t('yourWalletIsReadyFromReminder')}
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
              {t('walletReadyLearn', [
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
              ])}
            </Text>
          </Box>
          {renderSettingsActions}
        </Box>
      )}
      {!isFromSettingsSRPBackup && !isTestEnvironment && (
        <WalletReadyAnimation />
      )}
      {!isFromSettingsSRPBackup && (
        <Text className="title">{t('yourWalletIsReady')}</Text>
      )}
      {renderDoneButton()}
      {!isFromSettingsSRPBackup && (
        <Box>
          <Button
            variant={ButtonVariant.Link}
            onClick={() => navigate(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
            textAlign={TextAlign.Center}
            width={BlockSize.Full}
            data-testid="manage-default-settings"
          >
            {t('manageDefaultSettings')}
          </Button>
        </Box>
      )}
    </Box>
  );
}

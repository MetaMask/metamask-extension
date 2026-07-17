import React, { useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  IconColor,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  TextButton,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  DEFAULT_ROUTE,
  SECURITY_AND_PASSWORD_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsInitialized,
  getIsPrimarySeedPhraseBackedUp,
  getIsWalletResetInProgress,
} from '../../../ducks/metamask/metamask';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import type { BrowserWithSidePanel } from '../../../../shared/types';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useOnboardingSearchParams } from '../hooks/useOnboardingSearchParams';
import { useOnboardingCompletion } from '../hooks/useOnboardingCompletion';
import WalletReadyAnimation from './wallet-ready-animation';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function CreationSuccessful() {
  const navigate = useNavigate();
  const t = useI18nContext();
  const isWalletReady = useSelector(getIsPrimarySeedPhraseBackedUp);
  const isSidePanelEnabled = useSidePanelEnabled();
  const isInitialized = useSelector(getIsInitialized);
  const isResetWalletInProgress = useSelector(getIsWalletResetInProgress);
  const {
    completeOnboarding: completeOnboardingFromCompletionPage,
    markCompletionPageSeen,
    isSidePanelOpen,
    setIsSidePanelOpen,
  } = useOnboardingCompletion();

  const learnMoreLink = ZENDESK_URLS.BASIC_SAFETY_TIPS;

  const { isFromReminder, isFromSettingsSecurity } =
    useOnboardingSearchParams();
  const isFromSettingsSRPBackup = isWalletReady && isFromReminder;

  // Guard: redirect if wallet is not properly set up.
  // Prevents users from skipping onboarding steps by navigating directly to the completion route.
  useEffect(() => {
    if (isFromReminder) {
      return;
    }
    if (!isInitialized || isResetWalletInProgress) {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [isInitialized, isFromReminder, navigate, isResetWalletInProgress]);

  useEffect(() => {
    if (isFromReminder || isResetWalletInProgress || !isInitialized) {
      return;
    }

    markCompletionPageSeen();
  }, [
    isFromReminder,
    isInitialized,
    isResetWalletInProgress,
    markCompletionPageSeen,
  ]);

  useEffect(() => {
    const browserWithSidePanel = browser as BrowserWithSidePanel;
    const handleSidePanelClosed = (_args: unknown) => {
      setIsSidePanelOpen(false);
    };

    if (isSidePanelEnabled) {
      // NOTE: `sidePanel.onClosed` event is only available on later versions of Chrome
      // REFERENCE: {@link https://developer.chrome.com/docs/extensions/reference/api/sidePanel#event-onClosed}
      if (browserWithSidePanel?.sidePanel?.onClosed?.addListener) {
        browserWithSidePanel.sidePanel.onClosed.addListener(
          handleSidePanelClosed,
        );
      } else {
        console.warn('`sidePanel.onClosed` event is not available');
        // If the event is not available, we set the state to false to prevent the button from being disabled
        setIsSidePanelOpen(false);
      }
    }

    return () => {
      if (browserWithSidePanel?.sidePanel?.onClosed?.removeListener) {
        browserWithSidePanel.sidePanel.onClosed.removeListener(
          handleSidePanelClosed,
        );
      }
    };
  }, [isSidePanelEnabled, setIsSidePanelOpen]);

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
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Start}
        className="creation-successful__settings-actions"
        gap={4}
      >
        <Button
          variant={ButtonVariant.Secondary}
          data-testid="manage-default-settings"
          className="rounded-lg w-full flex justify-between items-center"
          onClick={() =>
            navigate(`${ONBOARDING_PRIVACY_SETTINGS_ROUTE}?isFromReminder=true`)
          }
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
          >
            <Icon name={IconName.Setting} size={IconSize.Md} className="mr-3" />
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('manageDefaultSettings')}
            </Text>
          </Box>
          <Icon
            name={IconName.ArrowRight}
            color={IconColor.IconAlternative}
            size={IconSize.Sm}
          />
        </Button>
      </Box>
    );
  }, [navigate, t]);

  const onDone = useCallback(async () => {
    if (isFromReminder) {
      navigate(
        isFromSettingsSecurity ? SECURITY_AND_PASSWORD_ROUTE : DEFAULT_ROUTE,
      );
      return;
    }

    if (isResetWalletInProgress) {
      // if the wallet reset is in progress, we navigate to the default route (i.e. onboarding start page)
      navigate(DEFAULT_ROUTE);
      return;
    }

    await completeOnboardingFromCompletionPage();
  }, [
    completeOnboardingFromCompletionPage,
    isFromReminder,
    isFromSettingsSecurity,
    isResetWalletInProgress,
    navigate,
  ]);

  const renderDoneButton = () => {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onDone}
          disabled={isSidePanelEnabled && isSidePanelOpen}
        >
          {isSidePanelEnabled ? t('openWallet') : t('done')}
        </Button>
      </Box>
    );
  };

  const handleLearnMoreClick = () => {
    global.platform.openTab({
      url: learnMoreLink,
    });
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={6}
      className="creation-successful h-full"
      data-testid="wallet-ready"
    >
      {isFromSettingsSRPBackup && (
        <Box>
          <Box
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Start}
          >
            <Text
              variant={TextVariant.HeadingLg}
              className="self-start mb-4 flex justify-center"
            >
              {t('yourWalletIsReadyFromReminder')}
            </Text>
            <Box className="w-full mb-6">
              <Box className="w-36 h-36 mx-auto">{renderFox}</Box>
            </Box>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mb-6"
            >
              {renderDetails1}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mb-6"
            >
              {t('walletReadyLearn', [
                <TextButton
                  key="walletReadyLearn"
                  className="hover:bg-transparent active:bg-transparent w-fit"
                  onClick={handleLearnMoreClick}
                >
                  {t('learnHow')}
                </TextButton>,
              ])}
            </Text>
          </Box>
          {renderSettingsActions}
        </Box>
      )}
      {!isFromSettingsSRPBackup && <WalletReadyAnimation />}
      {!isFromSettingsSRPBackup && (
        <Text className="title">{t('yourWalletIsReady')}</Text>
      )}
      {renderDoneButton()}
      {!isFromSettingsSRPBackup && (
        <Box>
          <TextButton
            onClick={() => navigate(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
            className="hover:bg-transparent active:bg-transparent w-full text-center"
            data-testid="manage-default-settings"
          >
            {t('manageDefaultSettings')}
          </TextButton>
        </Box>
      )}
    </Box>
  );
}

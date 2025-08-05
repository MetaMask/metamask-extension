import React, { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
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
  ONBOARDING_PIN_EXTENSION_ROUTE,
  DEFAULT_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import { getSocialLoginType } from '../../../selectors';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';

import { LottieAnimation } from '../../../components/component-library/lottie-animation';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const { search } = useLocation();
  const isWalletReady = useSelector(getIsPrimarySeedPhraseBackedUp);
  const userSocialLoginType = useSelector(getSocialLoginType);
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

  const onDone = useCallback(() => {
    if (isFromReminder) {
      history.push(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE);
      return;
    }
    history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
  }, [history, isFromReminder, isFromSettingsSecurity]);

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
              onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
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

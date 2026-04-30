import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { capitalize } from 'lodash';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  IconColor,
  FontWeight,
  TextTransform,
} from '@metamask/design-system-react';
import { SrpList } from '../../../../components/multichain/multi-srp/srp-list/srp-list';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  getIsSocialLoginFlow,
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../../selectors';
import Card from '../../../../components/ui/card';
import { useSyncSRPs } from '../../../../hooks/social-sync/useSyncSRPs';

export const RevealSrpList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);
  const socialLoginEmail = useSelector(getSocialLoginEmail);

  // sync SRPs list when page loads
  useSyncSRPs();

  const onSrpActionComplete = (keyringId: string, triggerBackup?: boolean) => {
    if (triggerBackup) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&isFromSettingsSecurity=true`;
      navigate(backUpSRPRoute);
    } else {
      navigate(`${REVEAL_SEED_ROUTE}/${keyringId}`);
    }
  };

  const maskHostNameFromEmail = (email: string) => {
    const [hostname, domain] = email.split('@');
    const initialPart = hostname.slice(0, 1);
    const maskedHostname = `${initialPart}${'*'.repeat(
      hostname.length - initialPart.length,
    )}`;
    return `${maskedHostname}@${domain}`;
  };

  const getSocialLoginIcon = (type: AuthConnection) => {
    switch (type) {
      case AuthConnection.Apple:
        return (
          <Icon
            name={IconName.AppleLogo}
            color={IconColor.IconDefault}
            size={IconSize.Lg}
          />
        );
      case AuthConnection.Google:
        return (
          <img
            src="images/icons/google.svg"
            alt="Google icon"
            width={24}
            height={24}
          />
        );
      default:
        return (
          <img
            src="images/icons/telegram.svg"
            alt="Telegram icon"
            width={24}
            height={24}
          />
        );
    }
  };

  return (
    <Box className="srp-reveal-list">
      {isSocialLoginFlow && (
        <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textTransform={TextTransform.Uppercase}
            className="mb-2"
          >
            {t('securitySocialLoginLabel', [socialLoginType])}
          </Text>
          <Card
            className="srp-reveal-list__social-login-card"
            backgroundColor={BackgroundColor.backgroundMuted}
            border={false}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
              >
                {getSocialLoginIcon(socialLoginType as AuthConnection)}
              </Box>
              <Box flexDirection={BoxFlexDirection.Column}>
                <Text fontWeight={FontWeight.Medium}>
                  {t('securitySocialLoginEnabled')}
                </Text>
                {socialLoginEmail && (
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {maskHostNameFromEmail(socialLoginEmail)}
                  </Text>
                )}
              </Box>
            </Box>
          </Card>
          <Text
            className="mt-1"
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
          >
            {t('securitySocialLoginEnabledDescription', [
              capitalize(socialLoginType),
            ])}
          </Text>
          <Box className="srp-reveal-list__divider w-full" marginTop={4} />
        </Box>
      )}
      <Box
        paddingTop={4}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={0}
        className="srp-reveal-list__srp-list"
        data-testid="select-srp-container"
      >
        <Text
          className="mb-2"
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textTransform={TextTransform.Uppercase}
        >
          {t('securitySrpLabel')}
        </Text>
        <SrpList
          onActionComplete={onSrpActionComplete}
          hideShowAccounts={false}
          isSettingsPage={true}
        />
      </Box>
    </Box>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { capitalize } from 'lodash';
import {
  Box,
  BoxAlignItems,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
  FontWeight,
  TextTransform,
  Text,
} from '@metamask/design-system-react';
import { AuthConnection } from '../../../../shared/constants/onboarding';
import { SrpList } from '../../multichain/multi-srp/srp-list/srp-list';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsSocialLoginFlow,
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../selectors';
import Card from '../../ui/card';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';

const SOCIAL_LOGIN_ICON_CLASS = 'srp-reveal-list__social-icon';

function renderSocialLoginIcon(socialLoginType: AuthConnection) {
  switch (socialLoginType) {
    case AuthConnection.Apple:
      return (
        <Icon
          name={IconName.AppleLogo}
          color={IconColor.IconDefault}
          size={IconSize.Lg}
        />
      );
    case AuthConnection.Telegram:
      return (
        <Icon
          name={IconName.Telegram}
          size={IconSize.Lg}
          style={{ color: 'var(--color-telegram-blue)' }}
        />
      );
    case AuthConnection.Google:
    default:
      return (
        <img
          src="images/google.svg"
          className={SOCIAL_LOGIN_ICON_CLASS}
          alt="Google icon"
        />
      );
  }
}

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

  return (
    <Box className="srp-reveal-list h-full min-h-0 overflow-y-auto">
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
              className="flex flex-row"
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <Box className="flex" alignItems={BoxAlignItems.Center} gap={2}>
                {renderSocialLoginIcon(socialLoginType as AuthConnection)}
              </Box>
              <Box className="flex-col flex">
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
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="mt-1"
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
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="mb-2"
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

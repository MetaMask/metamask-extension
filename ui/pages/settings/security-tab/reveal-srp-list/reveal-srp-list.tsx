import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import SRPQuizModal from '../../../../components/app/srp-quiz-modal/SRPQuiz';
import { SrpList } from '../../../../components/multichain/multi-srp/srp-list/srp-list';
import {
  TextVariant,
  TextColor,
  TextTransform,
  BackgroundColor,
  Display,
  FlexDirection,
  AlignItems,
  IconColor,
  FontWeight,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';
import {
  getIsSocialLoginFlow,
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../../selectors';
import Card from '../../../../components/ui/card';
import { useSyncSRPs } from '../../../../hooks/social-sync/useSyncSRPs';
import Spinner from '../../../../components/ui/spinner';

export const RevealSrpList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);
  const socialLoginEmail = useSelector(getSocialLoginEmail);
  const { loading: syncSRPsLoading } = useSyncSRPs();

  const onSrpActionComplete = (keyringId: string, triggerBackup?: boolean) => {
    if (triggerBackup) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&isFromSettingsSecurity=true`;
      history.push(backUpSRPRoute);
    } else {
      setSelectedKeyringId(keyringId);
      setSrpQuizModalVisible(true);
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
    <Box className="srp-reveal-list">
      {isSocialLoginFlow && (
        <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
          <Text
            marginBottom={2}
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textTransform={TextTransform.Uppercase}
          >
            {t('securitySocialLoginLabel', [socialLoginType])}
          </Text>
          <Card
            className="srp-reveal-list__social-login-card"
            backgroundColor={BackgroundColor.backgroundMuted}
            border={false}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              gap={3}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={2}
              >
                {socialLoginType === AuthConnection.Apple ? (
                  <Icon
                    name={IconName.Apple}
                    color={IconColor.iconDefault}
                    size={IconSize.Lg}
                  />
                ) : (
                  <img
                    src={`images/icons/google.svg`}
                    className="srp-reveal-list__social-icon"
                    alt="Google icon"
                  />
                )}
              </Box>
              <Box flexDirection={FlexDirection.Column}>
                <Text fontWeight={FontWeight.Medium}>
                  {t('securitySocialLoginEnabled')}
                </Text>
                {socialLoginEmail && (
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {maskHostNameFromEmail(socialLoginEmail)}
                  </Text>
                )}
              </Box>
            </Box>
          </Card>
          <Text
            marginTop={1}
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            {t('securitySocialLoginEnabledDescription')}
          </Text>
          <Box
            width={BlockSize.Full}
            className="srp-reveal-list__divider"
            marginTop={4}
          />
        </Box>
      )}
      <Box
        paddingTop={4}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={0}
        className="srp-reveal-list__srp-list"
      >
        <Text
          marginBottom={2}
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textTransform={TextTransform.Uppercase}
        >
          {t('securitySrpLabel')}
        </Text>
        {syncSRPsLoading && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            marginTop={12}
          >
            <Spinner className="change-password__spinner" />
            <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
              {t('syncingSeedPhrases')}
            </Text>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('syncingSeedPhrasesNote')}
            </Text>
          </Box>
        )}
        {!syncSRPsLoading && (
          <SrpList
            onActionComplete={onSrpActionComplete}
            hideShowAccounts={false}
            isSettingsPage={true}
          />
        )}
      </Box>
      {srpQuizModalVisible && selectedKeyringId && (
        <SRPQuizModal
          keyringId={selectedKeyringId}
          isOpen={srpQuizModalVisible}
          onClose={() => setSrpQuizModalVisible(false)}
        />
      )}
    </Box>
  );
};

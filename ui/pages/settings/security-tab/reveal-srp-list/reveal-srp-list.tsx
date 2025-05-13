import React, { useState } from 'react';
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
import Card from '../../../../components/ui/card';
import {
  FlexDirection,
  Display,
  AlignItems,
  BlockSize,
  TextVariant,
  TextColor,
  FontWeight,
  IconColor,
  TextTransform,
} from '../../../../helpers/constants/design-system';
import {
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../../selectors/social-sync';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const RevealSrpList = () => {
  const t = useI18nContext();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  const socialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginEnabled = Boolean(socialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);

  return (
    <Box className="srp-reveal-list">
      {socialLoginEnabled && (
        <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
          <Text
            marginBottom={2}
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textTransform={TextTransform.Uppercase}
          >
            {t('securitySocialLoginLabel', [socialLoginType])}
          </Text>
          <Card className="srp-reveal-list__social-login-card">
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
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {socialLoginEmail}
                </Text>
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
      <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={0}>
        <Text
          marginBottom={2}
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textTransform={TextTransform.Uppercase}
        >
          {t('securitySrpLabel')}
        </Text>
        <SrpList
          onActionComplete={(keyringId) => {
            // TODO: if srp is not backed up do the secure srp flow else reveal the srp flow
            setSelectedKeyringId(keyringId);
            setSrpQuizModalVisible(true);
          }}
          hideShowAccounts={false}
        />
      </Box>
      <Box paddingBottom={4} paddingLeft={4} paddingRight={4}>
        <Box
          width={BlockSize.Full}
          className="srp-reveal-list__divider"
          marginTop={1}
          marginBottom={4}
        />
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {t('securityFooterText')}
        </Text>
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

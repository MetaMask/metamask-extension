import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { useHistory } from 'react-router-dom';
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
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSyncSRPs } from '../../../../hooks/social-sync/useSyncSRPs';
import {
  getSocialLoginEmail,
  getSocialLoginType,
  getFirstTimeFlowType,
  isSocialLoginFlow,
} from '../../../../selectors';
import { getSeedPhraseBackedUp } from '../../../../ducks/metamask/metamask';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';

export const RevealSrpList = () => {
  // sync SRPs
  useSyncSRPs();

  const t = useI18nContext();
  const history = useHistory();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  const firstTimeFlow = useSelector(getFirstTimeFlowType);
  const socialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginEnabled = useSelector(isSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);
  const seedPhraseBackedUp =
    useSelector(getSeedPhraseBackedUp) ||
    socialLoginEnabled ||
    firstTimeFlow !== FirstTimeFlowType.create;

  const onSrpActionComplete = (keyringId: string, triggerBackup?: boolean) => {
    if (triggerBackup) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
      history.push(backUpSRPRoute);
    } else {
      setSelectedKeyringId(keyringId);
      setSrpQuizModalVisible(true);
    }
  };

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
        <SrpList
          onActionComplete={onSrpActionComplete}
          hideShowAccounts={false}
          seedPhraseBackedUp={seedPhraseBackedUp}
          isSettingsPage={true}
        />
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

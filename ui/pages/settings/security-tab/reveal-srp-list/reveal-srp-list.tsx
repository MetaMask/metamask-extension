import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { capitalize } from 'lodash';
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
  JustifyContent,
  Display,
  AlignItems,
  BlockSize,
  TextVariant,
  TextColor,
  FontWeight,
  IconColor,
} from '../../../../helpers/constants/design-system';
import {
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../../selectors/social-sync';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSyncSRPs } from '../../../../hooks/social-sync/useSyncSRPs';

export const RevealSrpList = () => {
  // sync SRPs
  useSyncSRPs();
  const t = useI18nContext();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  const socialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginEnabled = Boolean(socialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);

  const socialLoginCardTitle = () => {
    return (
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
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
        <Text fontWeight={FontWeight.Medium}>
          {t('securitySocialLoginEnabled')}
        </Text>
      </Box>
    );
  };

  return (
    <Box className="srp-reveal-list">
      {socialLoginEnabled && (
        <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
          <Card>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
            >
              {socialLoginCardTitle()}
            </Box>
            <Box>
              <Box
                width={BlockSize.Full}
                className="srp-reveal-list__divider"
                marginTop={2}
                marginBottom={2}
              />
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('securitySocialLoginEnabledDescription', [
                  capitalize(socialLoginType),
                ])}
              </Text>
            </Box>
          </Card>
        </Box>
      )}
      <SrpList
        onActionComplete={(keyringId) => {
          // TODO: if srp is not backed up do the secure srp flow else reveal the srp flow
          setSelectedKeyringId(keyringId);
          setSrpQuizModalVisible(true);
        }}
        hideShowAccounts={false}
      />
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

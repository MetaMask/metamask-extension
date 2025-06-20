import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from '../../../../components/component-library';
import SRPQuizModal from '../../../../components/app/srp-quiz-modal/SRPQuiz';
import { SrpList } from '../../../../components/multichain/multi-srp/srp-list/srp-list';
import {
  TextVariant,
  TextColor,
  TextTransform,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';

export const RevealSrpList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  const onSrpActionComplete = (keyringId: string, triggerBackup?: boolean) => {
    if (triggerBackup) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&isFromSettingsSecurity=true`;
      history.push(backUpSRPRoute);
    } else {
      setSelectedKeyringId(keyringId);
      setSrpQuizModalVisible(true);
    }
  };

  return (
    <Box className="srp-reveal-list">
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

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getFirstTimeFlowType } from '../../../../selectors';
import { getSeedPhraseBackedUp } from '../../../../ducks/metamask/metamask';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';

export const RevealSrpList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  const firstTimeFlow = useSelector(getFirstTimeFlowType);
  const isSeedPhraseBackedUp =
    useSelector(getSeedPhraseBackedUp) ||
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
          seedPhraseBackedUp={isSeedPhraseBackedUp}
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

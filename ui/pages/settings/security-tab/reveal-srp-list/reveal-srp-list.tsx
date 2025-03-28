import React, { useState } from 'react';
import { Box } from '../../../../components/component-library';
import SRPQuizModal from '../../../../components/app/srp-quiz-modal/SRPQuiz';
import { SrpList } from '../../../../components/multichain/multi-srp/srp-list/srp-list';

export const RevealSrpList = () => {
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = useState('');

  return (
    <Box>
      <SrpList
        onActionComplete={(keyringId) => {
          setSelectedKeyringId(keyringId);
          setSrpQuizModalVisible(true);
        }}
        hideShowAccounts={true}
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

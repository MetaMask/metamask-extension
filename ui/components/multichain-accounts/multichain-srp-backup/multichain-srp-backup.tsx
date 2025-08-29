import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { IconSize } from '@metamask/design-system-react';
import { Box, Icon, IconName, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import SRPQuiz from '../../app/srp-quiz-modal';

export type MultichainSrpBackupProps = {
  shouldShowBackupReminder?: boolean;
  className?: string | Record<string, boolean>;
  keyringId?: string;
};

export const MultichainSrpBackup: React.FC<MultichainSrpBackupProps> = ({
  shouldShowBackupReminder = false,
  className = '',
  keyringId,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);

  const handleSrpBackupClick = () => {
    if (shouldShowBackupReminder) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
      history.push(backUpSRPRoute);
    } else {
      setSrpQuizModalVisible(true);
    }
  };

  const handleQuizModalClose = () => {
    setSrpQuizModalVisible(false);
  };

  const finalClassName = classnames('multichain-srp-backup', className);

  return (
    <>
      <Box
        className={finalClassName}
        padding={4}
        width={BlockSize.Full}
        textAlign={TextAlign.Left}
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundMuted}
        onClick={handleSrpBackupClick}
        data-testid="multichain-srp-backup"
      >
        <Box>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {t('secretRecoveryPhrase')}
          </Text>
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
          {shouldShowBackupReminder ? (
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.errorDefault}
            >
              {t('backup')}
            </Text>
          ) : (
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {t('accountDetailsSrpBackUpMessage')}
            </Text>
          )}
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.iconAlternative}
          />
        </Box>
      </Box>
      {srpQuizModalVisible && keyringId && (
        <SRPQuiz
          keyringId={keyringId}
          isOpen={srpQuizModalVisible}
          onClose={handleQuizModalClose}
          closeAfterCompleting
        />
      )}
    </>
  );
};

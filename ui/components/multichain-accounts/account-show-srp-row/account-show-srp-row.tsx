import React, { useState } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import {
  TextVariant,
  TextColor,
  Display,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';
import { AccountDetailsRow } from '../account-details-row/account-details-row';
import {
  ButtonIcon,
  IconName,
  Text,
  Box,
  ButtonIconSize,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import SRPQuiz from '../../app/srp-quiz-modal';

type AccountShowSrpRowProps = {
  account: InternalAccount;
};

export const AccountShowSrpRow = ({ account }: AccountShowSrpRowProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const seedPhraseBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const keyringId =
    account.options?.entropySource &&
    typeof account.options.entropySource === 'string'
      ? account.options.entropySource
      : undefined;
  const isFirstHdKeyring = hdKeyrings[0]?.metadata?.id === keyringId;
  const shouldShowBackupReminder =
    !seedPhraseBackedUp && isFirstHdKeyring && keyringId;

  return (
    <>
      <AccountDetailsRow
        label={t('secretRecoveryPhrase')}
        value={''}
        endAccessory={
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
            {shouldShowBackupReminder && (
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.errorDefault}
              >
                {t('backup')}
              </Text>
            )}
            <ButtonIcon
              iconName={IconName.ArrowRight}
              ariaLabel={t('next')}
              color={IconColor.iconAlternative}
              size={ButtonIconSize.Md}
            />
          </Box>
        }
        onClick={() => {
          if (shouldShowBackupReminder) {
            const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
            navigate(backUpSRPRoute);
          } else {
            setSrpQuizModalVisible(true);
          }
        }}
      />
      {srpQuizModalVisible ? (
        <SRPQuiz
          keyringId={keyringId}
          isOpen={srpQuizModalVisible}
          onClose={() => setSrpQuizModalVisible(false)}
          closeAfterCompleting
          navigate={navigate}
        />
      ) : null}
    </>
  );
};

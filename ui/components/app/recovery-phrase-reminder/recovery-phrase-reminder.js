import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
// Components
import Box from '../../ui/box';
import {
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
} from '../../component-library';
import Popover from '../../ui/popover';
// Helpers
import {
  DISPLAY,
  TextAlign,
  TextVariant,
  FontWeight,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_UNLOCK_ROUTE } from '../../../helpers/constants/routes';

export default function RecoveryPhraseReminder({ onConfirm, hasBackedUp }) {
  const t = useI18nContext();
  const history = useHistory();

  const handleBackUp = () => {
    history.push(ONBOARDING_UNLOCK_ROUTE);
  };

  return (
    <Popover centerTitle title={t('recoveryPhraseReminderTitle')}>
      <Box
        paddingRight={4}
        paddingBottom={6}
        paddingLeft={4}
        className="recovery-phrase-reminder"
      >
        <Text
          color={TextColor.textDefault}
          align={TextAlign.Center}
          variant={TextVariant.bodyMd}
          marginBottom={4}
        >
          {t('recoveryPhraseReminderSubText')}
        </Text>
        <Box marginTop={4} marginBottom={8}>
          <ul className="recovery-phrase-reminder__list">
            <Text
              as="li"
              color={TextColor.textDefault}
              fontWeight={FontWeight.Bold}
            >
              {t('recoveryPhraseReminderItemOne')}
            </Text>
            <Text as="li">{t('recoveryPhraseReminderItemTwo')}</Text>
            <Text as="li">
              {hasBackedUp ? (
                t('recoveryPhraseReminderHasBackedUp')
              ) : (
                <>
                  {t('recoveryPhraseReminderHasNotBackedUp')}
                  <Box display={DISPLAY.INLINE_BLOCK} marginLeft={1}>
                    <Button
                      variant={ButtonVariant.Link}
                      onClick={handleBackUp}
                      size={ButtonSize.Inherit}
                    >
                      {t('recoveryPhraseReminderBackupStart')}
                    </Button>
                  </Box>
                </>
              )}
            </Text>
          </ul>
        </Box>
        <Box justifyContent={JustifyContent.center}>
          <Button variant={ButtonVariant.Primary} block onClick={onConfirm}>
            {t('recoveryPhraseReminderConfirm')}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}

RecoveryPhraseReminder.propTypes = {
  hasBackedUp: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

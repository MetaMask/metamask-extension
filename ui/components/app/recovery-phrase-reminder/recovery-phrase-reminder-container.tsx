import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getShowRecoveryPhraseReminder } from '../../../selectors';
import {
  setRecoveryPhraseReminderHasBeenShown,
  setRecoveryPhraseReminderLastShown,
} from '../../../store/actions';
import { useAppDispatch } from '../../../store/hooks';
import RecoveryPhraseReminder from './recovery-phrase-reminder';

export function RecoveryPhraseReminderContainer() {
  const dispatch = useAppDispatch();
  const showRecoveryPhraseReminder = useSelector(getShowRecoveryPhraseReminder);
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );

  const onConfirm = useCallback(() => {
    dispatch(setRecoveryPhraseReminderHasBeenShown());
    dispatch(setRecoveryPhraseReminderLastShown(new Date().getTime()));
  }, [dispatch]);

  if (!showRecoveryPhraseReminder || isPrimarySeedPhraseBackedUp) {
    return null;
  }

  return <RecoveryPhraseReminder onConfirm={onConfirm} />;
}

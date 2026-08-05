import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getShouldShowSeedPhraseReminder } from '../../../selectors/multi-srp/multi-srp';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import HomeNotification from '../home-notification';
import type { MetaMaskReduxState } from '../../../store/store';

export function SeedPhraseBackupNotificationContainer() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const shouldShowSeedPhraseReminder = useSelector(
    (state: MetaMaskReduxState) => {
      const account = getSelectedInternalAccount(state);
      return account ? getShouldShowSeedPhraseReminder(state, account) : false;
    },
  );

  const onAccept = useCallback(() => {
    const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
    if (isPopup) {
      global.platform.openExtensionInBrowser(backUpSRPRoute);
    } else {
      navigate(backUpSRPRoute);
    }
  }, [navigate]);

  if (isPrimarySeedPhraseBackedUp || !shouldShowSeedPhraseReminder) {
    return null;
  }

  return (
    <HomeNotification
      descriptionText={t('backupApprovalNotice')}
      acceptText={t('backupNow')}
      onAccept={onAccept}
      infoText={t('backupApprovalInfo')}
    />
  );
}

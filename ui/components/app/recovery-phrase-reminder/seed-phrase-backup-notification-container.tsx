import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getShouldShowSeedPhraseReminder } from '../../../selectors/multi-srp/multi-srp';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { ToastContent, type ToastWithClose, toast } from '../../ui/toast/toast';
import type { MetaMaskReduxState } from '../../../store/store';

const toastId = 'backup-srp-toast';

export function SeedPhraseBackupNotificationContainer() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const shouldShowSeedPhraseReminder = useSelector(
    (state: MetaMaskReduxState) => {
      const account = getSelectedInternalAccount(state);
      return account ? getShouldShowSeedPhraseReminder(state, account) : false;
    },
  );

  const shouldShow =
    !dismissed && !isPrimarySeedPhraseBackedUp && shouldShowSeedPhraseReminder;

  const dismissToast = useCallback(() => {
    setDismissed(true);
    toast.dismiss(toastId);
  }, []);

  const handleActionClick = useCallback(() => {
    const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
    if (isPopup) {
      global.platform.openExtensionInBrowser(backUpSRPRoute);
    } else {
      navigate(backUpSRPRoute);
    }
    dismissToast();
  }, [dismissToast, navigate]);

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(toastId);
      return;
    }

    toast(
      <ToastContent
        dataTestId={toastId}
        title={t('backupApprovalNotice')}
        actionText={t('backupNow')}
        onActionClick={handleActionClick}
      />,
      {
        id: toastId,
        duration: Infinity,
        icon: (
          <Icon
            className="self-start"
            name={IconName.Info}
            size={IconSize.Lg}
          />
        ),
        onClose: dismissToast,
      } as ToastWithClose,
    );
  }, [dismissToast, handleActionClick, shouldShow, t]);

  useEffect(() => {
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return null;
}

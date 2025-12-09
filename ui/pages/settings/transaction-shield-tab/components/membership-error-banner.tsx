import React from 'react';
import { Subscription } from '@metamask/subscription-controller';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getShortDateFormatterV2 } from '../../../asset/util';

type MembershipErrorBannerProps = {
  isPaused: boolean;
  isCryptoPayment: boolean;
  isCardPayment: boolean;
  isSubscriptionEndingSoon: boolean;
  currentShieldSubscription?: Subscription;
  onActionButtonClick: () => void;
};

const PAYMENT_UPDATE_HOURS = 24;

const MembershipErrorBanner = ({
  isPaused,
  isCryptoPayment,
  isCardPayment,
  isSubscriptionEndingSoon,
  currentShieldSubscription,
  onActionButtonClick,
}: MembershipErrorBannerProps) => {
  const t = useI18nContext();

  if (isPaused) {
    // default text to unexpected error case
    let descriptionText = 'shieldTxMembershipErrorPausedUnexpected';
    let actionButtonLabel = 'shieldTxMembershipErrorPausedUnexpectedAction';
    if (isCryptoPayment) {
      descriptionText = 'shieldTxMembershipErrorPausedCryptoInsufficientFunds';
      actionButtonLabel =
        'shieldTxMembershipErrorPausedCryptoInsufficientFundsAction';
    } else if (isCardPayment) {
      descriptionText = 'shieldTxMembershipErrorPausedCard';
      actionButtonLabel = 'shieldTxMembershipErrorPausedCardAction';
    }
    return (
      <BannerAlert
        description={t(descriptionText, [PAYMENT_UPDATE_HOURS])}
        severity={BannerAlertSeverity.Danger}
        marginBottom={4}
        actionButtonLabel={t(actionButtonLabel)}
        actionButtonOnClick={onActionButtonClick}
      />
    );
  }

  if (currentShieldSubscription && isSubscriptionEndingSoon) {
    return (
      <BannerAlert
        description={t('shieldTxMembershipErrorInsufficientFunds', [
          getShortDateFormatterV2().format(
            new Date(currentShieldSubscription.currentPeriodEnd),
          ),
        ])}
        severity={BannerAlertSeverity.Warning}
        marginBottom={4}
        actionButtonLabel={t('shieldTxMembershipRenew')}
        actionButtonOnClick={onActionButtonClick}
      />
    );
  }

  return null;
};

export default MembershipErrorBanner;

import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert, BannerAlertSeverity } from '../../component-library';
import {
  isSelectedInternalAccountEth,
  isSelectedInternalAccountBtc,
} from '../../../selectors/accounts';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewBtc } from './account-overview-btc';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

export function AccountOverview(props: AccountOverviewProps) {
  const t = useI18nContext();

  const isEth = useSelector(isSelectedInternalAccountEth);
  const isBtc = useSelector(isSelectedInternalAccountBtc);
  const isUnknown = !isEth && !isBtc;

  const { useExternalServices, setBasicFunctionalityModalOpen } = props;

  return (
    <>
      {!useExternalServices && (
        <BannerAlert
          margin={4}
          marginBottom={0}
          severity={BannerAlertSeverity.Danger}
          actionButtonLabel={t('basicConfigurationBannerCTA')}
          actionButtonOnClick={() => {
            setBasicFunctionalityModalOpen();
          }}
          title={t('basicConfigurationBannerTitle')}
        />
      )}
      {isEth && <AccountOverviewEth {...props}></AccountOverviewEth>}
      {isBtc && <AccountOverviewBtc {...props}></AccountOverviewBtc>}
      {isUnknown && (
        <AccountOverviewUnknown {...props}></AccountOverviewUnknown>
      )}
    </>
  );
}

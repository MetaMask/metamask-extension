import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert, BannerAlertSeverity } from '../../component-library';
import { isSelectedInternalAccountEth } from '../../../selectors';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonOptions } from './common';

export type AccountOverviewOptions = AccountOverviewCommonOptions & {
  useExternalServices: boolean;
};

export const AccountOverview = (options: AccountOverviewOptions) => {
  const t = useI18nContext();

  const isEth = useSelector(isSelectedInternalAccountEth);
  const isUnknown = !isEth;

  const { useExternalServices, setBasicFunctionalityModalOpen } = options;

  return (
    <>
      {useExternalServices ? null : (
        <BannerAlert
          margin={4}
          marginBottom={0}
          severity={BannerAlertSeverity.Danger}
          actionButtonLabel={t('basicConfigurationBannerCTA')}
          actionButtonOnClick={() => {
            setBasicFunctionalityModalOpen();
          }}
          title={t('basicConfigurationBannerTitle')}
        ></BannerAlert>
      )}
      {isEth && <AccountOverviewEth {...options}></AccountOverviewEth>}
      {isUnknown && (
        <AccountOverviewUnknown {...options}></AccountOverviewUnknown>
      )}
    </>
  );
};

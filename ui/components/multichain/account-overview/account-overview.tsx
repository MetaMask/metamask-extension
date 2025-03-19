import React from 'react';
import { useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert, BannerAlertSeverity } from '../../component-library';
import { getSelectedInternalAccount } from '../../../selectors';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonProps } from './common';
import { AccountOverviewNonEvm } from './account-overview-non-evm';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

export function AccountOverview(props: AccountOverviewProps) {
  const t = useI18nContext();
  const account = useSelector(getSelectedInternalAccount);

  const { useExternalServices, setBasicFunctionalityModalOpen } = props;

  const renderAccountOverviewOption = () => {
    switch (account.type) {
      case EthAccountType.Eoa:
      case EthAccountType.Erc4337:
        return <AccountOverviewEth {...props}></AccountOverviewEth>;
      case BtcAccountType.P2wpkh:
      case SolAccountType.DataAccount:
        return <AccountOverviewNonEvm {...props}></AccountOverviewNonEvm>;
      default:
        return <AccountOverviewUnknown {...props}></AccountOverviewUnknown>;
    }
  };

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
      {renderAccountOverviewOption()}
    </>
  );
}

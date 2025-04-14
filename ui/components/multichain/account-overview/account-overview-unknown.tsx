// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { Box } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountOverviewCommonProps } from './common';
import { AccountOverviewLayout } from './account-overview-layout';

export type AccountOverviewUnknownProps = AccountOverviewCommonProps;

export const AccountOverviewUnknown = (props: AccountOverviewUnknownProps) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();

  return (
    <AccountOverviewLayout
      showTokens={false}
      showNfts={false}
      showActivity={true}
      {...props}
    >
      <Box className="account-overview-unknown__empty">
        <Box className="account-overview-unknown__empty-text">
          <span>{t('accountTypeNotSupported')}</span>
        </Box>
      </Box>
    </AccountOverviewLayout>
  );
};

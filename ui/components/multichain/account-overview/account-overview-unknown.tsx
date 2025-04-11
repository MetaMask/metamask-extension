import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box } from '../../component-library';
import { AccountOverviewLayout } from './account-overview-layout';
import type { AccountOverviewCommonProps } from './common';

export type AccountOverviewUnknownProps = AccountOverviewCommonProps;

export const AccountOverviewUnknown = (props: AccountOverviewUnknownProps) => {
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

import React from 'react';
import { Box } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountOverviewCommonProps } from './common';
import { AccountOverviewLayout } from './account-overview-layout';

export type AccountOverviewUnknownProps = AccountOverviewCommonProps;

export const AccountOverviewUnknown = (props: AccountOverviewUnknownProps) => {
  const t = useI18nContext();

  return (
    <AccountOverviewLayout
      showTokens={false}
      showNfts={false}
      showDefi={false}
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

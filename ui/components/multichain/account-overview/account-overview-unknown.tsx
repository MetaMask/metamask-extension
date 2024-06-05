import React from 'react';
import { Box } from '../../component-library';
import { AccountOverviewCommonProps } from './common';
import { AccountOverviewLayout } from './account-overview-layout';

export type AccountOverviewUnknownProps = AccountOverviewCommonProps;

export const AccountOverviewUnknown = (props: AccountOverviewUnknownProps) => {
  return (
    <AccountOverviewLayout
      showTokens={false}
      showNfts={false}
      showActivity={true}
      {...props}
    >
      <div className="home__balance-wrapper">
        <Box className="account-overview-unknown__empty">
          <Box className="account-overview-unknown__empty-text">
            {/* TODO: Use a localized message here! */}
            <span>Account type not supported yet!</span>
          </Box>
        </Box>
      </div>
    </AccountOverviewLayout>
  );
};

import React from 'react';
import { Box } from '../../component-library';
import { AccountOverviewCommonOptions } from './common';
import { AccountOverviewLayout } from './account-overview-layout';

export type AccountOverviewUnknownOptions = AccountOverviewCommonOptions;

export const AccountOverviewUnknown = (
  options: AccountOverviewUnknownOptions,
) => {
  return (
    <AccountOverviewLayout
      showTokens={false}
      showNfts={false}
      showActivity={true}
      {...options}
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

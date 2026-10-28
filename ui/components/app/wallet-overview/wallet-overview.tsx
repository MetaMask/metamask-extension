import React from 'react';
import classnames from 'clsx';

import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';

type WalletOverviewProps = {
  balance: React.ReactNode;
  buttons: React.ReactNode;
  className?: string;
};

const WalletOverview = ({
  balance,
  buttons,
  className,
}: WalletOverviewProps) => {
  const environmentType = getEnvironmentType();

  return (
    <div
      className={classnames(
        'wallet-overview',
        {
          'wallet-overview-fullscreen':
            environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
            environmentType === ENVIRONMENT_TYPE_SIDEPANEL,
          'wallet-overview-sidepanel':
            environmentType === ENVIRONMENT_TYPE_SIDEPANEL,
        },
        className,
      )}
    >
      <div className="wallet-overview__balance">{balance}</div>
      <div className="wallet-overview__buttons">{buttons}</div>
    </div>
  );
};

export default WalletOverview;

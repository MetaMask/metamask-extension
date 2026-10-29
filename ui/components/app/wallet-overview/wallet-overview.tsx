import React from 'react';
import classnames from 'clsx';

import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { getBalanceAlignmentClassName } from './wallet-overview-layout';

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
  const isFullscreenOrSidepanel =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  return (
    <div
      className={classnames(
        'flex min-w-0 w-full flex-1 flex-col justify-between gap-4',
        isFullscreenOrSidepanel ? 'items-center' : 'items-start',
        className,
      )}
    >
      <div
        className={classnames(
          'flex w-full flex-1 flex-col gap-1',
          getBalanceAlignmentClassName(),
        )}
      >
        {balance}
      </div>
      {/* 458px = 490px - 32px */}
      <div
        className={classnames('flex h-full w-full max-w-[458px]', {
          'self-center': isFullscreenOrSidepanel,
        })}
      >
        {buttons}
      </div>
    </div>
  );
};

export default WalletOverview;

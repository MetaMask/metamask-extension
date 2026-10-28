import React from 'react';
import classnames from 'clsx';

import {
  getBalanceAlignmentClassName,
  getWalletOverviewLayout,
} from './wallet-overview-layout';

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
  const layout = getWalletOverviewLayout();
  const { isFullscreenOrSidepanel } = layout;

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
          getBalanceAlignmentClassName(layout),
        )}
      >
        {balance}
      </div>
      <div
        className={classnames(
          // 458px = 490px (side panel narrow breakpoint) - 32px
          'flex h-full w-full max-w-[458px]',
          { 'self-center': isFullscreenOrSidepanel },
        )}
      >
        {buttons}
      </div>
    </div>
  );
};

export default WalletOverview;

import React from 'react';
import classnames from 'clsx';

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
  return (
    <div
      className={classnames(
        'flex min-w-0 w-full flex-1 flex-col items-center justify-between gap-4 wide-layout:items-start',
        className,
      )}
    >
      <div className="flex w-full flex-1 flex-col gap-1 max-[490px]:items-start">
        {balance}
      </div>
      {/* 458px = 490px - 32px */}
      <div className="flex h-full w-full max-w-[458px] self-center wide-layout:max-w-none wide-layout:self-start">
        {buttons}
      </div>
    </div>
  );
};

export default WalletOverview;

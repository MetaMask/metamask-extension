import React from 'react';
import classnames from 'clsx';
import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';

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
  const isFullScreenDesign = useFullScreenDesign();

  return (
    <div
      className={classnames(
        'flex min-w-0 w-full flex-1 flex-col justify-between gap-4',
        isFullScreenDesign ? 'items-start' : 'items-center',
        className,
      )}
    >
      <div className="flex w-full flex-1 flex-col gap-1 max-[490px]:items-start">
        {balance}
      </div>
      {/* 458px = 490px - 32px */}
      <div
        className={classnames('flex h-full w-full', {
          'max-w-[458px] self-center': !isFullScreenDesign,
        })}
      >
        {buttons}
      </div>
    </div>
  );
};

export default WalletOverview;

import React from 'react';
import classnames from 'clsx';

type WalletOverviewProps = {
  balance: React.ReactNode;
  buttons: React.ReactNode;
  className?: string;
  align?: 'center' | 'start';
};

const WalletOverview = ({
  balance,
  buttons,
  className,
  align = 'center',
}: WalletOverviewProps) => {
  const isCentered = align === 'center';

  return (
    <div
      className={classnames(
        'flex min-w-0 w-full flex-1 flex-col justify-between gap-4',
        isCentered ? 'items-center' : 'items-start',
        className,
      )}
    >
      <div className="flex w-full flex-1 flex-col gap-1 max-[490px]:items-start">
        {balance}
      </div>
      {/* 458px = 490px - 32px */}
      <div
        className={classnames('flex h-full w-full', {
          'max-w-[458px] self-center': isCentered,
        })}
      >
        {buttons}
      </div>
    </div>
  );
};

export default WalletOverview;

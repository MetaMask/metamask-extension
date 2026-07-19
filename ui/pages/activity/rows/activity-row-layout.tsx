import React from 'react';
import { Text } from '@metamask/design-system-react';

export type ActivityRowLayoutProps = {
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryAmount?: React.ReactNode;
  secondaryAmount?: React.ReactNode;
  txStatus: string;
  onClick?: () => void;
};

export function ActivityRowLayout({
  avatar,
  title,
  subtitle,
  primaryAmount,
  secondaryAmount,
  txStatus,
  onClick,
}: Readonly<ActivityRowLayoutProps>) {
  return (
    <div className="[container-name:list-item] [container-type:inline-size]">
      <button
        type="button"
        className="grid w-full min-h-[62px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4 border-0 bg-transparent px-4 py-2 text-left text-inherit transition-transform duration-200 ease-out hover:bg-hover cursor-pointer"
        data-testid="activity-list-item"
        data-tx-status={txStatus}
        onClick={onClick}
      >
        <div className="relative flex items-center justify-center">
          {avatar}
        </div>
        <div className="min-w-0">
          <Text
            className="flex min-w-0 items-center gap-1 font-medium text-s-body-md @compact:text-s-body-sm"
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          {typeof subtitle === 'string' ? (
            <Text variant="body-sm" className="truncate text-alternative">
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </div>
        <div className="flex flex-col items-end whitespace-nowrap">
          {primaryAmount && (
            <Text
              className="font-medium text-s-body-md @compact:text-s-body-sm"
              data-testid="transaction-list-item-primary-currency"
            >
              {primaryAmount}
            </Text>
          )}
          {secondaryAmount && (
            <Text
              variant="body-sm"
              className="text-alternative"
              data-testid="transaction-list-item-secondary-currency"
            >
              {secondaryAmount}
            </Text>
          )}
        </div>
      </button>
    </div>
  );
}

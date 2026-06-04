import React from 'react';
import { Text } from '@metamask/design-system-react';

export type ActivityRowLayoutProps = {
  txStatus: string;
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryAmount?: React.ReactNode;
  secondaryAmount?: React.ReactNode;
  onClick?: () => void;
};

export function ActivityRowLayout({
  avatar,
  onClick,
  primaryAmount,
  secondaryAmount,
  subtitle,
  title,
  txStatus,
}: Readonly<ActivityRowLayoutProps>) {
  return (
    <div className="[container-name:list-item] [container-type:inline-size]">
      <div
        className="grid min-h-[70px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-transform duration-200 ease-out hover:bg-hover cursor-pointer"
        role="button"
        data-testid="activity-list-item"
        data-tx-status={txStatus}
        onClick={onClick}
      >
        <div className="relative flex items-center justify-center">
          {avatar}
        </div>
        <div className="min-w-0">
          <Text
            className="flex min-w-0 items-center gap-1 truncate font-medium text-s-body-md @compact:text-s-body-sm"
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          {subtitle && (
            <Text variant="body-sm" className="truncate text-alternative">
              {subtitle}
            </Text>
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
      </div>
    </div>
  );
}

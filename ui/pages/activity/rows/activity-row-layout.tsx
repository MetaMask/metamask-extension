import React from 'react';
import { Icon, IconName, IconSize, Text } from '@metamask/design-system-react';
import { StatusIcon } from '../../../components/ui/icon/status-icon';

export type ActivityRowLayoutProps = {
  txStatus: string;
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  pendingStatusText?: string;
  showPendingSpinner?: boolean;
  primaryAmount?: React.ReactNode;
  secondaryAmount?: React.ReactNode;
  onClick?: () => void;
};

const Subtitle = ({
  pendingStatusText,
  subtitleText,
}: Readonly<{
  pendingStatusText?: string;
  subtitleText?: React.ReactNode;
}>) => {
  if (pendingStatusText) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <Icon
          name={IconName.Clock}
          size={IconSize.Xs}
          className="shrink-0 text-alternative"
        />
        <Text variant="body-sm" className="shrink-0 text-alternative">
          {pendingStatusText}
        </Text>
        {subtitleText ? (
          <>
            <Text variant="body-sm" className="shrink-0 text-alternative">
              •
            </Text>
            <Text variant="body-sm" className="truncate text-alternative">
              {subtitleText}
            </Text>
          </>
        ) : null}
      </div>
    );
  }

  if (subtitleText) {
    return (
      <Text variant="body-sm" className="truncate text-alternative">
        {subtitleText}
      </Text>
    );
  }

  return null;
}

export function ActivityRowLayout({
  avatar,
  onClick,
  pendingStatusText,
  primaryAmount,
  secondaryAmount,
  showPendingSpinner,
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
            className="flex min-w-0 items-center gap-1 font-medium text-s-body-md @compact:text-s-body-sm"
            data-testid="activity-list-item-action"
          >
            {title}
            {showPendingSpinner ? (
              <span
                className="shrink-0"
                data-testid="activity-list-item-pending-spinner"
              >
                <StatusIcon state="loading" className="w-5 h-5" />
              </span>
            ) : null}
          </Text>
          <Subtitle
            pendingStatusText={pendingStatusText}
            subtitleText={subtitle}
          />
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

import React, { ReactNode } from 'react';
import { Text } from '@metamask/design-system-react';

export function Row({
  label,
  value,
  testId = 'transaction-breakdown-row',
}: {
  label: string;
  value: ReactNode;
  testId?: string;
}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <div
      className="flex items-start justify-between gap-4 py-2"
      data-testid={testId}
    >
      <Text
        className="text-alternative"
        data-testid="transaction-breakdown-row-title"
      >
        {label}
      </Text>

      <div
        className="min-w-0 break-words text-right text-default"
        data-testid="transaction-breakdown-row-value"
      >
        {value}
      </div>
    </div>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <section className="py-3">{children}</section>;
}

import React, { type ReactNode } from 'react';
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
      className="flex min-h-8 items-center justify-between gap-4"
      data-testid={testId}
    >
      <Text
        className="text-alternative @compact:text-s-body-sm"
        data-testid="transaction-breakdown-row-title"
      >
        {label}
      </Text>

      <div
        className="min-w-0 break-words text-end @compact:text-s-body-sm"
        data-testid="transaction-breakdown-row-value"
      >
        {value}
      </div>
    </div>
  );
}

export function Section({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-2 py-2 empty:hidden">
      {children}
    </section>
  );
}

export function Footer({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mt-auto flex flex-col gap-4 pt-4">{children}</div>;
}

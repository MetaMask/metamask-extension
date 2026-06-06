import React, { ReactNode } from 'react';
import { Text } from '@metamask/design-system-react';

export function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <Text className="text-alternative">{label}</Text>

      <div className="min-w-0 break-words text-right text-default">{value}</div>
    </div>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <section className="py-3">{children}</section>;
}

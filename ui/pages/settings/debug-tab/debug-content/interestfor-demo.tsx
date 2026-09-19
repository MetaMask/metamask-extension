import React from 'react';
import 'interestfor';
import { Text } from '../../../../components/component-library';

const interestforTriggerProps = {
  interestfor: 'interestfor-demo-popover',
} as React.ButtonHTMLAttributes<HTMLButtonElement>;

const interestforPopoverProps = {
  popover: '',
} as React.HTMLAttributes<HTMLDivElement>;

export function InterestforDemo() {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Interestfor polyfill demo (temporary)
      </Text>
      <div className="settings-page__content-padded">
        <button
          type="button"
          data-testid="interestfor-demo-trigger"
          {...interestforTriggerProps}
          className="rounded-lg border border-default px-4 py-2"
        >
          Hover me
        </button>
        <div
          id="interestfor-demo-popover"
          data-testid="interestfor-demo-popover"
          {...interestforPopoverProps}
          className="rounded-lg border border-muted bg-default p-4"
        >
          This popover appears on hover via the interestfor polyfill.
        </div>
      </div>
    </>
  );
}

import React from 'react';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type MoneyFaqItemProps = {
  question: string;
  answer: React.ReactNode;
  testId: string;
};

/**
 * Expandable FAQ row for the Money How it works page.
 *
 * Uses native `<details>`/`<summary>` so collapsed answers stay in the DOM for
 * Find-in-page and assistive tech discovery.
 *
 * @param options0 - Component props.
 * @param options0.question - FAQ question label.
 * @param options0.answer - FAQ answer body. May include inline links.
 * @param options0.testId - Test id for the summary control.
 * @returns An accessible disclosure item.
 */
export function MoneyFaqItem({ question, answer, testId }: MoneyFaqItemProps) {
  return (
    <details className="group" data-testid={`${testId}-details`}>
      <summary
        className="flex w-full cursor-pointer list-none items-center justify-between gap-2 px-4 py-5 text-left [&::-webkit-details-marker]:hidden"
        data-testid={testId}
      >
        <Text
          asChild
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Bold}
          className="min-w-0 flex-1"
        >
          <h3>{question}</h3>
        </Text>
        <Icon
          name={IconName.ArrowDown}
          size={IconSize.Md}
          color={IconColor.IconDefault}
          className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
        />
      </summary>
      <div data-testid={`${testId}-answer`}>
        <Text
          asChild
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="whitespace-pre-line px-4 pb-5"
        >
          <div>{answer}</div>
        </Text>
      </div>
    </details>
  );
}

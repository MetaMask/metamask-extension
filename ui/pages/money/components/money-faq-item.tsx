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
 * Expandable FAQ row used on the Money How it works page.
 *
 * @param props - Component props.
 * @param props.question - FAQ question heading.
 * @param props.answer - FAQ answer, which may include inline links.
 * @param props.testId - Test id for the details element.
 * @returns The FAQ accordion item.
 */
export function MoneyFaqItem({ question, answer, testId }: MoneyFaqItemProps) {
  return (
    <details className="group" data-testid={testId}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-5 [&::-webkit-details-marker]:hidden">
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Bold}
          className="flex-1"
        >
          {question}
        </Text>
        <Icon
          name={IconName.ArrowDown}
          size={IconSize.Md}
          color={IconColor.IconDefault}
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <Text
        asChild
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        className="whitespace-pre-line px-4 pb-5"
      >
        <div>{answer}</div>
      </Text>
    </details>
  );
}

import React, { useId, useState } from 'react';
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
 * @param options0 - Component props.
 * @param options0.question - FAQ question label.
 * @param options0.answer - FAQ answer body. May include inline links.
 * @param options0.testId - Root test id for the toggle button.
 * @returns An accessible accordion item.
 */
export function MoneyFaqItem({ question, answer, testId }: MoneyFaqItemProps) {
  const [expanded, setExpanded] = useState(false);
  const answerId = useId();

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-5 text-left"
        aria-expanded={expanded}
        aria-controls={answerId}
        onClick={() => setExpanded((current) => !current)}
        data-testid={testId}
      >
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Bold}
          className="min-w-0 flex-1"
        >
          {question}
        </Text>
        <Icon
          name={IconName.ArrowDown}
          size={IconSize.Md}
          color={IconColor.IconDefault}
          className={`shrink-0 transition-transform duration-200 ease-out ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded ? (
        <div id={answerId} data-testid={`${testId}-answer`}>
          <Text
            asChild
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="whitespace-pre-line px-4 pb-5"
          >
            <div>{answer}</div>
          </Text>
        </div>
      ) : null}
    </div>
  );
}

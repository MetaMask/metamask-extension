import React, { useState, useRef, useEffect } from 'react';
import classnames from 'clsx';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DisclosureVariant } from './disclosure.constants';

type DisclosureProps = {
  children: React.ReactNode;
  isScrollToBottomOnOpen?: boolean;
  size?: string;
  title?: string;
  variant?: DisclosureVariant;
};

const renderSummaryByType = (
  variant: DisclosureVariant | undefined,
  title: string | undefined,
  size: string | undefined,
) => {
  if (variant === DisclosureVariant.Arrow) {
    const textVariant =
      size === 'small' ? TextVariant.BodySm : TextVariant.BodyMd;

    return (
      <summary className="disclosure__summary is-arrow">
        <Text color={TextColor.PrimaryDefault} variant={textVariant}>
          {title}
        </Text>
        <Icon
          className="disclosure__summary--icon"
          color={IconColor.PrimaryDefault}
          name={IconName.ArrowUp}
          size={IconSize.Sm}
          style={{ marginInlineStart: '8px' }}
        />
      </summary>
    );
  }

  return (
    <summary className="disclosure__summary">
      <Icon
        className="disclosure__summary--icon"
        name={IconName.Add}
        size={IconSize.Sm}
        style={{ marginInlineEnd: '8px' }}
      />
      {title}
    </summary>
  );
};

const Disclosure = ({
  children,
  isScrollToBottomOnOpen = false,
  title,
  size = 'normal',
  variant = DisclosureVariant.Default,
}: DisclosureProps) => {
  const disclosureFooterEl = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const scrollToBottom = () => {
    disclosureFooterEl?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isScrollToBottomOnOpen && open) {
      scrollToBottom();
    }
  }, [isScrollToBottomOnOpen, open]);

  return (
    <div className="disclosure" data-testid="disclosure">
      {title ? (
        <details onToggle={(e) => setOpen(e.currentTarget.open)}>
          {renderSummaryByType(variant, title, size)}

          <div className={classnames('disclosure__content', size)}>
            {children}
          </div>
          <div ref={disclosureFooterEl} className="disclosure__footer"></div>
        </details>
      ) : (
        children
      )}
    </div>
  );
};

export default Disclosure;

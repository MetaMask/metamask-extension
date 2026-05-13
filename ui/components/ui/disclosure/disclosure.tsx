import React, { useState, useRef, useEffect } from 'react';
import classnames from 'clsx';
import { Icon, IconName, IconSize, Text } from '../../component-library';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
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
  switch (variant) {
    case DisclosureVariant.Arrow: {
      const textVariant =
        size === 'small' ? TextVariant.bodySm : TextVariant.bodyMd;

      return (
        <summary className="disclosure__summary is-arrow">
          <Text color={TextColor.primaryDefault} variant={textVariant}>
            {title}
          </Text>
          <Icon
            className="disclosure__summary--icon"
            color={IconColor.primaryDefault}
            name={IconName.ArrowUp}
            size={IconSize.Sm}
            marginInlineStart={2}
          />
        </summary>
      );
    }
    default:
      return (
        <summary className="disclosure__summary">
          <Icon
            className="disclosure__summary--icon"
            name={IconName.Add}
            size={IconSize.Sm}
            marginInlineEnd={2}
          />
          {title}
        </summary>
      );
  }
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
    <div
      className="disclosure"
      data-testid="disclosure"
      onClick={() => setOpen((state) => !state)}
    >
      {title ? (
        <details>
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

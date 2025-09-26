import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, IconName, IconSize, Text } from '../../component-library';
import { Color, TextVariant } from '../../../helpers/constants/design-system';
import { DisclosureVariant } from './disclosure.constants';

const renderSummaryByType = (
  variant: DisclosureVariant,
  title: string,
  size?: string,
) => {
  switch (variant) {
    case DisclosureVariant.Arrow: {
      const textVariant =
        size === 'small' ? TextVariant.bodySm : TextVariant.bodyMd;

      return (
        <summary className="disclosure__summary is-arrow">
          {/* @ts-expect-error TODO: update prop type in design systems component */}
          <Text color={Color.primaryDefault} variant={textVariant}>
            {title}
          </Text>
          <Icon
            className="disclosure__summary--icon"
            // @ts-expect-error TODO: update prop types in design systems component
            color={Color.primaryDefault}
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
  isScrollToBottomOnOpen,
  title = null,
  size = 'normal',
  variant = DisclosureVariant.Default,
}: {
  children: JSX.Element[];
  isScrollToBottomOnOpen: boolean;
  size: string;
  title: string | null;
  variant: DisclosureVariant;
}) => {
  const disclosureFooterEl = useRef<HTMLDivElement | null>(null);
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
          {renderSummaryByType(variant, title)}

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

Disclosure.propTypes = {
  children: PropTypes.node.isRequired,
  isScrollToBottomOnOpen: PropTypes.bool,
  size: PropTypes.string,
  title: PropTypes.string,
  variant: PropTypes.string,
};

Disclosure.defaultProps = {
  isScrollToBottomOnOpen: false,
  size: 'normal',
  title: null,
  variant: DisclosureVariant.Default,
};

export default Disclosure;

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, IconName, IconSize, Text } from '../../component-library';
import { Color, TextVariant } from '../../../helpers/constants/design-system';
import { DisclosureVariant } from './disclosure.constants';

/**
 * @param {string} variant
 * @param {string} title
 * @param {string} size
 * @returns {JSX.Element}
 */
const renderSummaryByType = (variant, title, size) => {
  switch (variant) {
    case DisclosureVariant.Arrow: {
      const textVariant =
        size === 'small' ? TextVariant.bodySm : TextVariant.bodyMd;

      return (
        <summary className="disclosure__summary is-arrow">
          <Text color={Color.primaryDefault} variant={textVariant}>
            {title}
          </Text>
          <Icon
            className="disclosure__summary--icon"
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

const Disclosure = ({ children, title, size, variant }) => {
  const disclosureFooterEl = useRef(null);
  const [open, setOpen] = useState(false);

  const scrollToBottom = () => {
    disclosureFooterEl &&
      disclosureFooterEl.current &&
      disclosureFooterEl.current.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [open]);

  return (
    <div className="disclosure" onClick={() => setOpen((state) => !state)}>
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
  size: PropTypes.string,
  title: PropTypes.string,
  variant: PropTypes.string,
};

Disclosure.defaultProps = {
  size: 'normal',
  title: null,
  variant: DisclosureVariant.Default,
};

export default Disclosure;

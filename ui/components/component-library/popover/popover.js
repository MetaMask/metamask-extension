import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';

import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

export const Popover = ({ children, className, ...props }) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });
  return (
    <>
      <button type="button" ref={setReferenceElement}>
        Reference element
      </button>
      <Box
        className={classnames('mm-popover', className)}
        display={DISPLAY.INLINE_FLEX}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        alignItems={ALIGN_ITEMS.CENTER}
        borderColor={COLORS.BORDER_DEFAULT}
        borderRadius={BORDER_RADIUS.XL}
        padding={4}
        {...props}
      >
        {children}
      </Box>
      <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        Popper element
        <div ref={setArrowElement} style={styles.arrow} />
      </div>
    </>
  );
};

Popover.propTypes = {
  /**
   * The children to be rendered inside the Popover
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the Popover.
   */
  className: PropTypes.string,
  /**
   * Popover accepts all the props from Box
   */
  ...Box.propTypes,
};

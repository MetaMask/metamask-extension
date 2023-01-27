import React, { forwardRef, useState, forwardRef } from 'react';
import { usePopper } from 'react-popper';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';
import { Button } from '../button';

import {
  ALIGN_ITEMS,
  BACKGROUND_COLORS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';

export const Popover = forwardRef((props, ref) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });
  return (
    <>
      <div style={{ backgroundColor: 'red' }} ref={setReferenceElement}>
        <Button size={SIZES.LG}>Popper Trigger</Button>
      </div>

      <Box
        className={classnames('mm-popover tooltip', className)}
        display={DISPLAY.INLINE_FLEX}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        alignItems={ALIGN_ITEMS.CENTER}
        borderColor={COLORS.BORDER_DEFAULT}
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
        borderRadius={BORDER_RADIUS.XL}
        padding={4}
        {...props}
        // ref={ref}
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        {children} - This is the popper content
        <Box
          borderColor={COLORS.BORDER_DEFAULT}
          className={classnames('arrow')}
          ref={setArrowElement}
          style={styles.arrow}
          {...attributes.arrow}
        />
      </Box>
    </>
  );
});

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

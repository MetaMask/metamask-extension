import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import Box from '../../ui/box';

import { Button } from '../button';

import { Color } from '../../../helpers/constants/design-system';

export const Popover = ({ children, className, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleClickOutside = () => {
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div ref={setReferenceElement}>
        <Button onClick={() => setIsOpen(!isOpen)}>{children}</Button>
      </div>
      {isOpen && (
        <>
          {createPortal(
            <Box
              borderColor={Color.borderDefault}
              className={classnames('popover', { 'popover--open': isOpen })}
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              {children} - This is the popper content
              <Box
                borderColor={Color.borderDefault}
                className={classnames('arrow')}
                ref={setArrowElement}
                style={styles.arrow}
                {...attributes.arrow}
              />
            </Box>,
            document.body,
          )}

          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              background: 'red',
              opacity: '10%',
            }}
            onClick={handleClickOutside}
          />
        </>
      )}
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

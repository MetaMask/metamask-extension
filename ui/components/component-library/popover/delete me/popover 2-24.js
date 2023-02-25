import React, { useState } from 'react';
import { usePopper } from 'react-popper';

export const Popover = ({
  children,
  content,
  position = 'bottom',
  hasArrow = true,
  onClick = false,
  onHover = false,
  onFocus = false,
  matchWidth = false,
}) => {
  const [popperElement, setPopperElement] = useState(null);
  const [anchorElement, setAnchorElement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const popperOptions = {
    placement: position,
    modifiers: [
      {
        name: 'arrow',
        enabled: hasArrow,
        options: {
          element: '.popover-arrow',
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
        },
      },
    ],
  };

  const { styles, attributes } = usePopper(
    anchorElement,
    popperElement,
    popperOptions,
  );

  const handleClick = () => {
    if (onClick) {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const contentStyle = {
    width: matchWidth ? anchorElement?.clientWidth : 'min-content',
  };

  return (
    <>
      <div
        ref={setAnchorElement}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleClose}
        className="popover-anchor"
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className="popover-container"
        >
          <div className="popover-content" style={contentStyle}>
            {content}
          </div>
          {hasArrow && (
            <div
              className="popover-arrow"
              style={styles.arrow}
              {...attributes.arrow}
            />
          )}
        </div>
      )}
    </>
  );
};

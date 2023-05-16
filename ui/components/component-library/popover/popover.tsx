import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { PopoverPosition, PopoverProps, PopoverRole } from '.';

export const Popover = ({
  children,
  className = '',
  position = PopoverPosition.Auto,
  role = PopoverRole.Tooltip,
  hasArrow = false,
  matchWidth,
  preventOverflow = false,
  offset = [0, 8],
  flip = false,
  referenceHidden = true,
  referenceElement,
  isOpen,
  title,
  isPortal = true,
  arrowProps,
  escKeyClose,
  ...props
}: PopoverProps) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);

  // Define Popper options
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: position,
    modifiers: [
      {
        name: 'preventOverflow',
        enabled: position === PopoverPosition.Auto ? true : preventOverflow,
      },
      {
        name: 'flip',
        enabled: position === PopoverPosition.Auto ? true : flip,
      },
      {
        name: 'arrow',
        enabled: hasArrow,
        options: {
          element: arrowElement,
        },
      },
      {
        name: 'offset',
        options: {
          offset,
        },
      },
    ],
  });

  // Define width to match reference element or auto
  const contentStyle = {
    width: matchWidth ? referenceElement?.clientWidth : 'auto',
  };

  // Esc key press handler
  if (escKeyClose) {
    useEffect(() => {
      function handleEscKey(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          // Close the popover when the "Esc" key is pressed
          escKeyClose();
        }
      }

      document.addEventListener('keydown', handleEscKey);

      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }, [escKeyClose]);
  }

  const PopoverContent = (
    <Box
      borderColor={BorderColor.borderMuted}
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      role={role}
      className={classnames(
        'mm-popover',
        {
          'mm-popover--open': Boolean(isOpen),
          'mm-popover--reference-hidden': Boolean(referenceHidden),
        },
        className,
      )}
      ref={setPopperElement}
      {...attributes.popper}
      {...props}
      style={{ ...styles.popper, ...contentStyle, ...props.style }}
    >
      {children}
      {hasArrow && (
        <Box
          borderColor={BorderColor.borderMuted}
          className={classnames('mm-popover__arrow')}
          ref={setArrowElement}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          style={styles.arrow}
          {...attributes.arrow}
          {...arrowProps}
        />
      )}
    </Box>
  );

  return (
    <>
      {isPortal
        ? isOpen && createPortal(PopoverContent, document.body)
        : isOpen && PopoverContent}
    </>
  );
};

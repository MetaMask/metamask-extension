import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { Box } from '..';
import type { BoxProps, PolymorphicRef } from '../box';

import {
  PopoverProps,
  PopoverComponent,
  PopoverPosition,
  PopoverRole,
} from './popover.types';

export const Popover: PopoverComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
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
      isPortal = false,
      arrowProps,
      onClickOutside,
      onPressEscKey,
      ...props
    }: PopoverProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(
      null,
    );
    const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
    const popoverRef = React.useRef<HTMLElement | null>(null);

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

    // Esc key press
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close the popover when the "Esc" key is pressed
        if (onPressEscKey) {
          onPressEscKey();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        if (onClickOutside) {
          onClickOutside();
        }
      }
    };

    useEffect(() => {
      document.addEventListener('keydown', handleEscKey);
      if (isOpen) {
        document.addEventListener('click', handleClickOutside);
      } else {
        document.removeEventListener('click', handleClickOutside);
      }

      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.removeEventListener('click', handleClickOutside);
      };
    }, [onPressEscKey, isOpen, onClickOutside]);

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
        ref={(element: PolymorphicRef<C>) => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(element);
            } else {
              (ref as React.MutableRefObject<C | null>).current = element;
            }
          }
          setPopperElement(element);
          popoverRef.current = element;
        }}
        {...attributes.popper}
        {...(props as BoxProps<C>)}
        style={{ ...styles.popper, ...contentStyle, ...props.style }}
      >
        {children}
        {hasArrow && (
          <Box
            borderColor={BorderColor.borderMuted}
            className={classnames('mm-popover__arrow')}
            ref={setArrowElement}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            style={styles.arrow}
            {...attributes.arrow}
            {...(arrowProps as BoxProps<'div'>)}
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
  },
);

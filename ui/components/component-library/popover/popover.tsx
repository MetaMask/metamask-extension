import React, { useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { createPortal } from 'react-dom';
import { usePopper, Placement } from 'react-popper';
import classnames from 'classnames';
import {
  AlignItems,
  BorderRadius,
  Color,
  DISPLAY,
  JustifyContent,
  Size,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ButtonIcon, IconName, Text } from '..';
import { PopoverPosition, PopoverProps } from '.';

type PopoverPosition = Placement;

interface PopoverRef {
  closePopover: () => void;
}

export const Popover = forwardRef<PopoverRef, PopoverProps>(
  (
    {
      children,
      className,
      position = PopoverPosition.Auto,
      hasArrow = false,
      matchWidth,
      preventOverflow = false,
      offset = [0, 8],
      flip = false,
      referenceHidden = false,
      referenceElement,
      isOpen,
      title,
      onClose,
      closeButtonProps,
      onBack,
      backButtonProps,
      isPortal = false,
      ...props
    }: PopoverProps,
    ref: Ref<PopoverRef>,
  ) => {
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(
      null,
    );
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

    // Forwarding function to close the popover using the ref
    useImperativeHandle(ref, () => ({
      closePopover: () => {
        // Your close popover implementation here
        console.log('closePopover called');
      },
    }));

    const PopoverContent = (
      <Box
        borderColor={Color.borderDefault}
        borderRadius={BorderRadius.XL}
        backgroundColor={Color.backgroundDefault}
        padding={4}
        className={classnames(
          'mm-popover',
          {
            'mm-popover--open': isOpen,
            'mm-popover--reference-hidden': referenceHidden,
          },
          className,
        )}
        ref={setPopperElement}
        {...attributes.popper}
        {...props}
        style={{ ...styles.popper, ...contentStyle, ...props.style }}
      >
        {/* TODO: Replace with HeaderBase  Start */}
        <Box
          className="mm-popover__header"
          paddingLeft={onBack || onClose ? 8 : 0}
          paddingRight={onBack || onClose ? 8 : 0}
        >
          {onBack && (
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              className="mm-popover__header-button-back"
              size={Size.SM}
              ariaLabel="back"
              onClick={onBack}
              {...backButtonProps}
            />
          )}

          <Text
            variant={TextVariant.headingSm}
            className="mm-popover__header-title"
            textAlign={TEXT_ALIGN.CENTER}
          >
            {title}
          </Text>

          {onClose && (
            <ButtonIcon
              iconName={IconName.Close}
              className="mm-popover__header-button-close"
              size={Size.SM}
              ariaLabel="close"
              onClick={onClose}
              {...closeButtonProps}
            />
          )}
        </Box>
        {/* TODO: Replace with HeaderBase END */}
        {children}
        {hasArrow && (
          <Box
            borderColor={Color.borderDefault}
            className={classnames('mm-popover__arrow')}
            ref={setArrowElement}
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            style={styles.arrow}
            {...attributes.arrow}
          />
        )}
      </Box>
    );

    return (
      <>
        {isOpen && isPortal
          ? createPortal(PopoverContent, document.body)
          : PopoverContent}
      </>
    );
  },
);

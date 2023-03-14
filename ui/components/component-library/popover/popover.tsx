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
import { ButtonIcon, ICON_NAMES, Text } from '..';
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
      flip = false,
      referenceElement,
      isOpen,
      title,
      onClose,
      closeButtonProps,
      onBack,
      backButtonProps,
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
            offset: [0, 8],
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

    return (
      <>
        {isOpen &&
          createPortal(
            <Box
              borderColor={Color.borderDefault}
              borderRadius={BorderRadius.XL}
              backgroundColor={Color.backgroundDefault}
              padding={4}
              className={classnames(
                'mm-popover',
                { 'mm-popover--open': isOpen },
                className,
              )}
              ref={setPopperElement}
              style={{ ...styles.popper, ...contentStyle }}
              {...attributes.popper}
              {...props}
            >
              {/* TODO: Replace with HeaderBase  Start */}
              <Box
                className="mm-popover__header"
                paddingLeft={onBack || onClose ? 8 : 0}
                paddingRight={onBack || onClose ? 8 : 0}
              >
                {onBack && (
                  <ButtonIcon
                    iconName={ICON_NAMES.ARROW_LEFT}
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
                    iconName={ICON_NAMES.CLOSE}
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
            </Box>,
            document.body,
          )}
      </>
    );
  },
);

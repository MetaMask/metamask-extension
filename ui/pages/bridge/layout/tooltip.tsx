import React, { useState } from 'react';
import {
  Box,
  Popover,
  PopoverHeader,
  PopoverPosition,
  PopoverProps,
  Text,
} from '../../../components/component-library';
import {
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';

const Tooltip = React.forwardRef(
  ({
    children,
    title,
    triggerElement,
    disabled = false,
    ...props
  }: PopoverProps<'div'> & {
    triggerElement: React.ReactElement;
    disabled?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLSpanElement | null>(null);

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);
    const setBoxRef = (ref: HTMLSpanElement | null) => setReferenceElement(ref);

    return (
      <>
        <Box
          ref={setBoxRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {triggerElement}
        </Box>
        {!disabled && (
          <Popover
            position={PopoverPosition.Auto}
            referenceElement={referenceElement}
            isOpen={isOpen}
            onClickOutside={handleMouseLeave}
            style={{
              maxWidth: '240px',
              backgroundColor: 'var(--color-text-default)',
              paddingInline: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              transitionTimingFunction: 'linear',
              display: 'inherit',
            }}
            preventOverflow
            flip
            hasArrow
            {...props}
          >
            <PopoverHeader
              color={TextColor.infoInverse}
              textAlign={TextAlign.Center}
            >
              {title}
            </PopoverHeader>
            <Text
              justifyContent={JustifyContent.center}
              color={TextColor.infoInverse}
            >
              {children}
            </Text>
          </Popover>
        )}
      </>
    );
  },
);

export default Tooltip;

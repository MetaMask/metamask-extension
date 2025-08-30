import React, { useState } from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  PolymorphicRef,
  Popover,
  PopoverHeader,
  PopoverPosition,
  PopoverProps,
  Text,
} from '../../../components/component-library';
import {
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import Column from './column';

const Tooltip = React.forwardRef(
  (
    {
      children,
      title,
      triggerElement,
      disabled = false,
      onClose,
      iconName,
      style,
      ...props
    }: PopoverProps<'div'> & {
      triggerElement?: React.ReactElement;
      disabled?: boolean;
      onClose?: () => void;
      iconName?: IconName;
    },
    ref?: PolymorphicRef<'div'>,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLSpanElement | null>(null);

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);
    const setBoxRef = (newRef: HTMLSpanElement | null) =>
      setReferenceElement(newRef);

    return (
      <Box ref={ref}>
        <Box
          ref={setBoxRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          display={Display.Flex}
        >
          {triggerElement ??
            (iconName && (
              <Icon
                color={IconColor.iconAlternativeSoft}
                name={iconName}
                size={IconSize.Sm}
              />
            )) ?? (
              <Icon
                name={IconName.Info}
                color={IconColor.iconAlternativeSoft}
                size={IconSize.Sm}
              />
            )}
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
              ...style,
            }}
            preventOverflow
            flip
            hasArrow
            isPortal
            {...props}
          >
            <Column gap={4}>
              {title && (
                <PopoverHeader
                  color={TextColor.infoInverse}
                  textAlign={TextAlign.Center}
                  justifyContent={
                    onClose
                      ? JustifyContent.spaceBetween
                      : JustifyContent.center
                  }
                  onClose={onClose}
                  childrenWrapperProps={{ style: { whiteSpace: 'nowrap' } }}
                >
                  {title}
                </PopoverHeader>
              )}
              <Text
                justifyContent={JustifyContent.center}
                color={TextColor.infoInverse}
              >
                {children}
              </Text>
            </Column>
          </Popover>
        )}
      </Box>
    );
  },
);

export default Tooltip;

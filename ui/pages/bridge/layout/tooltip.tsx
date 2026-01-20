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
  TextVariant,
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
                color={IconColor.iconAlternative}
                name={iconName}
                size={IconSize.Sm}
              />
            )) ?? (
              <Icon
                name={IconName.Info}
                color={IconColor.iconAlternative}
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
              maxWidth: '264px',
              backgroundColor: 'var(--color-text-default)',
              paddingInline: '12px',
              paddingTop: '12px',
              paddingBottom: '12px',
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
            <Column gap={2}>
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
                variant={TextVariant.bodySm}
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

import React, { useState } from 'react';
import {
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  PopoverProps,
  Text,
} from '../../../components/component-library';
import {
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Column from './column';

const Tooltip = React.forwardRef(
  ({ children, title, ...props }: PopoverProps<'div'>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLSpanElement | null>(null);

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);
    const setBoxRef = (ref: HTMLSpanElement | null) => setReferenceElement(ref);

    return (
      <>
        <Icon
          color={IconColor.iconMuted}
          name={IconName.Question}
          size={IconSize.Sm}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          ref={setBoxRef}
        />
        <Popover
          position={PopoverPosition.TopEnd}
          referenceElement={referenceElement}
          isOpen={isOpen}
          onClickOutside={handleMouseLeave}
          style={{
            width: '240px',
            backgroundColor: 'var(--color-text-default)',
            paddingInline: '16px',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}
          offset={[16, 16]}
          preventOverflow
          matchWidth
          hasArrow
          {...props}
        >
          <Column gap={4}>
            <Text
              variant={TextVariant.headingSm}
              color={TextColor.infoInverse}
              textAlign={TextAlign.Center}
            >
              {title}
            </Text>
            <Text color={TextColor.infoInverse}>{children}</Text>
          </Column>
        </Popover>
      </>
    );
  },
);

export default Tooltip;

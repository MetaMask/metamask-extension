import React, {
  useCallback,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import classnames from 'clsx';
import { Text, type TextProps } from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../component-library';
import { INFO_POPOVER_STYLE } from '../../musd/info-popover';

export type TooltipTextProps = Omit<TextProps, 'children' | 'asChild'> & {
  /** The visible text that is underlined and acts as the tooltip trigger. */
  text: string;
  /** The tooltip body, shown while the text is hovered or focused. */
  children: ReactNode;
  position?: PopoverPosition;
  /** Merged over the shared info popover panel styles (e.g. maxWidth, padding). */
  popoverStyle?: CSSProperties;
  'data-testid'?: string;
};

/**
 * Underlined text that reveals a tooltip on hover or keyboard focus.
 */
export function TooltipText({
  children,
  text,
  position = PopoverPosition.BottomEnd,
  popoverStyle,
  className,
  'data-testid': dataTestId,
  ...textProps
}: Readonly<TooltipTextProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const popoverId = useId();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Text
        {...textProps}
        asChild
        className={classnames(
          'underline decoration-dotted underline-offset-4',
          className,
        )}
      >
        <span
          ref={setReferenceElement}
          tabIndex={0}
          aria-describedby={isOpen ? popoverId : undefined}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onFocus={handleOpen}
          onBlur={handleClose}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        >
          {text}
        </span>
      </Text>
      <Popover
        id={popoverId}
        isOpen={isOpen}
        position={position}
        referenceElement={referenceElement}
        hasArrow
        onPressEscKey={handleClose}
        isPortal
        style={{ ...INFO_POPOVER_STYLE, ...popoverStyle }}
        data-testid={dataTestId}
      >
        {children}
      </Popover>
    </>
  );
}

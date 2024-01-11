import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { debounce } from 'lodash';
import { I18nContext } from '../../../../contexts/i18n';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import type { StyleUtilityProps } from '../../../component-library/box';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';

interface ContentProps extends StyleUtilityProps {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Is true when all content has been displayed
   */
  hasViewedContent?: boolean;
  /**
   * Setter function for hasViewedContent
   */
  setHasViewedContent?: Dispatch<SetStateAction<boolean>>;
}

const ScrollToBottom = ({
  children,
  hasViewedContent,
  setHasViewedContent,
  ...props
}: ContentProps) => {
  const t = useContext(I18nContext);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const containerRef = React.createRef<HTMLSpanElement>();
  const bottomRef = React.createRef<HTMLDivElement>();

  const handleDebouncedScroll = debounce((target) => {
    const isScrollable = target.scrollHeight > target.clientHeight;
    if (!isScrollable) {
      return;
    }

    const isAtBottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;

    setShowScrollDown(!isAtBottom);

    if (isAtBottom && setHasViewedContent) {
      setHasViewedContent(true);
    }
  }, 100);

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    handleDebouncedScroll(e.target);
  };

  const handleButtonClick = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;
    if (!currentContainerRef) {
      return;
    }

    const isScrollable =
      currentContainerRef.scrollHeight > currentContainerRef.clientHeight;

    isScrollable ? setShowScrollDown(isScrollable) : setHasViewedContent(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      width={BlockSize.Full}
      height={BlockSize.Full}
      style={{
        /** As a flex child, this ensures the element stretches the full available space without overflowing */
        minHeight: '0',
        /**
         * This is for the scroll button. If we placed position: relative on the element below, with overflow: 'auto',
         * the button would be positioned absolute to the entire content relative the scroll container. Thus, it would
         * not stick to the bottom of the scroll container.
         */
        position: 'relative',
      }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.Full}
        height={BlockSize.Full}
        onScroll={handleScroll}
        ref={containerRef}
        style={{ overflow: 'auto' }}
        {...props}
      >
        {children}

        <div ref={bottomRef} style={{ height: '1px' }}></div>
        {showScrollDown && (
          <ButtonIcon
            onClick={handleButtonClick}
            iconName={IconName.Arrow2Down}
            ariaLabel={t('scrollDown')}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.full}
            color={IconColor.primaryDefault}
            display={Display.Flex}
            size={ButtonIconSize.Md}
            style={{
              bottom: '12px',
              position: 'absolute',
              margin: '0 auto',
              left: '0',
              right: '0',
              height: '36px',
              width: '36px',
              boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
              /** arbitrary value to ensure bottom is above content */
              zIndex: '201',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScrollToBottom;

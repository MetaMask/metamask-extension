import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../components/component-library';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useScrollRequired } from '../../../../../hooks/useScrollRequired';
import { updateConfirm } from '../../../../../ducks/confirm/confirm';

type ContentProps = {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
};

const ScrollToBottom = ({ children }: ContentProps) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const {
    hasScrolledToBottom,
    isScrollable,
    isScrolledToBottom,
    onScroll,
    scrollToBottom,
    ref,
  } = useScrollRequired([]);

  useEffect(() => {
    dispatch(
      updateConfirm({
        isScrollToBottomNeeded: isScrollable && !hasScrolledToBottom,
      }),
    );
  }, [isScrollable, hasScrolledToBottom]);

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
        onScroll={onScroll}
        ref={ref}
        style={{ overflow: 'auto' }}
      >
        {children}

        {isScrollable && !isScrolledToBottom && (
          <ButtonIcon
            className={'confirm-scroll-to-bottom__button'}
            onClick={scrollToBottom}
            iconName={IconName.Arrow2Down}
            ariaLabel={t('scrollDown')}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.full}
            color={IconColor.primaryDefault}
            display={Display.Flex}
            size={ButtonIconSize.Md}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScrollToBottom;

import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { usePrevious } from '../../../../../hooks/usePrevious';
import { useScrollRequired } from '../../../../../hooks/useScrollRequired';
import { updateConfirm } from '../../../../../ducks/confirm/confirm';
import { currentConfirmationSelector } from '../../../selectors';

type ContentProps = {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
};

const ScrollToBottom = ({ children }: ContentProps) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const previousId = usePrevious(currentConfirmation?.id);

  const {
    hasScrolledToBottom,
    isScrollable,
    isScrolledToBottom,
    onScroll,
    scrollToBottom,
    setHasScrolledToBottom,
    ref,
  } = useScrollRequired([currentConfirmation?.id]);

  /**
   * Scroll to the top of the page when the confirmation changes. This happens
   * when we navigate through different confirmations. Also, resets hasScrolledToBottom
   */
  useEffect(() => {
    if (previousId === currentConfirmation?.id) {
      return;
    }

    setHasScrolledToBottom(false);

    const scrollTo = (ref?.current as null | HTMLDivElement)?.scrollTo;
    if (typeof scrollTo === 'function') {
      (ref?.current as null | HTMLDivElement)?.scrollTo(0, 0);
    }
  }, [currentConfirmation?.id, previousId, setHasScrolledToBottom]);

  useEffect(() => {
    dispatch(
      updateConfirm({
        isScrollToBottomNeeded: isScrollable && !hasScrolledToBottom,
      }),
    );
  }, [isScrollable, hasScrolledToBottom]);

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      width={BlockSize.Full}
      height={BlockSize.Full}
      style={{
        /** As a flex child, this ensures the element stretches the full available space without overflowing */
        minHeight: '0',
        overflow: 'hidden',
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
        paddingLeft={4}
        paddingRight={4}
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

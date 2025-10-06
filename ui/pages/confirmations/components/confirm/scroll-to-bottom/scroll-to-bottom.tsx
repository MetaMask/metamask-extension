import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../components/component-library';
import { I18nContext } from '../../../../../contexts/i18n';

import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { usePrevious } from '../../../../../hooks/usePrevious';
import { useScrollRequired } from '../../../../../hooks/useScrollRequired';
import { useConfirmContext } from '../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import { useUnapprovedTransaction } from '../../../hooks/transactions/useUnapprovedTransaction';
import { useApprovalRequest } from '../../../hooks/useApprovalRequest';

type ContentProps = {
  /**
   * Elements that go in the page content section
   */
  children: React.ReactNode | React.ReactNode[];
};

const ScrollToBottom = ({ children }: ContentProps) => {
  const t = useContext(I18nContext);
  const { setIsScrollToBottomCompleted } = useConfirmContext();
  const approvalRequest = useApprovalRequest();
  const transactionMeta = useUnapprovedTransaction();
  const previousId = usePrevious(approvalRequest?.id);
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const {
    hasScrolledToBottom,
    isScrollable,
    isScrolledToBottom,
    onScroll,
    scrollToBottom,
    setHasScrolledToBottom,
    ref,
  } = useScrollRequired([approvalRequest?.id, showAdvancedDetails], {
    offsetPxFromBottom: 0,
  });

  const showScrollToBottom =
    isScrollable && !isScrolledToBottom && !transactionMeta;

  /**
   * Scroll to the top of the page when the confirmation changes. This happens
   * when we navigate through different confirmations. Also, resets hasScrolledToBottom
   */
  useEffect(() => {
    if (previousId === approvalRequest?.id) {
      return;
    }

    const currentRef = ref?.current as null | HTMLDivElement;
    if (!currentRef) {
      return;
    }

    if (typeof currentRef.scrollTo === 'function') {
      currentRef.scrollTo(0, 0);
    }

    setHasScrolledToBottom(false);
  }, [approvalRequest?.id, previousId, ref?.current]);

  useEffect(() => {
    if (transactionMeta) {
      setIsScrollToBottomCompleted(true);
      return;
    }

    setIsScrollToBottomCompleted(!isScrollable || hasScrolledToBottom);
  }, [isScrollable, hasScrolledToBottom, transactionMeta]);

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
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

        {showScrollToBottom && (
          <ButtonIcon
            className="confirm-scroll-to-bottom__button"
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

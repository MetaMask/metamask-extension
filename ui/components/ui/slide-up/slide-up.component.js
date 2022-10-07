import React from 'react';
import ReactDOM from 'react-dom';
import { PropTypes } from 'prop-types';

import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';

import Box from '../box';
import {
  ALIGN_ITEMS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

const modalRoot = document.querySelector('#popover-content');

const defaultHeaderProps = {
  padding: [4, 4, 4],
  display: 'flex',
  flexDirection: FLEX_DIRECTION.ROW,
};

const defaultContentProps = {
  display: 'flex',
  flexDirection: FLEX_DIRECTION.COLUMN,
  justifyContent: JUSTIFY_CONTENT.FLEX_START,
  alignItems: ALIGN_ITEMS.STRETCH,
};

const defaultFooterProps = {
  display: 'flex',
  justifyContent: JUSTIFY_CONTENT.SPACE_BETWEEN,
  padding: [4, 6, 6],
};

const SlideUp = ({
  open,
  children,
  footer,
  header,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  headerProps = defaultHeaderProps,
  contentProps = defaultContentProps,
  footerProps = defaultFooterProps,
}) => {
  const modal = (
    <CSSTransition in={open} timeout={1000} classNames="slide-up" unmountOnExit>
      <div className="slide-up-modal-overlay" id="slide-up-modal-overlay">
        <Box className={classnames('slide-up-modal', className)}>
          <Box>
            {header ? (
              <Box
                className={classnames(
                  'slide-up-modal__header',
                  headerClassName,
                )}
                {...{ ...defaultFooterProps, ...headerProps }}
              >
                {header}
              </Box>
            ) : null}
            {children ? (
              <Box
                className={classnames(
                  'slide-up-modal__content',
                  contentClassName,
                )}
                {...{ ...defaultContentProps, ...contentProps }}
              >
                {children}
              </Box>
            ) : null}
          </Box>
          {footer ? (
            <Box
              className={classnames('slide-up-modal__footer', footerClassName)}
              {...{ ...defaultFooterProps, ...footerProps }}
            >
              {footer}
            </Box>
          ) : null}
        </Box>
      </div>
    </CSSTransition>
  );

  return ReactDOM.createPortal(modal, modalRoot);
};

SlideUp.propTypes = {
  /**
   * Boolean prop to render slide up animation
   */
  open: PropTypes.bool,
  /**
   * Show header content could be react child or text
   */
  header: PropTypes.node,
  /**
   * Show children content could be react child or text
   */
  children: PropTypes.node,
  /**
   * Show footer content could be react child or text
   */
  footer: PropTypes.node,
  /**
   * Add custom CSS class for footer
   */
  footerClassName: PropTypes.string,
  /**
   * closeModal handler
   */
  onClose: PropTypes.func,
  /**
   * Add custom CSS class for content
   */
  contentClassName: PropTypes.string,
  /**
   * Add custom CSS class
   */
  className: PropTypes.string,
  /**
   * Box props for the header
   */
  headerProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the content
   */
  contentProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the footer
   */
  footerProps: PropTypes.shape({ ...Box.propTypes }),
};

export default SlideUp;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonIcon, BUTTON_ICON_SIZES, ICON_NAMES, Text } from '..';

import Box from '../../ui/box';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  DISPLAY,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

export const Modal = ({ isOpen, onClose, scrim, className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
    onClose && onClose();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen]);

  if (!isModalOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <Box
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      className={classnames('mm-modal-overlay', {
        'mm-modal-overlay--scrim': scrim,
      })}
      backgroundColor={BackgroundColor.overlayDefault}
      onClick={handleClose}
    >
      <Box
        className={classnames(
          'mm-modal',

          className,
        )}
        onClick={handleModalClick}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.XL}
        padding={4}
      >
        <Box display={DISPLAY.FLEX} className="mm-modal-header">
          <ButtonIcon
            className="mm-modal-header__back"
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            onClick={handleClose}
            ariaLabel="Close"
          />
          <Text
            className="mm-modal-header__title"
            variant={TextVariant.headingMd}
          >
            Hello World
          </Text>
          <ButtonIcon
            className="mm-modal-header__close"
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            onClick={handleClose}
            ariaLabel="Close"
          />
        </Box>
        <div className="mm-modal-body">{children}</div>
      </Box>
    </Box>,
    document.body,
  );
};

Modal.propTypes = {
  /**
   * TODO
   */
  scrim: PropTypes.bool,
  /**
   * TODO
   */
  isOpen: PropTypes.any,
  /**
   * TODO
   */
  onClose: PropTypes.any,
  /**
   * The children to be rendered inside the ButtonBase
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the ButtonBase.
   */
  className: PropTypes.string,
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};

import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

const modalRoot = document.querySelector('#custom-root');

const SlideUp = ({ open, closeModal, children }) => {
  const handleClick = (e) => {
    if (e.target.id === 'slide-up-modal-overlay') {
      closeModal();
    }
  };

  const modal = (
    <ReactCSSTransitionGroup
      transitionAppear={open}
      transitionAppearTimeout={500}
      transitionLeaveTimeout={500}
      transitionName="slide-up"
    >
      <div
        className="slide-up-modal-overlay"
        id="slide-up-modal-overlay"
        onClick={handleClick}
      >
        <div className="slide-up-modal">{children}</div>
      </div>
    </ReactCSSTransitionGroup>
  );

  return ReactDOM.createPortal(modal, modalRoot);
};

export default SlideUp;

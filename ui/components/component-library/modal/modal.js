import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export const Modal = ({ isOpen, onClose, children }) => {
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
    if (isOpen) {
      setIsModalOpen(true);
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', handleKeyDown);
    } else {
      setIsModalOpen(false);
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isModalOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={handleModalClick}>
        <div className="modal-header">
          <button className="modal-close" onClick={handleClose}>
            <span aria-hidden="true">&times;</span>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

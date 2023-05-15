import React from 'react';
import PropTypes from 'prop-types';

const ConfirmPageContainerWarning = (props) => {
  const { warning } = props;
  return (
    <>
      {typeof warning === 'string' ? (
        <div className="confirm-page-container-warning">
          <i className="fa fa-info-circle confirm-page-container-warning__icon" />
          <div className="confirm-page-container-warning__warning">
            {warning}
          </div>
        </div>
      ) : (
        warning
      )}
    </>
  );
};

ConfirmPageContainerWarning.propTypes = {
  warning: PropTypes.string || PropTypes.node,
};

export default ConfirmPageContainerWarning;

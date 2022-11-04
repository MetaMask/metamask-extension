import React from 'react';
import PropTypes from 'prop-types';

const ConfirmPageContainerWarning = (props) => {
  return (
    <div className="confirm-page-container-warning">
      <i className="fa fa-info-circle confirm-page-container-warning__icon" />
      <div className="confirm-page-container-warning__warning">
        {props.warning}
      </div>
    </div>
  );
};

ConfirmPageContainerWarning.propTypes = {
  warning: PropTypes.string,
};

export default ConfirmPageContainerWarning;

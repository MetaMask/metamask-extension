import React from 'react';
import PropTypes from 'prop-types';
import { Icon, ICON_NAMES } from '../../../../component-library';

const ConfirmPageContainerWarning = (props) => {
  return (
    <div className="confirm-page-container-warning">
      <Icon
        name={ICON_NAMES.INFO}
        className="confirm-page-container-warning__icon"
      />
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

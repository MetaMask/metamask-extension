import React from 'react';
import PropTypes from 'prop-types';
import { Icon, IconName } from '../../../../component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';

const ConfirmPageContainerWarning = (props) => {
  return (
    <div className="confirm-page-container-warning">
      <Icon
        name={IconName.Info}
        color={IconColor.warningDefault}
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

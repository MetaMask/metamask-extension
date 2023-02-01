import React from 'react';
import PropTypes from 'prop-types';

const SystemNotification = ({ descriptionText }) => {
  return (
    <div className="system-notification">
      <div className="system-notification__description">{descriptionText}</div>
    </div>
  )
}

SystemNotification.propTypes = {
  /**

  The notification description.
  */
  descriptionText: PropTypes.node.isRequired,
  
}
export default SystemNotification;
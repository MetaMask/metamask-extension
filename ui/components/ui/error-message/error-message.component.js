import React from 'react';
import PropTypes from 'prop-types';
import { BannerAlert, BannerType } from '../../component-library'; 
const BannerAlertMessage = (props, context) => {
  const { errorMessage, errorKey } = props;
  const error = errorKey ? context.t(errorKey) : errorMessage;

  return (
    <BannerAlert
      type={BannerType.Error} 
      icon={<Icon name={IconName.Warning} size={IconSize.Sm} color={IconColor.errorDefault} />} 
    >
      {error}
    </BannerAlert>
  );
};

BannerAlertMessage.propTypes = {
  errorMessage: PropTypes.string,
  errorKey: PropTypes.string,
};

BannerAlertMessage.contextTypes = {
  t: PropTypes.func,
};

export default BannerAlertMessage;

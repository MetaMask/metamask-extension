import React from 'react';

import useCurrentConfirmation from '../../../hooks/useCurrentConfirmation';
import NetworkChangeToastInner from './network-change-toast-inner';

// The component has been broken into NetworkChangeToast and NetworkChangeToastInner
// to suffice need of old and re-designed confirmation pages.
// These can be merged once we get rid of old confirmation pages.
const NetworkChangeToast = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  return <NetworkChangeToastInner confirmation={currentConfirmation} />;
};

export default NetworkChangeToast;

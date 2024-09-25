import React from 'react';

import useCurrentConfirmation from '../../../hooks/useCurrentConfirmation';
import NetworkChangeToastLegacy from './network-change-toast-legacy';

// The component has been broken into NetworkChangeToast and NetworkChangeToastLegacy
// to suffice need of old and re-designed confirmation pages.
// These can be merged once we get rid of old confirmation pages.
const NetworkChangeToast = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  return <NetworkChangeToastLegacy confirmation={currentConfirmation} />;
};

export default NetworkChangeToast;

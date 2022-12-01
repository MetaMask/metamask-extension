import React from 'react';
import { useDispatch } from 'react-redux';

import { hideModal } from '../../../store/actions';

import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';

export default function AddNetworkModal() {
  const dispatch = useDispatch();

  return (
    <NetworksForm
      navigateUponSuccess={false}
      addNewNetwork
      networksToRender={[]}
      cancelCallback={() =>
        dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }))
      }
      submitCallback={() =>
        dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }))
      }
    />
  );
}

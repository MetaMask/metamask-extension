import React from 'react';
import { useDispatch } from 'react-redux';

import { hideModal } from '../../../store/actions';

import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';

export default function AddNetworkModal() {
  const dispatch = useDispatch();
  const closeCallback = () =>
    dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }));

  return (
    <NetworksForm
      addNewNetwork
      networksToRender={[]}
      cancelCallback={closeCallback}
      submitCallback={closeCallback}
    />
  );
}

import React, { useEffect } from 'react';
import { select } from '@storybook/addon-knobs';

import ConfirmEncryptionPublicKey from '.';
import { store } from '../../../.storybook/preview';
import { updateMetamaskState } from '../../store/actions';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  
  const state = store.getState();
  const options = []
  const { identities, unapprovedEncryptionPublicKeyMsgs } = state.metamask;
  Object.keys(identities).forEach(function (key) {
    options.push({
      label: identities[key].name,
      name: identities[key].name,
      address: key,
    });
  });
  const account = select('Account', options, options[0]);

  useEffect(() => {
    unapprovedEncryptionPublicKeyMsgs["7786962153682822"].msgParams = account.address
    store.dispatch(
      updateMetamaskState({ unapprovedEncryptionPublicKeyMsgs: unapprovedEncryptionPublicKeyMsgs }),
    );

  }, [account]);
  
  return children;

};

export const ConfirmEncryption = () => {
  store.dispatch(updateMetamaskState({ unapprovedTxs: {} }))
  return (
    <PageSet>
       <ConfirmEncryptionPublicKey/> 
    </PageSet>
  );
};

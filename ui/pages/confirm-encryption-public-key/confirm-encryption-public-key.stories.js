import React, { useEffect, useState } from 'react';
import { select, text } from '@storybook/addon-knobs';

import ConfirmEncryptionPublicKey from '.';
import { store } from '../../../.storybook/preview';
import testData from '../../../.storybook/test-data';
import { updateMetamaskState } from '../../store/actions';

export default {
  title: 'Encryption',
};

const PageSet = ({ children }) => {
  
  const state = store.getState();
  const options = []
  const { identities,cachedBalances } = state.metamask;
  Object.keys(identities).forEach(function (key) {
    options.push({
      label: identities[key].name,
      name: identities[key].name,
      address: key,
    });
  });
  const balance = text('Balance', '0');
  const account = select('Account', options, options[0]);

  useEffect(() => {
    cachedBalances['0x3']['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'] = balance
    store.dispatch(
      updateMetamaskState({ cachedBalances:cachedBalances }),
    );
  }, [balance]);

  useEffect(() => {
    identities['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'].name = account.name
    store.dispatch(
      updateMetamaskState({ identities:identities }),
    );
  }, [account]);
  
  return children;

};

export const ConfirmEncryption = () => {

  return (
    <PageSet>
       <ConfirmEncryptionPublicKey/> 
    </PageSet>
  );
};

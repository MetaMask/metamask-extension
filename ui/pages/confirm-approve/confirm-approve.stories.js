/* eslint-disable react/prop-types */

import React, { useEffect, useState } from 'react';
import { object, number, select, text} from '@storybook/addon-knobs';
import ConfirmApprove from './index'
import { updateMetamaskState } from '../../store/actions';
import { store } from '../../../.storybook/preview'

export default {
  title: 'Confirm - Approve',
};

export const Approve = ({
  
}) => {
  const domainMetadata = object("Domain MetaData", {
    "http://localhost:9011": {
      "host": "localhost:9011",
      "icon": "http://localhost:9011/metamask-fox.svg",
      "lastUpdated": 1601297981541,
      "name": "E2E Test Dapp"
    }
  });

  useEffect(() => {
    console.log('UseEffect')
    store.dispatch(updateMetamaskState({
      domainMetadata: domainMetadata
    }))
  }, [domainMetadata]) 

  return (
  <ConfirmApprove
    name={name}
  />
);
}
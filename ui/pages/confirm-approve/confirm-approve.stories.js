/* eslint-disable react/prop-types */

import React, { useEffect, useState } from 'react';
import { object, number, select, text} from '@storybook/addon-knobs';
import ConfirmApprove from './index'
import { updateMetamaskState } from '../../store/actions';
import { store } from '../../../.storybook/preview'
import { Route, useHistory, useRouteMatch } from 'react-router-dom'

export default {
  title: 'Confirm - Approve',
};

const PageSet = ({ children }) => {
  const match = useRouteMatch()
  match.params.id = 1906703652727041
  return (
    children
  )
}

export const Approve = () => {
  const domainMetadata = object("Domain MetaData", {
    "https://metamask.github.io": {
      "name": "E2E Test Dapp",
      "icon": "https://metamask.github.io/test-dapp/metamask-fox.svg",
      "lastUpdated": 1620723443380,
      "host": "metamask.github.io"
    }
  });
  
  useEffect(() => {
    store.dispatch(updateMetamaskState({
      domainMetadata: domainMetadata
    }))
  }, [domainMetadata]) 

  return (
    <PageSet>
      <ConfirmApprove/>
    </PageSet>

  )
}
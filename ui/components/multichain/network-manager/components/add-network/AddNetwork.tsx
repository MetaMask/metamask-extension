import { UpdateNetworkFields } from '@metamask/network-controller';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { NetworksForm } from '../../../../../pages/settings/networks-tab/networks-form/networks-form';
import { useNetworkFormState } from '../../../../../pages/settings/networks-tab/networks-form/networks-form-state';

type AddNetworkProps = {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  network: UpdateNetworkFields;
  networkType?: 'custom' | 'test';
};

export const AddNetwork: React.FC<AddNetworkProps> = ({
  networkFormState,
  network,
  networkType,
}) => {
  const history = useHistory();
  return (
    <NetworksForm
      toggleNetworkMenuAfterSubmit={false}
      onComplete={() => {
        history.push('/');
      }}
      networkFormState={networkFormState}
      existingNetwork={network}
      networkType={networkType}
      onRpcAdd={() => {
        history.push('/add-rpc');
      }}
      onBlockExplorerAdd={() => {
        history.push('/add-explorer-url');
      }}
    />
  );
};

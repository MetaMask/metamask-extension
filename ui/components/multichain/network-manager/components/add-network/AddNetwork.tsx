import { UpdateNetworkFields } from '@metamask/network-controller';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { NetworksForm } from '../../../../../pages/settings/networks-tab/networks-form/networks-form';
import { useNetworkFormState } from '../../../../../pages/settings/networks-tab/networks-form/networks-form-state';

type AddNetworkProps = {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  network: UpdateNetworkFields;
  isEdit?: boolean;
};

export const AddNetwork: React.FC<AddNetworkProps> = ({
  networkFormState,
  network,
  isEdit = false,
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
      onRpcAdd={() => {
        history.push(isEdit ? '/edit-rpc' : '/add-rpc');
      }}
      onBlockExplorerAdd={() => {
        history.push(isEdit ? '/edit-explorer-url' : '/add-explorer-url');
      }}
    />
  );
};

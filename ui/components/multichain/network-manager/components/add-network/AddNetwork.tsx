import { UpdateNetworkFields } from '@metamask/network-controller';
import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
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
  const navigate = useNavigate();
  return (
    <NetworksForm
      toggleNetworkMenuAfterSubmit={false}
      onComplete={() => {
        console.log(`onComplete pushing to /?tab=custom-networks`);
        navigate('/?tab=custom-networks');
      }}
      onEdit={() => {
        navigate('/edit');
      }}
      networkFormState={networkFormState}
      existingNetwork={network}
      onRpcAdd={() => {
        navigate(isEdit ? '/edit-rpc' : '/add-rpc');
      }}
      onBlockExplorerAdd={() => {
        navigate(isEdit ? '/edit-explorer-url' : '/add-explorer-url');
      }}
    />
  );
};

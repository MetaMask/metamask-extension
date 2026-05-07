import { UpdateNetworkFields } from '@metamask/network-controller';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [, setSearchParams] = useSearchParams();
  return (
    <NetworksForm
      toggleNetworkMenuAfterSubmit={false}
      usePageFooterStyle={true}
      onComplete={() => {
        setSearchParams({});
      }}
      onEdit={() => {
        setSearchParams({ view: 'edit' });
      }}
      networkFormState={networkFormState}
      existingNetwork={network}
      onRpcAdd={() => {
        setSearchParams({ view: isEdit ? 'edit-rpc' : 'add-rpc' });
      }}
      onBlockExplorerAdd={() => {
        setSearchParams({
          view: isEdit ? 'edit-explorer-url' : 'add-explorer-url',
        });
      }}
    />
  );
};

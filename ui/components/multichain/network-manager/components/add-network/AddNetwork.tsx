import { UpdateNetworkFields } from '@metamask/network-controller';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  NetworksForm,
  type NetworksFormChainlist,
} from '../../../networks-form/networks-form';
import { useNetworkFormState } from '../../../networks-form/networks-form-state';

type AddNetworkProps = {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  network: UpdateNetworkFields;
  isEdit?: boolean;
  chainlist?: NetworksFormChainlist;
};

export const AddNetwork = ({
  networkFormState,
  network,
  isEdit = false,
  chainlist,
}: AddNetworkProps) => {
  const [, setSearchParams] = useSearchParams();
  return (
    <NetworksForm
      toggleNetworkMenuAfterSubmit={false}
      usePageFooterStyle={true}
      onComplete={() => {
        if (!isEdit) {
          networkFormState.clear();
        }
        setSearchParams({});
      }}
      onEdit={() => {
        setSearchParams({ view: 'edit' });
      }}
      networkFormState={networkFormState}
      existingNetwork={network}
      chainlist={chainlist}
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

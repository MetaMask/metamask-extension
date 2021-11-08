import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import NetworksForm from '../networks-form';
import NetworksList from '../networks-list';
import { getProvider } from '../../../../selectors';

const NetworksTabContent = ({
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  const provider = useSelector(getProvider);

  return (
    <>
      <NetworksList
        networkDefaultedToProvider={networkDefaultedToProvider}
        networkIsSelected={networkIsSelected}
        networksToRender={networksToRender}
        selectedRpcUrl={selectedNetwork.rpcUrl}
      />
      {shouldRenderNetworkForm ? (
        <NetworksForm
          isCurrentRpcTarget={provider.rpcUrl === selectedNetwork.rpcUrl}
          networksToRender={networksToRender}
          selectedNetwork={selectedNetwork}
        />
      ) : null}
    </>
  );
};
NetworksTabContent.propTypes = {
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
};

export default NetworksTabContent;

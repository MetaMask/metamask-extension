import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import NetworkForm from '../network-form';
import NetworkList from '../network-list';
import { getProvider } from '../../../../selectors';

const NetworkTabContent = ({
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  const provider = useSelector(getProvider);

  return (
    <>
      <NetworkList
        networkDefaultedToProvider={networkDefaultedToProvider}
        networkIsSelected={networkIsSelected}
        networksToRender={networksToRender}
        selectedRpcUrl={selectedNetwork.rpcUrl}
      />
      {shouldRenderNetworkForm ? (
        <NetworkForm
          isCurrentRpcTarget={provider.rpcUrl === selectedNetwork.rpcUrl}
          networksToRender={networksToRender}
          selectedNetwork={selectedNetwork}
        />
      ) : null}
    </>
  );
};
NetworkTabContent.propTypes = {
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
};

export default NetworkTabContent;

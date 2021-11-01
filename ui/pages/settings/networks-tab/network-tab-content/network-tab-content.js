import React from 'react';
import PropTypes from 'prop-types';
import NetworkForm from '../network-form';
import NetworkList from '../network-list';

const NetworkTabContent = ({
  isFullScreen,
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  providerType,
  providerUrl,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  return (
    <>
      <NetworkList
        isFullScreen={isFullScreen}
        networkDefaultedToProvider={networkDefaultedToProvider}
        networkIsSelected={networkIsSelected}
        networksToRender={networksToRender}
        providerType={providerType}
        providerUrl={providerUrl}
        selectedRpcUrl={selectedNetwork.rpcUrl}
      />
      {shouldRenderNetworkForm ? (
        <NetworkForm
          isCurrentRpcTarget={providerUrl === selectedNetwork.rpcUrl}
          networksToRender={networksToRender}
          selectedNetwork={selectedNetwork}
        />
      ) : null}
    </>
  );
};
NetworkTabContent.propTypes = {
  isFullScreen: PropTypes.bool.isRequired,
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  providerType: PropTypes.string,
  providerUrl: PropTypes.string,
  selectedNetwork: PropTypes.object,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
};

export default NetworkTabContent;

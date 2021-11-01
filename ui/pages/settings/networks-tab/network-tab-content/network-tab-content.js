import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import NetworkForm from '../network-form';
import NetworkList from '../network-list';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';

const NetworkTabContent = ({
  setRpcTarget,
  showConfirmDeleteNetworkModal,
  setSelectedSettingsRpcUrl,
  selectedNetwork,
  editRpc,
  providerUrl,
  providerType,
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  isFullScreen,
  shouldRenderNetworkForm,
}) => {
  const history = useHistory();

  return (
    <>
      <NetworkList
        networksToRender={networksToRender}
        selectedNetwork={selectedNetwork}
        setSelectedSettingsRpcUrl={setSelectedSettingsRpcUrl}
        networkIsSelected={networkIsSelected}
        networkDefaultedToProvider={networkDefaultedToProvider}
        providerType={providerType}
        providerUrl={providerUrl}
        isFullScreen={isFullScreen}
      />
      {shouldRenderNetworkForm ? (
        <NetworkForm
          setRpcTarget={setRpcTarget}
          editRpc={editRpc}
          selectedNetwork={selectedNetwork}
          networksToRender={networksToRender}
          onClear={(shouldUpdateHistory = true) => {
            setSelectedSettingsRpcUrl('');
            if (shouldUpdateHistory) {
              history.push(NETWORKS_ROUTE);
            }
          }}
          showConfirmDeleteNetworkModal={showConfirmDeleteNetworkModal}
          isCurrentRpcTarget={providerUrl === selectedNetwork.rpcUrl}
        />
      ) : null}
    </>
  );
};
NetworkTabContent.propTypes = {
  setRpcTarget: PropTypes.func.isRequired,
  showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  selectedNetwork: PropTypes.object,
  editRpc: PropTypes.func.isRequired,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFullScreen: PropTypes.bool.isRequired,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
  networkIsSelected: PropTypes.bool,
  networkDefaultedToProvider: PropTypes.bool,
};
export default NetworkTabContent;

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import NetworkListItem from '../network-list-item';

const NetworkList = ({
  networksToRender,
  selectedNetwork,
  setSelectedSettingsRpcUrl,
  networkIsSelected,
  networkDefaultedToProvider,
  providerUrl,
  providerType,
  isFullScreen,
}) => {
  return (
    <div
      className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection':
          networkIsSelected && !networkDefaultedToProvider,
      })}
    >
      {networksToRender.map((network) => (
        <NetworkListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          selectedNetwork={selectedNetwork}
          selectRpcUrl={selectedNetwork.rpcUrl}
          setSelectedSettingsRpcUrl={setSelectedSettingsRpcUrl}
          networkIsSelected={networkIsSelected}
          providerUrl={providerUrl}
          providerType={providerType}
          isFullScreen={isFullScreen}
        />
      ))}
    </div>
  );
};

NetworkList.propTypes = {
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  networkIsSelected: PropTypes.bool,
  networkDefaultedToProvider: PropTypes.bool,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  isFullScreen: PropTypes.bool.isRequired,
};

export default NetworkList;

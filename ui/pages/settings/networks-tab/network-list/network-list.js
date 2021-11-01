import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import NetworkListItem from '../network-list-item';

const NetworkList = ({
  isFullScreen,
  networkIsSelected,
  networksToRender,
  networkDefaultedToProvider,
  providerType,
  providerUrl,
  selectedRpcUrl,
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
          selectedRpcUrl={selectedRpcUrl}
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
  isFullScreen: PropTypes.bool.isRequired,
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  providerType: PropTypes.string,
  providerUrl: PropTypes.string,
  selectedRpcUrl: PropTypes.string,
};

export default NetworkList;

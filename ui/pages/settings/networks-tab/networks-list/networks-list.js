import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import NetworksListItem from '../networks-list-item';

const NetworksList = ({
  networkIsSelected,
  networksToRender,
  networkDefaultedToProvider,
  selectedRpcUrl,
}) => {
  return (
    <div
      className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection':
          networkIsSelected && !networkDefaultedToProvider,
      })}
    >
      {networksToRender.map((network, index) => (
        <NetworksListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          networkIsSelected={networkIsSelected}
          selectedRpcUrl={selectedRpcUrl}
          networkIndex={index}
        />
      ))}
    </div>
  );
};

NetworksList.propTypes = {
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedRpcUrl: PropTypes.string,
};

export default NetworksList;

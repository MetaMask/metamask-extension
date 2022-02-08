import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Typography from '../../../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../../helpers/constants/design-system';
import NetworksListItem from '../networks-list-item';

const NetworksList = ({
  networkIsSelected,
  networksToRender,
  networkDefaultedToProvider,
  selectedRpcUrl,
}) => {
  const t = useI18nContext();

  const testNetworksToRender = networksToRender
    .map((network) => network)
    .filter((network) => {
      return network.userIsCurrentlyOnATestNet ? network : null;
    });

  const customNetworksToRender = networksToRender
    .map((network) => network)
    .filter((network) => {
      return network.userIsCurrentlyOnATestNet === false ? network : null;
    });
  return (
    <div
      className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection':
          networkIsSelected && !networkDefaultedToProvider,
      })}
    >
      {customNetworksToRender.map((network, index) => (
        <NetworksListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          networkIsSelected={networkIsSelected}
          selectedRpcUrl={selectedRpcUrl}
          networkIndex={index}
        />
      ))}
      <Typography
        variant={TYPOGRAPHY.H7}
        margin={[6, 0, 0, 0]}
        color={COLORS.UI3}
        fontWeight={FONT_WEIGHT.BOLD}
        className="networks-tab__networks-list__label"
      >
        {t('testNetworks')}
      </Typography>
      {testNetworksToRender.map((network, index) => (
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

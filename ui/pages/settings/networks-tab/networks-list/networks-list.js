import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CustomContentSearch from '../custom-content-search';
import Typography from '../../../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import NetworksListItem from '../networks-list-item';

const NetworksList = ({
  networkIsSelected,
  networksToRender,
  networkDefaultedToProvider,
  selectedRpcUrl,
}) => {
  const t = useI18nContext();
  const [networks, setNetworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const networksToRenderProperly =
    networks.length === 0 && searchQuery === '' ? networksToRender : networks;

  return (
    <div
      className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection':
          networkIsSelected && !networkDefaultedToProvider,
      })}
    >
      <CustomContentSearch
        onSearch={({
          searchQuery: newSearchQuery = '',
          results: newResults = [],
        }) => {
          setNetworks(newResults);
          setSearchQuery(newSearchQuery);
        }}
        error={
          networksToRenderProperly.length === 0 ? t('networkSearchError') : null
        }
        networksList={networksToRender}
      />
      {networksToRenderProperly.map(
        (network, index) =>
          network.userIsCurrentlyOnATestNet === false && (
            <NetworksListItem
              key={`settings-network-list:${network.rpcUrl}`}
              network={network}
              networkIsSelected={networkIsSelected}
              selectedRpcUrl={selectedRpcUrl}
              networkIndex={index}
            />
          ),
      )}
      {searchQuery === '' && (
        <Typography
          variant={TYPOGRAPHY.H6}
          margin={[6, 0, 0, 7]}
          color={COLORS.UI3}
          className="networks-tab__networks-list__label"
        >
          {t('testNetworks')}
        </Typography>
      )}
      {networksToRenderProperly.map(
        (network, index) =>
          network.userIsCurrentlyOnATestNet && (
            <NetworksListItem
              key={`settings-network-list:${network.rpcUrl}`}
              network={network}
              networkIsSelected={networkIsSelected}
              selectedRpcUrl={selectedRpcUrl}
              networkIndex={index}
            />
          ),
      )}
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

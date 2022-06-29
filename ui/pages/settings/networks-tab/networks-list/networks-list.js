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
  const [searchedNetworks, setSearchedNetworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchedNetworksToRender =
    searchedNetworks.length === 0 && searchQuery === ''
      ? networksToRender
      : searchedNetworks;
  const searchedNetworksToRenderThatAreNotTestNetworks = searchedNetworksToRender.filter(
    (network) => !network.isATestNetwork,
  );
  const searchedNetworksToRenderThatAreTestNetworks = searchedNetworksToRender.filter(
    (network) => network.isATestNetwork,
  );

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
          setSearchedNetworks(newResults);
          setSearchQuery(newSearchQuery);
        }}
        error={
          searchedNetworksToRender.length === 0
            ? t('settingsSearchMatchingNotFound')
            : null
        }
        networksList={networksToRender}
        searchQueryInput={searchQuery}
      />
      {searchedNetworksToRenderThatAreNotTestNetworks.map((network, _) => (
        <NetworksListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          networkIsSelected={networkIsSelected}
          selectedRpcUrl={selectedRpcUrl}
          setSearchQuery={setSearchQuery}
          setSearchedNetworks={setSearchedNetworks}
        />
      ))}
      {searchQuery === '' && (
        <Typography
          variant={TYPOGRAPHY.H6}
          marginTop={4}
          color={COLORS.TEXT_ALTERNATIVE}
          className="networks-tab__networks-list__label"
        >
          {t('testNetworks')}
        </Typography>
      )}
      {searchedNetworksToRenderThatAreTestNetworks.map((network, _) => (
        <NetworksListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          networkIsSelected={networkIsSelected}
          selectedRpcUrl={selectedRpcUrl}
          setSearchQuery={setSearchQuery}
          setSearchedNetworks={setSearchedNetworks}
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

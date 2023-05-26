import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CustomContentSearch from '../custom-content-search';
import {
  Color,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import NetworksListItem from '../networks-list-item';
import { Text } from '../../../../components/component-library';

const NetworksList = ({
  networkIsSelected,
  networksToRender,
  networkDefaultedToProvider,
  selectedNetworkConfigurationId,
}) => {
  const t = useI18nContext();
  const [searchedNetworks, setSearchedNetworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchedNetworksToRender =
    searchedNetworks.length === 0 && searchQuery === ''
      ? networksToRender
      : searchedNetworks;
  const searchedNetworksToRenderThatAreNotTestNetworks =
    searchedNetworksToRender.filter((network) => !network.isATestNetwork);
  const searchedNetworksToRenderThatAreTestNetworks =
    searchedNetworksToRender.filter((network) => network.isATestNetwork);

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
          selectedNetworkConfigurationId={selectedNetworkConfigurationId}
          setSearchQuery={setSearchQuery}
          setSearchedNetworks={setSearchedNetworks}
        />
      ))}
      {searchQuery === '' && (
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          marginTop={4}
          color={Color.textAlternative}
          className="networks-tab__networks-list__label"
        >
          {t('testNetworks')}
        </Text>
      )}
      {searchedNetworksToRenderThatAreTestNetworks.map((network, _) => (
        <NetworksListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          networkIsSelected={networkIsSelected}
          selectedNetworkConfigurationId={selectedNetworkConfigurationId}
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
  selectedNetworkConfigurationId: PropTypes.string,
};

export default NetworksList;

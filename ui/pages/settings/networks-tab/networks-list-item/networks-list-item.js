import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { setSelectedNetworkConfigurationId } from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { getProvider } from '../../../../selectors';
import Identicon from '../../../../components/ui/identicon';
import UrlIcon from '../../../../components/ui/url-icon';

import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../../../components/component-library';
import { IconColor } from '../../../../helpers/constants/design-system';

const NetworksListItem = ({
  network,
  networkIsSelected,
  selectedNetworkConfigurationId,
  setSearchQuery,
  setSearchedNetworks,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const provider = useSelector(getProvider);
  const {
    label,
    labelKey,
    networkConfigurationId,
    rpcUrl,
    providerType: currentProviderType,
  } = network;

  const listItemNetworkIsSelected =
    selectedNetworkConfigurationId &&
    selectedNetworkConfigurationId === networkConfigurationId;
  const listItemUrlIsProviderUrl = rpcUrl === provider.rpcUrl;
  const listItemTypeIsProviderNonRpcType =
    provider.type !== NETWORK_TYPES.RPC &&
    currentProviderType === provider.type;
  const listItemNetworkIsCurrentProvider =
    !networkIsSelected &&
    (listItemUrlIsProviderUrl || listItemTypeIsProviderNonRpcType);
  const displayNetworkListItemAsSelected =
    listItemNetworkIsSelected || listItemNetworkIsCurrentProvider;
  const isCurrentRpcTarget =
    listItemUrlIsProviderUrl || listItemTypeIsProviderNonRpcType;

  const settingsRefs = useRef();

  useEffect(() => {
    handleSettingsRefs(t, t('networks'), settingsRefs);
  }, [settingsRefs, t]);

  return (
    <div
      ref={settingsRefs}
      key={`settings-network-list-item:${networkConfigurationId}`}
      className="networks-tab__networks-list-item"
      onClick={() => {
        setSearchQuery('');
        setSearchedNetworks([]);
        dispatch(setSelectedNetworkConfigurationId(networkConfigurationId));
        if (!isFullScreen) {
          global.platform.openExtensionInBrowser(NETWORKS_ROUTE);
        }
      }}
    >
      {isCurrentRpcTarget ? (
        <Icon name={ICON_NAMES.CHECK} color={IconColor.successDefault} />
      ) : (
        <Icon name={ICON_NAMES.CHECK} color={IconColor.transparent} />
      )}
      {network.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
        <Identicon
          className="networks-tab__content__custom-image"
          diameter={24}
          image={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
          imageBorder
        />
      ) : (
        !network.isATestNetwork && (
          <UrlIcon
            className="networks-tab__content__icon-with-fallback"
            fallbackClassName="networks-tab__content__icon-with-fallback"
            name={label}
          />
        )
      )}
      {network.isATestNetwork && (
        <UrlIcon
          name={label || labelKey}
          fallbackClassName={classnames(
            'networks-tab__content__icon-with-fallback',
            {
              [`networks-tab__content__icon-with-fallback--color-${labelKey}`]: true,
            },
          )}
        />
      )}
      <div
        className={classnames('networks-tab__networks-list-name', {
          'networks-tab__networks-list-name--selected':
            displayNetworkListItemAsSelected,
          'networks-tab__networks-list-name--disabled':
            currentProviderType !== NETWORK_TYPES.RPC &&
            !displayNetworkListItemAsSelected,
        })}
      >
        {label || t(labelKey)}
        {currentProviderType !== NETWORK_TYPES.RPC && (
          <Icon
            name={ICON_NAMES.LOCK}
            color={IconColor.iconMuted}
            size={ICON_SIZES.AUTO}
            marginInlineStart={2}
          />
        )}
      </div>
    </div>
  );
};

NetworksListItem.propTypes = {
  network: PropTypes.object.isRequired,
  networkIsSelected: PropTypes.bool,
  selectedNetworkConfigurationId: PropTypes.string,
  setSearchQuery: PropTypes.func,
  setSearchedNetworks: PropTypes.func,
};

export default NetworksListItem;

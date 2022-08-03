import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  NETWORK_TYPE_RPC,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../../shared/constants/network';
import LockIcon from '../../../../components/ui/lock-icon';
import IconCheck from '../../../../components/ui/icon/icon-check';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { getProvider } from '../../../../selectors';
import Identicon from '../../../../components/ui/identicon';
import UrlIcon from '../../../../components/ui/url-icon';

import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';

const NetworksListItem = ({
  network,
  networkIsSelected,
  selectedRpcUrl,
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
    rpcUrl,
    providerType: currentProviderType,
  } = network;

  const listItemNetworkIsSelected = selectedRpcUrl && selectedRpcUrl === rpcUrl;
  const listItemUrlIsProviderUrl = rpcUrl === provider.rpcUrl;
  const listItemTypeIsProviderNonRpcType =
    provider.type !== NETWORK_TYPE_RPC && currentProviderType === provider.type;
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
      key={`settings-network-list-item:${rpcUrl}`}
      className="networks-tab__networks-list-item"
      onClick={() => {
        setSearchQuery('');
        setSearchedNetworks([]);
        dispatch(setSelectedSettingsRpcUrl(rpcUrl));
        if (!isFullScreen) {
          global.platform.openExtensionInBrowser(NETWORKS_ROUTE);
        }
      }}
    >
      {isCurrentRpcTarget ? (
        <IconCheck
          className="networks-tab__content__icon-check"
          color="var(--color-success-default)"
          aria-label={t('active')}
        />
      ) : (
        <IconCheck
          className="networks-tab__content__icon-check"
          color="transparent"
          aria-hidden="true"
        />
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
          'networks-tab__networks-list-name--selected': displayNetworkListItemAsSelected,
          'networks-tab__networks-list-name--disabled':
            currentProviderType !== NETWORK_TYPE_RPC &&
            !displayNetworkListItemAsSelected,
        })}
      >
        {label || t(labelKey)}
        {currentProviderType !== NETWORK_TYPE_RPC && (
          <LockIcon width="14px" height="17px" fill="var(--color-icon-muted)" />
        )}
      </div>
    </div>
  );
};

NetworksListItem.propTypes = {
  network: PropTypes.object.isRequired,
  networkIsSelected: PropTypes.bool,
  selectedRpcUrl: PropTypes.string,
  setSearchQuery: PropTypes.func,
  setSearchedNetworks: PropTypes.func,
};

export default NetworksListItem;

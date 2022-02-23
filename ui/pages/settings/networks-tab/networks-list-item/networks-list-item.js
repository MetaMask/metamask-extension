import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network';
import LockIcon from '../../../../components/ui/lock-icon';
import { NETWORKS_FORM_ROUTE } from '../../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { getProvider } from '../../../../selectors';
import Identicon from '../../../../components/ui/identicon';
import { getNetworkImageByChainId } from '../../../swaps/swaps.util';
import UrlIcon from '../../../../components/ui/url-icon/url-icon';

import { handleHooksSettingsRefs } from '../../../../helpers/utils/settings-search';

const NetworksListItem = ({
  network,
  networkIsSelected,
  selectedRpcUrl,
  networkIndex,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const environmentType = getEnvironmentType();
  const networkImageIcon = getNetworkImageByChainId(network.chainId);
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
    handleHooksSettingsRefs(t, t('networks'), settingsRefs, networkIndex);
  }, [networkIndex, settingsRefs, t]);
  
  return (
    <div
      ref={settingsRefs}
      key={`settings-network-list-item:${rpcUrl}`}
      className="networks-tab__networks-list-item"
      onClick={() => {
        dispatch(setSelectedSettingsRpcUrl(rpcUrl));
        if (!isFullScreen) {
          history.push(NETWORKS_FORM_ROUTE);
        }
      }}
    >
      {isCurrentRpcTarget ? (
        <i className="fa fa-check networks-tab__content__check-icon" />
      ) : (
        <div className="networks-tab__content__check-icon__transparent">✓</div>
      )}
      {networkImageIcon ? (
        <Identicon
          className="networks-tab__content__custom-image"
          diameter={24}
          image={networkImageIcon}
          imageBorder
        />
      ) : (
        network.userIsCurrentlyOnATestNet === false && (
          <UrlIcon
            className="networks-tab__content__icon-with-fallback"
            fallbackClassName="networks-tab__content__icon-with-fallback"
            name={label}
          />
        )
      )}
      {network.userIsCurrentlyOnATestNet && (
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
  networkIndex: PropTypes.number,
};

export default NetworksListItem;

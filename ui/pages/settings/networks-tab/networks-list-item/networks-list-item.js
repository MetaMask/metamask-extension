import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network';
import { SIZES } from '../../../../helpers/constants/design-system';
import ColorIndicator from '../../../../components/ui/color-indicator';
import LockIcon from '../../../../components/ui/lock-icon';
import { NETWORKS_FORM_ROUTE } from '../../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { getProvider } from '../../../../selectors';

const NetworksListItem = ({ network, networkIsSelected, selectedRpcUrl }) => {
  const t = useI18nContext();
  const history = useHistory();
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

  return (
    <div
      key={`settings-network-list-item:${rpcUrl}`}
      className="networks-tab__networks-list-item"
      onClick={() => {
        dispatch(setSelectedSettingsRpcUrl(rpcUrl));
        if (!isFullScreen) {
          history.push(NETWORKS_FORM_ROUTE);
        }
      }}
    >
      <ColorIndicator
        color={labelKey}
        type={ColorIndicator.TYPES.FILLED}
        size={SIZES.LG}
      />
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
          <LockIcon width="14px" height="17px" fill="#cdcdcd" />
        )}
      </div>
      <div className="networks-tab__networks-list-arrow" />
    </div>
  );
};

NetworksListItem.propTypes = {
  network: PropTypes.object.isRequired,
  networkIsSelected: PropTypes.bool,
  selectedRpcUrl: PropTypes.string,
};

export default NetworksListItem;

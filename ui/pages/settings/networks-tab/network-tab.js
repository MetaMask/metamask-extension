import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ADD_NETWORK_ROUTE,
  NETWORKS_FORM_ROUTE,
} from '../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../store/actions';
import Button from '../../../components/ui/button';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import {
  getFrequentRpcListDetail,
  getNetworksTabSelectedRpcUrl,
  getProvider,
} from '../../../selectors';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import { defaultNetworksData } from './networks-tab.constants';
import NetworkTabContent from './network-tab-content';
import NetworkForm from './network-form';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const SubHeader = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const history = useHistory();
  return addNewNetwork ? (
    <div className="networks-tab__subheader">
      <span className="networks-tab__sub-header-text">{t('networks')}</span>
      <span>{'  >  '}</span>
      <div className="networks-tab__subheader--break">{t('addANetwork')}</div>
    </div>
  ) : (
    <div className="settings-page__sub-header">
      <span className="settings-page__sub-header-text">{t('networks')}</span>
      <div className="networks-tab__add-network-header-button-wrapper">
        <Button
          type="primary"
          onClick={(event) => {
            event.preventDefault();
            history.push(ADD_NETWORK_ROUTE);
          }}
        >
          {t('addANetwork')}
        </Button>
      </div>
    </div>
  );
};

SubHeader.propTypes = {
  addNewNetwork: PropTypes.bool.isRequired,
};

const NetworkTab = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const shouldRenderNetworkForm =
    isFullScreen || Boolean(pathname.match(NETWORKS_FORM_ROUTE));
  const addNewNetwork = Boolean(pathname.match(ADD_NETWORK_ROUTE));

  const frequentRpcListDetail = useSelector(getFrequentRpcListDetail);
  const provider = useSelector(getProvider);
  const networksTabSelectedRpcUrl = useSelector(getNetworksTabSelectedRpcUrl);

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map((rpc) => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: NETWORK_TYPE_RPC,
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
      blockExplorerUrl: rpc.rpcPrefs?.blockExplorerUrl || '',
    };
  });

  const networksToRender = [
    ...defaultNetworks,
    ...frequentRpcNetworkListDetails,
  ];
  let selectedNetwork =
    networksToRender.find(
      (network) => network.rpcUrl === networksTabSelectedRpcUrl,
    ) || {};
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl);

  let networkDefaultedToProvider = false;
  if (!networkIsSelected) {
    selectedNetwork =
      networksToRender.find((network) => {
        return (
          network.rpcUrl === provider.rpcUrl ||
          (network.providerType !== NETWORK_TYPE_RPC &&
            network.providerType === provider.type)
        );
      }) || {};
    networkDefaultedToProvider = true;
  }

  useEffect(() => {
    return () => {
      dispatch(setSelectedSettingsRpcUrl(''));
    };
  }, [dispatch]);

  return (
    <div className="networks-tab__body">
      {isFullScreen ? <SubHeader addNewNetwork={addNewNetwork} /> : null}
      <div className="networks-tab__content">
        {addNewNetwork ? (
          <NetworkForm
            networksToRender={networksToRender}
            addNewNetwork={addNewNetwork}
          />
        ) : (
          <>
            <NetworkTabContent
              networkDefaultedToProvider={networkDefaultedToProvider}
              networkIsSelected={networkIsSelected}
              networksToRender={networksToRender}
              providerUrl={provider.rpcUrl}
              selectedNetwork={selectedNetwork}
              shouldRenderNetworkForm={shouldRenderNetworkForm}
            />
            {!isFullScreen && !shouldRenderNetworkForm ? (
              <div className="networks-tab__networks-list-popup-footer">
                <Button
                  type="primary"
                  onClick={(event) => {
                    event.preventDefault();
                    global.platform.openExtensionInBrowser(ADD_NETWORK_ROUTE);
                  }}
                >
                  {t('addNetwork')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkTab;

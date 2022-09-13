import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useLocation, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
  NETWORKS_FORM_ROUTE,
} from '../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../store/actions';
import Button from '../../../components/ui/button';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import {
  getFrequentRpcListDetail,
  getIsCustomNetworkListEnabled,
  getNetworksTabSelectedRpcUrl,
  getProvider,
} from '../../../selectors';
import {
  NETWORK_TYPE_RPC,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { defaultNetworksData } from './networks-tab.constants';
import NetworksTabContent from './networks-tab-content';
import NetworksForm from './networks-form';
import NetworksFormSubheader from './networks-tab-subheader';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
  isATestNetwork: TEST_CHAINS.includes(network.chainId),
}));

const NetworksTab = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const history = useHistory();

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const shouldRenderNetworkForm =
    isFullScreen ||
    Boolean(pathname.match(NETWORKS_FORM_ROUTE)) ||
    window.location.hash.split('#')[2] === 'blockExplorerUrl';

  const frequentRpcListDetail = useSelector(getFrequentRpcListDetail);
  const provider = useSelector(getProvider);
  const networksTabSelectedRpcUrl = useSelector(getNetworksTabSelectedRpcUrl);
  const addPopularNetworkFeatureToggledOn = useSelector(
    getIsCustomNetworkListEnabled,
  );

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map((rpc) => {
    return {
      label: rpc.nickname,
      iconColor: 'var(--color-icon-alternative)',
      providerType: NETWORK_TYPE_RPC,
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
      blockExplorerUrl: rpc.rpcPrefs?.blockExplorerUrl || '',
      isATestNetwork: TEST_CHAINS.includes(rpc.chainId),
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
      {isFullScreen ? (
        <NetworksFormSubheader addNewNetwork={addNewNetwork} />
      ) : null}
      <div
        className={classnames('networks-tab__content', {
          'networks-tab__content--with-networks-list-popup-footer':
            !isFullScreen && !shouldRenderNetworkForm,
        })}
      >
        {addNewNetwork ? (
          <NetworksForm
            networksToRender={networksToRender}
            addNewNetwork={addNewNetwork}
          />
        ) : (
          <>
            <NetworksTabContent
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
                  onClick={() => {
                    if (addPopularNetworkFeatureToggledOn) {
                      history.push(ADD_POPULAR_CUSTOM_NETWORK);
                    } else {
                      isFullScreen
                        ? history.push(ADD_NETWORK_ROUTE)
                        : global.platform.openExtensionInBrowser(
                            ADD_NETWORK_ROUTE,
                          );
                    }
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

NetworksTab.propTypes = {
  addNewNetwork: PropTypes.bool,
};
export default NetworksTab;

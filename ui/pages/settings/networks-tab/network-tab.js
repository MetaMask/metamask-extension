import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ADD_NETWORK_ROUTE,
  NETWORKS_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import Button from '../../../components/ui/button';
import NetworkForm from './network-form';
import NetworkTabContent from './network-tab-content';

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

const NetworkTab = ({
  editRpc,
  networkIsSelected,
  networksToRender,
  selectedNetwork,
  setRpcTarget,
  setSelectedSettingsRpcUrl,
  showConfirmDeleteNetworkModal,
  providerUrl,
  providerType,
  networkDefaultedToProvider,
  shouldRenderNetworkForm,
  isFullScreen,
  setNewNetworkAdded,
  addNewNetwork,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  useEffect(() => {
    return () => {
      setSelectedSettingsRpcUrl('');
    };
  }, [setSelectedSettingsRpcUrl]);
  return (
    <div className="networks-tab__body">
      {isFullScreen ? <SubHeader addNewNetwork={addNewNetwork} /> : null}
      <div className="networks-tab__content">
        {addNewNetwork ? (
          <NetworkForm
            setRpcTarget={setRpcTarget}
            onClear={(shouldUpdateHistory = true) => {
              if (shouldUpdateHistory) {
                history.push(NETWORKS_ROUTE);
              }
            }}
            onAddNetwork={() => {
              history.push(DEFAULT_ROUTE);
            }}
            rpcPrefs={selectedNetwork.rpcPrefs}
            networksToRender={networksToRender}
            setNewNetworkAdded={setNewNetworkAdded}
            addNewNetwork={addNewNetwork}
            history={history}
          />
        ) : (
          <>
            <NetworkTabContent
              setRpcTarget={setRpcTarget}
              showConfirmDeleteNetworkModal={showConfirmDeleteNetworkModal}
              setSelectedSettingsRpcUrl={setSelectedSettingsRpcUrl}
              selectedNetwork={selectedNetwork}
              editRpc={editRpc}
              providerUrl={providerUrl}
              providerType={providerType}
              networkDefaultedToProvider={networkDefaultedToProvider}
              networksToRender={networksToRender}
              isFullScreen={isFullScreen}
              shouldRenderNetworkForm={shouldRenderNetworkForm}
              networkIsSelected={networkIsSelected}
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

NetworkTab.propTypes = {
  editRpc: PropTypes.func.isRequired,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  setRpcTarget: PropTypes.func.isRequired,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  networkDefaultedToProvider: PropTypes.bool,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
  isFullScreen: PropTypes.bool.isRequired,
  setNewNetworkAdded: PropTypes.func.isRequired,
  addNewNetwork: PropTypes.bool,
};

export default NetworkTab;
